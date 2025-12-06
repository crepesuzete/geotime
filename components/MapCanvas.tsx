import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapItem, LatLng, IconType } from '../types';
import { TACTICAL_ICONS, MAP_LAYERS, INITIAL_CENTER, INITIAL_ZOOM, SATELLITE_LABELS_URL } from '../constants';
import { Trash2, Save, Clock, Type, FileText, Palette, Calendar, Circle as CircleIcon, Scan, Crosshair, Image as ImageIcon, Upload, X, Eye, Compass, MoveDiagonal, Target } from 'lucide-react';

// Fix Leaflet's default icon path issues using CDN for browser environment
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TACTICAL_COLORS = [
    '#3b82f6', // Azul (Aliado/Polícia)
    '#ef4444', // Vermelho (Hostil/Bombeiro)
    '#22c55e', // Verde (Exército/Seguro)
    '#eab308', // Amarelo (Atenção/Desconhecido)
    '#a855f7', // Roxo (Tecnologia/Drone)
    '#f97316', // Laranja (Imprensa/Civil)
    '#1f2937', // Cinza Escuro (Estrutura)
    '#6b7280', // Cinza Claro (Neutro)
];

// --- GEOMETRY HELPERS FOR FIELD OF VIEW ---
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

const getDestinationPoint = (lat: number, lng: number, distanceMeters: number, bearingDegrees: number): LatLng => {
    // Validate inputs to prevent NaN
    if (typeof lat !== 'number' || !Number.isFinite(lat) || 
        typeof lng !== 'number' || !Number.isFinite(lng) || 
        typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters) || 
        typeof bearingDegrees !== 'number' || !Number.isFinite(bearingDegrees)) {
        return { lat: 0, lng: 0 };
    }

    const R = 6371e3; // Earth Radius in meters
    const bearing = toRad(bearingDegrees);
    const lat1 = toRad(lat);
    const lon1 = toRad(lng);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceMeters / R) +
        Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceMeters / R) * Math.cos(lat1),
        Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2));

    const resLat = toDeg(lat2);
    const resLng = toDeg(lon2);

    // Final safety check
    if (!Number.isFinite(resLat) || !Number.isFinite(resLng)) return { lat: 0, lng: 0 };

    return {
        lat: resLat,
        lng: resLng
    };
};

const createViewConePath = (center: LatLng, range: number, direction: number, spread: number): LatLng[] => {
    if (!center || typeof center.lat !== 'number' || !Number.isFinite(center.lat) || typeof center.lng !== 'number' || !Number.isFinite(center.lng)) return [];

    const points: LatLng[] = [center];
    const segments = 20; // Resolution of the arc
    const startAngle = direction - (spread / 2);
    const endAngle = direction + (spread / 2);
    
    for (let i = 0; i <= segments; i++) {
        const bearing = startAngle + ((endAngle - startAngle) * i) / segments;
        const pt = getDestinationPoint(center.lat, center.lng, range, bearing);
        if (Number.isFinite(pt.lat) && Number.isFinite(pt.lng)) {
            points.push(pt);
        }
    }
    
    // Close the shape back to center is handled by Polygon implicitly, but adding it makes logic clear
    points.push(center);
    return points;
};

// --- END GEOMETRY HELPERS ---


interface Props {
  items: MapItem[];
  currentTime: number;
  baseLayer: 'osm' | 'satellite' | 'dark';
  onDrop: (type: IconType, pos: LatLng) => void;
  onMapClick: (pos: LatLng) => void;
  drawingPath: LatLng[];
  drawingMode: string | null;
  mapCenter: LatLng;
  mapZoom: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MapItem>) => void;
  isMeasuring: boolean;
  onMeasureComplete: () => void;
  onMapMove: (pos: LatLng) => void;
  flyTrigger: number; // New Prop: Only trigger flyTo when this changes
}

// Helper to create custom DivIcon from React Component
// NOW ACCEPTS DYNAMIC SIZE
const createTacticalIcon = (type: IconType, color: string, size: number, customIconUrl?: string) => {
  const def = TACTICAL_ICONS.find(t => t.type === type);
  
  const iconMarkup = renderToStaticMarkup(
    <div className="tactical-marker" style={{ width: `${size}px`, height: `${size}px` }}>
       <div 
          className="marker-icon-wrapper shadow-lg"
          style={{ 
              width: '100%',
              height: '100%',
              backgroundColor: customIconUrl ? 'transparent' : color, 
              border: customIconUrl ? 'none' : '2px solid #000000',
              borderRadius: '50%',
              color: '#ffffff',
              overflow: 'hidden' // Ensure custom image stays in circle
          }}
       >
         {customIconUrl ? (
             <img src={customIconUrl} alt="custom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         ) : (
             def ? def.iconNode : <span>?</span>
         )}
       </div>
    </div>
  );
  
  return L.divIcon({
    html: iconMarkup,
    className: '', // Remove default leaflet styles
    iconSize: [size, size],
    iconAnchor: [size/2, size/2], // Center it
  });
};

const formatTimeDisplay = (val: number) => {
    // Map 0-100 to 00:00 - 24:00
    const totalMinutes = (val / 100) * 1440;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Modified to also track zoom changes AND movement
const MapEvents = ({ 
    onDrop, 
    onMapClick, 
    onMouseMove, 
    onZoomChange,
    onMapMove
}: { 
    onDrop: (t: IconType, p: LatLng) => void, 
    onMapClick: (p: LatLng) => void, 
    onMouseMove: (p: LatLng) => void,
    onZoomChange: (z: number) => void,
    onMapMove: (p: LatLng) => void
}) => {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
    mousemove(e) {
      onMouseMove(e.latlng);
    },
    zoomend(e) {
        onZoomChange(e.target.getZoom());
    },
    // CRÍTICO: Detectar quando o usuário termina de arrastar o mapa
    moveend(e) {
        const center = map.getCenter();
        onMapMove(center);
    }
  });
  return null;
};

// Modified MapController: Only moves when flyTrigger changes
const MapController = ({ center, zoom, flyTrigger }: { center: LatLng, zoom: number, flyTrigger: number }) => {
    const map = useMap();
    
    // Initial fix for gray screen / rendering issues
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);

    // This effect ONLY runs when flyTrigger changes. 
    // It completely ignores changes to center/zoom unless triggered explicitly.
    useEffect(() => {
        if (center && typeof center.lat === 'number' && Number.isFinite(center.lat) && typeof center.lng === 'number' && Number.isFinite(center.lng)) {
             map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [flyTrigger, map]); // Removed center and zoom from dependency array to prevent elastic effect

    return null;
}

// Componente para editar itens dentro do Popup
interface ItemEditorProps {
    item: MapItem;
    onUpdate: (id: string, u: Partial<MapItem>) => void;
    onDelete: (id: string) => void;
}

const ItemEditor: React.FC<ItemEditorProps> = ({ item, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'gallery'>('info');
    const [name, setName] = useState(item.name);
    const [desc, setDesc] = useState(item.description || '');
    const [radius, setRadius] = useState(item.rangeRadius || 0);
    
    // View Cone State
    const [coneEnabled, setConeEnabled] = useState(item.viewCone?.enabled || false);
    const [coneRange, setConeRange] = useState(item.viewCone?.range || 100);
    const [coneDir, setConeDir] = useState(item.viewCone?.direction || 0);
    const [coneSpread, setConeSpread] = useState(item.viewCone?.spread || 60);

    // Targeting Vector State
    const [vectorEnabled, setVectorEnabled] = useState(item.targetingVector?.enabled || false);
    const [vectorRange, setVectorRange] = useState(item.targetingVector?.range || 500);
    const [vectorDir, setVectorDir] = useState(item.targetingVector?.direction || 0);

    // Timeline Relative
    const [start, setStart] = useState(item.startTime);
    const [end, setEnd] = useState(item.endTime || 100);

    // Calendar Dates
    const [dateStart, setDateStart] = useState(item.dateStart || '');
    const [dateEnd, setDateEnd] = useState(item.dateEnd || '');

    // Gallery
    const [images, setImages] = useState<string[]>(item.images || []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onUpdate(item.id, {
            name,
            description: desc,
            rangeRadius: Number(radius),
            startTime: Number(start),
            endTime: Number(end),
            dateStart: dateStart,
            dateEnd: dateEnd,
            images: images,
            viewCone: {
                enabled: coneEnabled,
                range: Number(coneRange),
                direction: Number(coneDir),
                spread: Number(coneSpread)
            },
            targetingVector: {
                enabled: vectorEnabled,
                range: Number(vectorRange),
                direction: Number(vectorDir)
            }
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        setImages(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="w-64 p-1 text-gray-800">
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-200 mb-2">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 text-[10px] font-bold uppercase py-1 ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Dados Táticos
                </button>
                <button 
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 text-[10px] font-bold uppercase py-1 ${activeTab === 'gallery' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Evidências ({images.length})
                </button>
            </div>

            {/* TAB CONTENT: INFO */}
            {activeTab === 'info' && (
                <>
                    <div className="mb-3 border-b border-gray-200 pb-2">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-1">
                            <Type size={12}/> Identificação
                        </label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-sm font-bold border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none"
                            placeholder="Nome do Item"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-1">
                            <Palette size={12}/> Cor / Status
                        </label>
                        <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded border border-gray-200 justify-between">
                            {TACTICAL_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onUpdate(item.id, { color });
                                    }}
                                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${item.color === color ? 'border-gray-600 scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Range Radius Setting */}
                    <div className="mb-3">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-1">
                            <Scan size={12}/> Raio de Alcance (m)
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="range" 
                                min="0" 
                                max="5000" 
                                step="50"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[10px] font-mono bg-gray-200 px-1 rounded w-10 text-center">{radius}m</span>
                        </div>
                    </div>

                    {/* VIEW CONE & VECTOR SETTINGS */}
                    <div className="mb-3 space-y-2">
                         {/* FOV */}
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-700">
                                    <Eye size={12}/> Cone de Visão (FOV)
                                </label>
                                <input 
                                    type="checkbox"
                                    checked={coneEnabled}
                                    onChange={(e) => setConeEnabled(e.target.checked)}
                                    className="toggle-checkbox"
                                />
                            </div>
                            
                            {coneEnabled && (
                                <div className="space-y-2 animate-in fade-in">
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                            <span className="flex gap-1 items-center"><Compass size={10}/> Direção</span>
                                            <span>{coneDir}°</span>
                                        </div>
                                        <input type="range" min="0" max="360" value={coneDir} onChange={e => setConeDir(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                            <span className="flex gap-1 items-center"><MoveDiagonal size={10}/> Abertura</span>
                                            <span>{coneSpread}°</span>
                                        </div>
                                        <input type="range" min="10" max="180" value={coneSpread} onChange={e => setConeSpread(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                            <span className="flex gap-1 items-center"><Scan size={10}/> Alcance</span>
                                            <span>{coneRange}m</span>
                                        </div>
                                        <input type="range" min="50" max="2000" step="10" value={coneRange} onChange={e => setConeRange(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TARGET VECTOR (WHITE LINE) */}
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                             <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                                    <Target size={12}/> Vetor de Disparo
                                </label>
                                <input 
                                    type="checkbox"
                                    checked={vectorEnabled}
                                    onChange={(e) => setVectorEnabled(e.target.checked)}
                                    className="toggle-checkbox"
                                />
                            </div>
                            {vectorEnabled && (
                                <div className="space-y-2 animate-in fade-in">
                                    <p className="text-[9px] text-red-400 italic mb-1">Linha branca direta (Sniper/Trajetória)</p>
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                            <span className="flex gap-1 items-center"><Compass size={10}/> Azimute (Tiro)</span>
                                            <span>{vectorDir}°</span>
                                        </div>
                                        <input type="range" min="0" max="360" value={vectorDir} onChange={e => setVectorDir(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                                            <span className="flex gap-1 items-center"><Scan size={10}/> Distância</span>
                                            <span>{vectorRange}m</span>
                                        </div>
                                        <input type="range" min="50" max="3000" step="10" value={vectorRange} onChange={e => setVectorRange(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-1">
                            <FileText size={12}/> Ação / Descrição
                        </label>
                        <textarea 
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-16 focus:border-blue-500 outline-none resize-none"
                            placeholder="Descreva a ação ou detalhes..."
                        />
                    </div>

                    {/* Agendamento Relativo (Timeline) */}
                    <div className="mb-2 bg-gray-100 p-2 rounded border border-gray-200">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-2">
                            <Clock size={12}/> Agendamento (Hora Op.)
                        </label>
                        <div className="flex gap-2 mb-1">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-gray-600 font-semibold">Início</span>
                                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1 rounded">{formatTimeDisplay(start)}</span>
                                </div>
                                <input 
                                    type="number" 
                                    min="0" max="100" 
                                    step="0.1"
                                    value={start} 
                                    onChange={(e) => setStart(Number(e.target.value))}
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-gray-600 font-semibold">Fim</span>
                                    <span className="text-[10px] font-mono bg-red-100 text-red-800 px-1 rounded">{formatTimeDisplay(end)}</span>
                                </div>
                                <input 
                                    type="number" 
                                    min="0" max="100" 
                                    step="0.1"
                                    value={end} 
                                    onChange={(e) => setEnd(Number(e.target.value))}
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Agendamento Real (Datas) */}
                    <div className="mb-3 bg-gray-50 p-2 rounded border border-gray-200">
                        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-2">
                            <Calendar size={12}/> Datas (Calendário)
                        </label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 w-8">De:</span>
                                <input 
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="flex-1 text-xs border border-gray-300 rounded px-1 py-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 w-8">Até:</span>
                                <input 
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="flex-1 text-xs border border-gray-300 rounded px-1 py-1"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* TAB CONTENT: GALLERY */}
            {activeTab === 'gallery' && (
                <div className="min-h-[250px]">
                    <div className="mb-3">
                         <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 mb-2">
                            <ImageIcon size={12}/> Dossiê de Imagens
                        </label>
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer p-4 flex flex-col items-center justify-center mb-3 transition-colors"
                        >
                            <Upload size={20} className="text-gray-400 mb-1"/>
                            <span className="text-[10px] text-gray-500 font-medium">Clique para anexar evidência</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group border border-gray-200 rounded overflow-hidden aspect-square">
                                        <img src={img} alt={`Evidência ${idx}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remover"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs text-gray-400 italic">
                                Nenhuma imagem anexada.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 sticky bottom-0 bg-white">
                <button 
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded transition-colors font-medium"
                >
                    <Save size={12} /> Salvar
                </button>
                <button 
                    onClick={() => onDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs py-1.5 rounded transition-colors"
                >
                    <Trash2 size={12} /> Excluir
                </button>
            </div>
        </div>
    );
}

// Subcomponente para Marcador Arrastável
interface TacticalMarkerItemProps {
    item: MapItem;
    onUpdate: (id: string, u: Partial<MapItem>) => void;
    onDelete: (id: string) => void;
    currentZoom: number;
}

const TacticalMarkerItem: React.FC<TacticalMarkerItemProps> = ({ item, onUpdate, onDelete, currentZoom }) => {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    onUpdate(item.id, { position: marker.getLatLng() });
                }
            },
        }),
        [item.id, onUpdate]
    );

    // Calculate dynamic size based on zoom
    // REVISED SCALING: Much smaller icons for tactical precision
    const dynamicSize = useMemo(() => {
        if (currentZoom < 10) return 10; 
        if (currentZoom < 14) return 18; 
        if (currentZoom < 16) return 24; 
        return 28; // Max size reduced to 28px
    }, [currentZoom]);

    // Memoize the icon creation to prevent flickering but allow updates on color change
    const icon = useMemo(() => {
        return createTacticalIcon(item.subType!, item.color, dynamicSize, item.customIconUrl);
    }, [item.subType, item.color, dynamicSize, item.customIconUrl]);

    // Calculate View Cone Path
    const viewConePath = useMemo(() => {
        if (!item.viewCone?.enabled || !item.viewCone?.range) return null;
        return createViewConePath(
            item.position, 
            item.viewCone.range, 
            item.viewCone.direction, 
            item.viewCone.spread
        );
    }, [item.position, item.viewCone]);

    // Calculate Targeting Vector (White Line)
    const targetVectorPath = useMemo(() => {
        if (!item.targetingVector?.enabled || !item.targetingVector?.range) return null;
        const endPoint = getDestinationPoint(
            item.position.lat,
            item.position.lng,
            item.targetingVector.range,
            item.targetingVector.direction
        );
        if (Number.isFinite(endPoint.lat) && Number.isFinite(endPoint.lng)) {
            return [item.position, endPoint];
        }
        return null;
    }, [item.position, item.targetingVector]);

    return (
        <>
            {/* Tactical Range Ring (If radius is set) */}
            {item.rangeRadius && item.rangeRadius > 0 && (
                <Circle 
                    center={item.position}
                    radius={item.rangeRadius}
                    pathOptions={{ 
                        color: item.color, 
                        weight: 1, 
                        dashArray: '5, 5', 
                        fillColor: item.color, 
                        fillOpacity: 0.1 
                    }}
                />
            )}

            {/* FIELD OF VIEW CONE */}
            {viewConePath && viewConePath.length > 0 && (
                <Polygon
                    positions={viewConePath}
                    pathOptions={{
                        color: item.color,
                        weight: 1,
                        fillColor: item.color,
                        fillOpacity: 0.2, // Semi-transparent for overlapping
                        stroke: true
                    }}
                />
            )}

            {/* TARGETING VECTOR (WHITE LINE) */}
            {targetVectorPath && (
                <Polyline
                    positions={targetVectorPath}
                    pathOptions={{
                        color: '#ffffff',
                        weight: 3,
                        opacity: 0.9,
                        dashArray: '0', // Solid line
                        lineCap: 'round'
                    }}
                >
                    <Tooltip sticky direction="center" className="tactical-tooltip" opacity={0.8}>
                       <span>Linha de Visada</span>
                    </Tooltip>
                </Polyline>
            )}

            <Marker
                ref={markerRef}
                position={item.position}
                icon={icon}
                draggable={!item.locked}
                eventHandlers={eventHandlers}
            >
                {/* Rótulo Tático: PERMANENTE, FUNDO PRETO, MAX 2 LINHAS, QUEBRA AUTOMÁTICA */}
                <Tooltip
                    permanent
                    direction="bottom"
                    offset={[0, dynamicSize/2]}
                    className="tactical-tooltip"
                    opacity={1}
                >
                    <span>{item.name}</span>
                </Tooltip>

                <Popup className="tactical-popup" minWidth={260}>
                    <ItemEditor item={item} onUpdate={onUpdate} onDelete={onDelete} />
                </Popup>
            </Marker>
        </>
    );
};


export const MapCanvas: React.FC<Props> = ({ 
  items, currentTime, baseLayer, onDrop, onMapClick, drawingPath, drawingMode, mapCenter, mapZoom, onDelete, onUpdate,
  isMeasuring, onMeasureComplete, onMapMove, flyTrigger
}) => {
  const mapRef = useRef<L.Map>(null);
  const [cursorPos, setCursorPos] = useState<LatLng | null>(null);
  const [measureStart, setMeasureStart] = useState<LatLng | null>(null);
  const [measureEnd, setMeasureEnd] = useState<LatLng | null>(null);
  const [currentZoom, setCurrentZoom] = useState(mapZoom);
  // NEW STATE: Current Center for HUD
  const [hudCenter, setHudCenter] = useState<LatLng>(INITIAL_CENTER);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('iconType') as IconType;
    if (type && mapRef.current) {
        const map = mapRef.current;
        // Convert screen coordinates to LatLng
        const pt = map.mouseEventToLatLng(e.nativeEvent as any);
        onDrop(type, pt);
    }
  };

  const handleMouseMove = (latlng: LatLng) => {
      setCursorPos(latlng);
  }

  const handleInternalMapClick = (latlng: LatLng) => {
      if (isMeasuring) {
          if (!measureStart) {
              setMeasureStart(latlng);
          } else {
              setMeasureEnd(latlng);
              // Don't close immediately, let user see result then they must toggle tool off
          }
      } else {
          onMapClick(latlng);
      }
  }

  // Filter items based on Timeline AND Valid Coordinates (Safety check for NaN)
  const visibleItems = items.filter(item => {
    // Basic coordinate validation
    if (!item.position || typeof item.position.lat !== 'number' || !Number.isFinite(item.position.lat) || typeof item.position.lng !== 'number' || !Number.isFinite(item.position.lng)) {
        return false;
    }
    
    // Check Path for polygons/polylines to ensure no NaN points exist
    if ((item.type === 'polygon' || item.type === 'polyline') && item.path) {
        const validPath = item.path.every(pt => typeof pt.lat === 'number' && Number.isFinite(pt.lat) && typeof pt.lng === 'number' && Number.isFinite(pt.lng));
        if (!validPath) return false;
    }

    if (!item.visible) return false;
    const started = currentTime >= item.startTime;
    const ended = item.endTime ? currentTime > item.endTime : false;
    return started && !ended;
  });

  // Measurement distance calculation
  const distance = useMemo(() => {
      if (measureStart && cursorPos) {
          // Safety check
          if (typeof measureStart.lat !== 'number' || !Number.isFinite(measureStart.lat) || 
              typeof measureStart.lng !== 'number' || !Number.isFinite(measureStart.lng) ||
              typeof cursorPos.lat !== 'number' || !Number.isFinite(cursorPos.lat) ||
              typeof cursorPos.lng !== 'number' || !Number.isFinite(cursorPos.lng)) {
              return 0;
          }

          const from = L.latLng(measureStart);
          const to = L.latLng(cursorPos);
          return from.distanceTo(to).toFixed(2); // meters
      }
      return 0;
  }, [measureStart, cursorPos]);

  // Reset measure when toggled off
  useEffect(() => {
      if (!isMeasuring) {
          setMeasureStart(null);
          setMeasureEnd(null);
      }
  }, [isMeasuring]);

  return (
    <div className="w-full h-full relative" onDragOver={handleDragOver} onDrop={handleDrop}>
      <MapContainer 
        center={INITIAL_CENTER} 
        zoom={INITIAL_ZOOM} 
        style={{ height: '100%', width: '100%', background: '#111827' }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer 
          url={MAP_LAYERS[baseLayer].url} 
          attribution={MAP_LAYERS[baseLayer].attribution}
          maxNativeZoom={17} // FIX: Reduced maxNativeZoom to 17 to prevent gray tiles at levels 18, 19, 20
          maxZoom={21}
        />
        
        {/* Camada de rótulos sobreposta ao Satélite (Híbrido) */}
        {baseLayer === 'satellite' && (
             <TileLayer 
                url={SATELLITE_LABELS_URL}
                zIndex={1000} // Force labels on top
                className="high-contrast-labels" // CSS class to boost brightness
             />
        )}
        
        <MapController center={mapCenter} zoom={mapZoom} flyTrigger={flyTrigger} />
        <MapEvents 
            onDrop={onDrop} 
            onMapClick={handleInternalMapClick} 
            onMouseMove={handleMouseMove} 
            onZoomChange={setCurrentZoom}
            onMapMove={(center) => {
                setHudCenter(center); // Update HUD immediately
                onMapMove(center);    // Sync global state
            }}
        />

        {/* Render Items */}
        {visibleItems.map(item => {
           if (item.type === 'marker' && item.subType) {
               return (
                   <TacticalMarkerItem 
                        key={item.id} 
                        item={item} 
                        onUpdate={onUpdate} 
                        onDelete={onDelete}
                        currentZoom={currentZoom}
                   />
               )
           }
           if (item.type === 'polygon' && item.path) {
               return (
                   <Polygon 
                        key={item.id}
                        positions={item.path}
                        pathOptions={{ color: item.color, fillColor: item.color, fillOpacity: 0.3 }}
                   >
                        <Tooltip direction="center" className="tactical-tooltip" opacity={0.9}>
                           <span>{item.name}</span>
                        </Tooltip>
                        <Popup className="tactical-popup" minWidth={260}>
                           <ItemEditor item={item} onUpdate={onUpdate} onDelete={onDelete} />
                        </Popup>
                   </Polygon>
               )
           }
           if (item.type === 'polyline' && item.path) {
                return (
                    <Polyline 
                        key={item.id}
                        positions={item.path}
                        pathOptions={{ color: item.color, weight: 4, dashArray: '10, 10' }}
                    >
                         <Tooltip direction="top" className="tactical-tooltip" opacity={0.9}>
                           <span>{item.name}</span>
                        </Tooltip>
                         <Popup className="tactical-popup" minWidth={260}>
                           <ItemEditor item={item} onUpdate={onUpdate} onDelete={onDelete} />
                         </Popup>
                    </Polyline>
                )
           }
           return null;
        })}

        {/* Render Drawing Path in Progress */}
        {drawingPath.length > 0 && (
            <>
                {drawingMode === 'polygon' && (
                    <Polygon positions={drawingPath} pathOptions={{ color: 'yellow', dashArray: '5, 5' }} />
                )}
                <Polyline positions={drawingPath} pathOptions={{ color: 'yellow', dashArray: '5, 5' }} />
                {drawingPath.map((pt, idx) => (
                    <Marker key={`draw-${idx}`} position={pt} opacity={0.6} />
                ))}
            </>
        )}

        {/* Measurement Tool Visualization */}
        {isMeasuring && measureStart && (
             <>
                <Marker position={measureStart} icon={L.divIcon({ className: 'bg-yellow-400 rounded-full w-3 h-3 border border-black' })} />
                <Polyline 
                    positions={[measureStart, cursorPos || measureStart]} 
                    pathOptions={{ color: '#fbbf24', weight: 2, dashArray: '5, 10' }} 
                />
                {cursorPos && (
                    <Tooltip position={cursorPos} permanent direction="right" offset={[10,0]} className="tactical-tooltip">
                        <span>{distance} m</span>
                    </Tooltip>
                )}
             </>
        )}
        {/* Fixed Line for finished measurement until toggled off */}
        {isMeasuring && measureStart && measureEnd && (
            <Polyline 
                positions={[measureStart, measureEnd]} 
                pathOptions={{ color: '#fbbf24', weight: 3 }} 
            />
        )}

      </MapContainer>

      {/* TACTICAL CROSSHAIR (MIRA) - CENTER OF SCREEN OVERLAY */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none flex flex-col items-center justify-center opacity-70">
          <Crosshair size={48} className="text-red-500/80" strokeWidth={1} />
          <div className="w-1 h-1 bg-red-500 rounded-full absolute shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
      </div>

      {/* Tactical HUD (Heads Up Display) */}
      <div className="absolute bottom-4 right-4 z-[400] bg-gray-900/80 backdrop-blur border border-gray-600 p-2 rounded text-[10px] font-mono text-blue-400 flex flex-col gap-1 pointer-events-none select-none shadow-xl">
            {/* NEW: MIRA TÁTICA COORDINATES */}
            <div className="flex items-center gap-2 border-b border-gray-700 pb-1 mb-1">
                <Target size={12} className="text-red-500" />
                <span className="text-red-400 font-bold">MIRA TGT: {hudCenter?.lat.toFixed(5)}, {hudCenter?.lng.toFixed(5)}</span>
            </div>
            {/* Cursor Coordinates */}
            <div className="flex items-center gap-2 text-gray-400">
                <Crosshair size={12} />
                <span>CURSOR: {cursorPos?.lat.toFixed(5) || '---'}, {cursorPos?.lng.toFixed(5) || '---'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 pt-1">
                <Scan size={12} />
                <span>ZOOM: {currentZoom}</span>
            </div>
      </div>
    </div>
  );
};