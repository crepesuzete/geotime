import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapCanvas } from './components/MapCanvas';
import { Timeline } from './components/Timeline';
import { DraggableIcon } from './components/DraggableIcon';
import { OrganogramModal } from './components/OrganogramModal';
import { SecurityPlanModal } from './components/SecurityPlanModal';
import { generateTacticalReport, findPointsOfInterest, generateTacticalScenario, getCoordinatesFromAI } from './services/geminiService';
import { 
  TACTICAL_ICONS, INITIAL_CENTER, INITIAL_ZOOM, DEMO_SCENARIO 
} from './constants';
import { 
  AppState, MapItem, IconType, LatLng, Scene 
} from './types';
import { 
  Layers, Map as MapIcon, Save, Upload, Download, FileText, 
  Trash2, PlaySquare, Plus, Check, X, Search, Activity, Camera,
  Share2, Clock, Ruler, Menu, Globe, Mic, Command, Loader2, PlayCircle, Monitor, Maximize2, Minimize2, Video, Square, GitFork, ShieldAlert, Shield, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';

const App = () => {
  // --- State ---
  const [items, setItems] = useState<MapItem[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [baseLayer, setBaseLayer] = useState<'osm'|'satellite'|'dark'>('dark');
  const [drawingMode, setDrawingMode] = useState<'polygon'|'line'|null>(null);
  const [drawingPath, setDrawingPath] = useState<LatLng[]>([]);
  const [mapCenter, setMapCenter] = useState<LatLng>(INITIAL_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(INITIAL_ZOOM);
  const [selectedTab, setSelectedTab] = useState<'icons'|'layers'|'narrative'|'analysis'|'timeline'>('icons');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  
  // Tactical Command State
  const [tacticalCommand, setTacticalCommand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Tactical Tools
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isOrganogramOpen, setIsOrganogramOpen] = useState(false);
  const [isSecurityPlanOpen, setIsSecurityPlanOpen] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Presentation Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Custom Icons State
  const [customIcons, setCustomIcons] = useState<any[]>([]);

  // NEW: Fly Trigger for Map Navigation
  const [flyTrigger, setFlyTrigger] = useState<number>(0);

  // Helper to trigger map movement
  const triggerFly = () => {
      setFlyTrigger(prev => prev + 1);
  };

  // Timeline Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (0.1 * playbackSpeed);
          return next > 100 ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('iconType', type);
  };

  // UPLOAD DE ÍCONES PERSONALIZADOS
  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (reader.result) {
                  const newCustomDef = {
                      type: `custom_${Date.now()}`,
                      label: 'Custom',
                      iconNode: <img src={reader.result as string} className="w-full h-full object-cover rounded-full" />,
                      defaultColor: '#ffffff',
                      isCustom: true,
                      imgUrl: reader.result as string
                  };
                  setCustomIcons(prev => [...prev, newCustomDef]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDropIcon = useCallback((type: IconType | string, pos: LatLng) => {
    let def = TACTICAL_ICONS.find(t => t.type === type);
    let customUrl = undefined;

    if (!def) {
        const custom = customIcons.find(c => c.type === type);
        if (custom) {
            def = custom;
            customUrl = custom.imgUrl;
        }
    }

    const newItem: MapItem = {
      id: uuidv4(),
      type: 'marker',
      subType: type as IconType,
      name: `${def?.label || 'Item'} ${items.length + 1}`,
      position: pos,
      color: def?.defaultColor || '#fff',
      visible: true,
      locked: false,
      startTime: currentTime,
      rangeRadius: 0,
      customIconUrl: customUrl
    };
    setItems(prev => [...prev, newItem]);
    if (window.innerWidth < 768) {
       setIsMobileMenuOpen(false);
    }
  }, [items.length, currentTime, customIcons]);

  const handleDeleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleUpdateItem = useCallback((id: string, updates: Partial<MapItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const handleMapClick = useCallback((pos: LatLng) => {
    if (drawingMode) {
        setDrawingPath(prev => [...prev, pos]);
    }
  }, [drawingMode]);

  const handleMapMove = useCallback((newCenter: LatLng) => {
      setMapCenter(newCenter);
  }, []);

  const finishDrawing = () => {
    if (drawingPath.length < 2) return;
    const newItem: MapItem = {
        id: uuidv4(),
        type: drawingMode === 'polygon' ? 'polygon' : 'polyline',
        name: `${drawingMode === 'polygon' ? 'Área' : 'Rota'} ${items.length + 1}`,
        position: drawingPath[0], 
        path: drawingPath,
        color: drawingMode === 'polygon' ? '#ef4444' : '#fbbf24',
        visible: true,
        locked: false,
        startTime: currentTime,
    };
    setItems(prev => [...prev, newItem]);
    setDrawingPath([]);
    setDrawingMode(null);
  };

  const cancelDrawing = () => {
    setDrawingPath([]);
    setDrawingMode(null);
  }

  const captureScene = () => {
      const newScene: Scene = {
          id: uuidv4(),
          title: `Cena ${scenes.length + 1}`,
          description: `Registro tático em T-${Math.floor(currentTime)}`,
          center: mapCenter,
          zoom: mapZoom,
          timestamp: currentTime,
          activeLayerIds: items.filter(i => i.visible).map(i => i.id)
      };
      setScenes(prev => [...prev, newScene]);
  };

  const restoreScene = (scene: Scene) => {
      if (scene.center && Number.isFinite(scene.center.lat) && Number.isFinite(scene.center.lng)) {
        setMapCenter(scene.center);
        setMapZoom(scene.zoom);
        setCurrentTime(scene.timestamp);
        triggerFly();
      }
  };

  const loadDemoScenario = () => {
      const demoItems = DEMO_SCENARIO.items.map(i => ({
          ...i,
          id: uuidv4(),
          visible: true
      }));
      
      const demoScenes = DEMO_SCENARIO.scenes.map(s => ({
          ...s,
          id: uuidv4()
      }));

      setItems(demoItems);
      setScenes(demoScenes);
      
      setMapCenter({ ...DEMO_SCENARIO.center }); 
      setMapZoom(DEMO_SCENARIO.zoom);
      setBaseLayer('satellite'); 
      setCurrentTime(0); 
      triggerFly(); 
      
      setAiOutput("Simulação Carregada: Operação Tempestade - Rio de Janeiro.\nStatus: Ativos posicionados. Cronograma tático pronto.\n\nDica: Dê o 'Play' na linha do tempo para visualizar a operação.");
  };

  const runAnalysis = async () => {
    setAiLoading(true);
    try {
        const report = await generateTacticalReport(items, scenes);
        setAiOutput(report);
    } catch (e) {
        setAiOutput("Erro ao conectar com a Inteligência Artificial. Verifique se o arquivo .env contém 'VITE_API_KEY=...'");
    } finally {
        setAiLoading(false);
    }
  };

  const executeTacticalCommand = async () => {
      if (!tacticalCommand.trim()) return;
      setAiLoading(true);
      try {
        console.log("Enviando comando para IA:", tacticalCommand, "Centro Ref:", mapCenter);
        const result = await generateTacticalScenario(tacticalCommand, mapCenter);
        
        if (result.error === 'API_KEY_MISSING') {
            setAiOutput("ERRO CRÍTICO: Chave de API não encontrada ou inválida.\n\nSOLUÇÃO:\n1. Abra o arquivo '.env' na pasta do projeto.\n2. Certifique-se que a linha seja: VITE_API_KEY=sua_chave_aqui\n3. Reinicie o terminal com 'npm run dev'.");
            setAiLoading(false);
            return;
        }
        
        let locationChanged = false;
        
        if (result.targetLocation && 
            typeof result.targetLocation.lat === 'number' && Number.isFinite(result.targetLocation.lat) &&
            typeof result.targetLocation.lng === 'number' && Number.isFinite(result.targetLocation.lng)) {
            
            const latDiff = Math.abs(result.targetLocation.lat - mapCenter.lat);
            const lngDiff = Math.abs(result.targetLocation.lng - mapCenter.lng);
            
            if (latDiff > 0.001 || lngDiff > 0.001) {
                setMapCenter({ lat: result.targetLocation.lat, lng: result.targetLocation.lng });
                setMapZoom(11);
                locationChanged = true;
                triggerFly();
            }
        }

        const resultItems = result.items;

        if (resultItems && Array.isArray(resultItems) && resultItems.length > 0) {
            
            const validItems = resultItems.filter((res:any) => 
                typeof res.lat === 'number' && Number.isFinite(res.lat) &&
                typeof res.lng === 'number' && Number.isFinite(res.lng)
            );

            const newMapItems: MapItem[] = validItems.map((res: any) => ({
                id: uuidv4(),
                type: 'marker',
                subType: res.subType || 'vehicle',
                name: res.name || 'Unidade IA',
                description: res.description || 'Posicionado via Comando Tático',
                position: { lat: res.lat, lng: res.lng },
                color: res.color || '#3b82f6',
                visible: true,
                locked: false,
                startTime: currentTime,
                rangeRadius: 0
            }));
            
            setItems(prev => [...prev, ...newMapItems]);
            setTacticalCommand('');
            
            const locMsg = locationChanged ? " Mapa reposicionado para a área da missão." : "";
            setAiOutput(`Ordem Executada: ${newMapItems.length} ativos implantados.${locMsg}`);
        } else {
            if (locationChanged) {
                 setAiOutput("O mapa foi movido para o local solicitado, mas a IA não plotou ativos específicos. Tente refinar o comando (ex: 'adicione 3 navios aqui').");
            } else {
                 setAiOutput("Comando recebido, mas nenhum ativo foi gerado.\n\nPossíveis causas:\n1. A IA não encontrou uma localização válida.\n2. O comando foi muito vago.\n3. Erro de interpretação do modelo.\n\nTente reformular: 'Crie um bloqueio com 3 viaturas NESTA posição'.");
            }
        }
      } catch (e) {
        console.error("Erro no frontend:", e);
        setAiOutput("Erro técnico na execução. Verifique o console (F12) para detalhes.");
      } finally {
        setAiLoading(false);
      }
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery) return;
      setIsSearching(true);
      
      try {
          let coords = null;
          try {
              coords = await getCoordinatesFromAI(searchQuery);
          } catch (err) {
              console.warn("AI Geocoding falhou, tentando fallback OSM.");
          }

          if (!coords || typeof coords.lat !== 'number' || !Number.isFinite(coords.lat)) {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
                  headers: { 'User-Agent': 'GEOTIME_Tactical_App/1.0' }
              });
              const data = await res.json();
              if (data && data.length > 0) {
                  const first = data[0];
                  const lat = parseFloat(first.lat);
                  const lon = parseFloat(first.lon);
                  if (Number.isFinite(lat) && Number.isFinite(lon)) {
                      coords = { lat, lng: lon };
                  }
              }
          }

          if (coords && typeof coords.lat === 'number' && Number.isFinite(coords.lat) && typeof coords.lng === 'number' && Number.isFinite(coords.lng)) {
              setMapCenter({ lat: coords.lat, lng: coords.lng });
              setMapZoom(17);
              triggerFly();
          } else {
              alert("Local não encontrado. Tente simplificar o endereço.");
          }
      } catch (e) {
          alert("Erro na busca de local.");
      } finally {
          setIsSearching(false);
      }
  };

  const searchPOI = async () => {
      const query = prompt("O que você está procurando? (Ex: Delegacia, Hospital)");
      if (!query) return;
      setAiLoading(true);
      const results = await findPointsOfInterest(query, mapCenter);
      
      const newItems = results
        .filter((res: any) => typeof res.lat === 'number' && Number.isFinite(res.lat) && typeof res.lng === 'number' && Number.isFinite(res.lng))
        .map((res: any) => ({
            id: uuidv4(),
            type: 'marker',
            subType: 'poi',
            name: res.name || query,
            description: res.description,
            position: { lat: res.lat, lng: res.lng },
            color: '#10b981',
            visible: true,
            locked: false,
            startTime: currentTime
        } as MapItem));

      setItems(prev => [...prev, ...newItems]);
      setAiLoading(false);
  }

  const startRecording = async () => {
      try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
             throw new Error("Gravação de tela não suportada neste navegador/ambiente.");
          }

          const stream = await navigator.mediaDevices.getDisplayMedia({ 
              video: { displaySurface: "browser", frameRate: { ideal: 30, max: 30 } }, 
              audio: false 
          });
          
          const options = { mimeType: 'video/webm;codecs=vp8', bitsPerSecond: 2500000 };
          const mimeType = MediaRecorder.isTypeSupported(options.mimeType) ? options.mimeType : undefined;
          const mediaRecorder = new MediaRecorder(stream, mimeType ? { ...options, mimeType } : undefined);
          
          mediaRecorderRef.current = mediaRecorder;
          recordedChunksRef.current = [];

          mediaRecorder.ondataavailable = (event: BlobEvent) => {
              if (event.data.size > 0) {
                  recordedChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = `geotime_record_${Date.now()}.webm`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              setIsRecording(false);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          
          stream.getVideoTracks()[0].onended = () => {
              if (mediaRecorder.state !== 'inactive') {
                  mediaRecorder.stop();
              }
          };

      } catch (err: any) {
          console.error("Error starting screen record:", err);
          if (err.message && err.message.includes('permissions policy')) {
              alert("AMBIENTE BLOQUEADO: A gravação de tela não é permitida neste ambiente de visualização (iframe).");
          } else if (err.name !== 'NotAllowedError') {
              alert("Não foi possível iniciar a gravação. Detalhes: " + err.message);
          }
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
  };

  const togglePresentationMode = async (enable: boolean) => {
    setIsPresentationMode(enable);
    if (enable) {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        } catch (e) { console.warn("Fullscreen error:", e); }
    } else {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
        } catch (e) { console.warn("Exit fullscreen error", e); }
    }
  };

  const saveMap = () => {
      const data = { items, scenes };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geotime_tactical_${Date.now()}.json`;
      a.click();
  };

  const loadMap = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.items) setItems(data.items);
            if (data.scenes) setScenes(data.scenes);
          } catch (err) {
              alert("Erro ao ler arquivo.");
          }
      };
      reader.readAsText(file);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GEOTIME - Relatório Tático", 10, 10);
    doc.setFontSize(12);
    let y = 30;
    items.forEach(item => {
        doc.text(`- [${item.type}] ${item.name} (Lat: ${item.position.lat.toFixed(4)}, Lng: ${item.position.lng.toFixed(4)})`, 10, y);
        y += 10;
    });
    if (aiOutput) {
        doc.addPage();
        doc.text("Análise de Inteligência (AI):", 10, 10);
        const splitText = doc.splitTextToSize(aiOutput, 180);
        doc.text(splitText, 10, 20);
    }
    doc.save("relatorio_geotime.pdf");
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden font-sans relative">
      <OrganogramModal isOpen={isOrganogramOpen} onClose={() => setIsOrganogramOpen(false)} />
      <SecurityPlanModal 
        isOpen={isSecurityPlanOpen} 
        onClose={() => setIsSecurityPlanOpen(false)} 
        onAddItem={(newItem: MapItem) => setItems(prev => [...prev, newItem])}
        items={items}
      />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {!isPresentationMode && (
          <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-gray-800 border-r border-gray-700 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-500" />
                    <h1 className="text-xl font-bold tracking-wider">GEOTIME <span className="text-xs text-blue-400 font-normal align-top">TACTICAL</span></h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex border-b border-gray-700">
                <button onClick={() => setSelectedTab('icons')} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-gray-700 transition-colors ${selectedTab === 'icons' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}><MapIcon size={18}/><span className="text-[10px] font-medium uppercase">Ativos</span></button>
                <button onClick={() => setSelectedTab('timeline')} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-gray-700 transition-colors ${selectedTab === 'timeline' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}><Clock size={18}/><span className="text-[10px] font-medium uppercase">Tempo</span></button>
                <button onClick={() => setSelectedTab('layers')} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-gray-700 transition-colors ${selectedTab === 'layers' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}><Layers size={18}/><span className="text-[10px] font-medium uppercase">Camadas</span></button>
                <button onClick={() => setSelectedTab('narrative')} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-gray-700 transition-colors ${selectedTab === 'narrative' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}><Camera size={18}/><span className="text-[10px] font-medium uppercase">Cenas</span></button>
                <button onClick={() => setSelectedTab('analysis')} className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-gray-700 transition-colors ${selectedTab === 'analysis' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}><Activity size={18}/><span className="text-[10px] font-medium uppercase">Análise</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-800">
                {selectedTab === 'icons' && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs uppercase text-gray-500 font-bold">Ativos Táticos</h3>
                                <label className="flex items-center gap-1 text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded cursor-pointer transition-colors border border-gray-600 text-gray-300 hover:text-white"><Plus size={12}/> ADICIONAR ÍCONE<input type="file" onChange={handleCustomIconUpload} accept="image/*" className="hidden"/></label>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {TACTICAL_ICONS.map(def => (<DraggableIcon key={def.type} def={def} onDragStart={handleDragStart} />))}
                                {customIcons.map(def => (<DraggableIcon key={def.type} def={def} onDragStart={handleDragStart} />))}
                            </div>
                        </div>
                        <div className="py-2 border-t border-b border-gray-700 my-2">
                             <button onClick={() => { setIsOrganogramOpen(true); if(window.innerWidth < 768) setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded bg-blue-900/30 border border-blue-600/50 hover:bg-blue-800/50 text-blue-300 transition-all shadow-lg group"><span className="flex items-center gap-2 font-bold text-xs uppercase"><GitFork size={16}/> Cadeia de Comando</span><span className="text-[10px] text-gray-400 group-hover:text-white">Editar Organograma</span></button>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">Ferramentas de Desenho</h3>
                            <div className="space-y-2">
                                <button onClick={() => { setDrawingMode('polygon'); if(window.innerWidth < 768) setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-2 rounded ${drawingMode === 'polygon' ? 'bg-red-900/50 text-red-200 border border-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}><Plus size={16} className="mr-2"/> Criar Zona de Risco</button>
                                <button onClick={() => { setDrawingMode('line'); if(window.innerWidth < 768) setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-2 rounded ${drawingMode === 'line' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-500' : 'bg-gray-700 hover:bg-gray-600'}`}><Share2 size={16} className="mr-2"/> Traçar Rota / Perímetro</button>
                            </div>
                            {drawingMode && (
                                <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-600 text-sm">
                                    <p className="mb-2 text-yellow-400">Modo Desenho Ativo</p>
                                    <p className="text-xs text-gray-400 mb-2">Clique no mapa para adicionar pontos.</p>
                                    <div className="flex gap-2">
                                        <button onClick={finishDrawing} className="flex-1 bg-green-600 hover:bg-green-500 p-1 rounded text-white text-xs">Concluir</button>
                                        <button onClick={cancelDrawing} className="flex-1 bg-red-600 hover:bg-red-500 p-1 rounded text-white text-xs">Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {selectedTab === 'timeline' && (
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">Linha do Tempo</h3>
                        <Timeline currentTime={currentTime} setCurrentTime={setCurrentTime} isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)} speed={playbackSpeed} setSpeed={setPlaybackSpeed} />
                        <div className="p-3 bg-gray-900/50 rounded border border-gray-700 text-xs text-gray-400"><p>Use a linha do tempo para simular a evolução dos eventos táticos.</p></div>
                    </div>
                )}

                {selectedTab === 'layers' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs uppercase text-gray-500 font-bold mb-2">Mapa Base</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setBaseLayer('osm')} className={`p-2 rounded border text-xs text-center flex flex-col items-center gap-1 ${baseLayer === 'osm' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}><Globe size={16} />Street</button>
                                <button onClick={() => setBaseLayer('satellite')} className={`p-2 rounded border text-xs text-center flex flex-col items-center gap-1 ${baseLayer === 'satellite' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}><Globe size={16} />Satélite</button>
                                <button onClick={() => setBaseLayer('dark')} className={`p-2 rounded border text-xs text-center flex flex-col items-center gap-1 ${baseLayer === 'dark' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}><Globe size={16} />Escuro</button>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">Camadas Táticas</h3>
                            {items.length === 0 && <p className="text-sm text-gray-500 italic">Nenhum item no mapa.</p>}
                            {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden"><div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div><span className="truncate max-w-[120px]">{item.name}</span></div>
                                    <div className="flex gap-1"><button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, visible: !i.visible} : i))}>{item.visible ? <Check size={14} className="text-green-400"/> : <X size={14} className="text-red-400"/>}</button><button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={14}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTab === 'narrative' && (
                    <div className="space-y-4">
                        <button onClick={captureScene} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2"><Camera size={16} /> Capturar Cena (T-{Math.floor(currentTime)})</button>
                        <div className="space-y-2">
                            {scenes.map(scene => (
                                <div key={scene.id} className="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 border-l-4 border-blue-500" onClick={() => restoreScene(scene)}>
                                    <div className="flex justify-between items-center mb-1"><span className="font-bold text-sm">{scene.title}</span><span className="text-xs text-blue-300 font-mono">T-{Math.floor(scene.timestamp)}</span></div>
                                    <p className="text-xs text-gray-300">{scene.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTab === 'analysis' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-yellow-900/20 border border-yellow-600/50 rounded mb-2">
                            <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2 uppercase tracking-wider text-[10px]"><ShieldAlert size={12}/> Segurança VIP</h4>
                            <button onClick={() => setIsSecurityPlanOpen(true)} className="w-full bg-yellow-700 hover:bg-yellow-600 text-white p-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"><Shield size={16} fill="currentColor" className="text-yellow-200" />PROTOCOLO / DOUTRINA</button>
                        </div>
                        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                            <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2"><Command size={16}/> Comando Tático (IA)</h4>
                            <p className="text-[10px] text-gray-400 mb-2">Descreva o cenário e a IA posicionará os ativos.</p>
                            <textarea value={tacticalCommand} onChange={(e) => setTacticalCommand(e.target.value)} className="w-full text-xs bg-gray-800 border border-gray-600 rounded p-2 mb-2 text-white h-20 resize-none focus:border-green-500 outline-none" placeholder="Ex: Crie um perímetro de segurança com 3 viaturas e 2 snipers ao norte..." />
                            <button onClick={executeTacticalCommand} disabled={aiLoading || !tacticalCommand.trim()} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded text-xs font-medium uppercase tracking-wide flex items-center justify-center gap-2">{aiLoading ? <span className="animate-pulse">Processando Estratégia...</span> : 'Executar Ordem'}</button>
                        </div>
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Activity size={16}/> Relatório SITREP</h4>
                            <p className="text-[10px] text-gray-400 mb-3">Gere relatórios de inteligência baseados nos elementos do mapa.</p>
                            <button onClick={runAnalysis} disabled={aiLoading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded text-xs font-medium">{aiLoading ? 'Analisando Teatro...' : 'Gerar Relatório'}</button>
                        </div>
                        <div className="p-3 bg-gray-700/50 rounded">
                            <h4 className="font-bold text-gray-300 mb-2 text-xs">Busca de Locais (Simulado)</h4>
                            <button onClick={searchPOI} className="w-full bg-gray-600 hover:bg-gray-500 text-white p-2 rounded text-xs flex items-center justify-center gap-2"><Search size={14} /> Buscar POIs Próximos</button>
                        </div>
                        {aiOutput && (<div className="p-3 bg-gray-800 border border-gray-600 rounded text-xs whitespace-pre-wrap font-mono animate-in fade-in duration-500">{aiOutput}</div>)}
                    </div>
                )}
            </div>
            <div className="p-3 bg-gray-900 border-t border-gray-700 text-[10px] text-gray-500 text-center">GEOTIME v1.0.0 &copy; 2025</div>
          </div>
      )}

      <div className="flex-1 relative z-0 flex flex-col h-full w-full">
        {!isPresentationMode && (
            <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-2 text-gray-300 hover:text-white"><Menu size={24} /></button>
                    <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 mr-2 shrink-0">
                        <button onClick={() => setBaseLayer('osm')} className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${baseLayer === 'osm' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Mapa</button>
                        <button onClick={() => setBaseLayer('satellite')} className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${baseLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Satélite</button>
                        <button onClick={() => setBaseLayer('dark')} className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${baseLayer === 'dark' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Escuro</button>
                    </div>
                    <form onSubmit={handleSearch} className="relative hidden md:flex items-center max-w-xs w-full mr-2">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar Cidade, Rua..." className="w-full bg-gray-900 border border-gray-600 rounded-full py-1 pl-3 pr-8 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50" disabled={isSearching} />
                        <button type="submit" className="absolute right-2 text-gray-400 hover:text-blue-400 disabled:opacity-50" disabled={isSearching}>{isSearching ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Search size={14} />}</button>
                    </form>
                    <button onClick={() => setIsMeasuring(!isMeasuring)} className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs border transition-colors ${isMeasuring ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'}`}><Ruler size={14} /> <span className="hidden sm:inline">{isMeasuring ? 'Medição Ativa' : 'Régua'}</span></button>
                    <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs border transition-colors ${isRecording ? 'bg-red-600 text-white border-red-500 animate-pulse' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'}`} title="Gravar Tela">{isRecording ? <Square size={14} fill="currentColor"/> : <Video size={14} />}<span className="hidden sm:inline">{isRecording ? 'Parar REC' : 'Gravar'}</span></button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={() => togglePresentationMode(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white border border-blue-500 shadow-lg" title="Modo Apresentação (TV Mode)"><Monitor size={14} /> <span className="hidden sm:inline font-bold">MODO TV</span></button>
                    <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>
                    <button onClick={saveMap} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white border border-gray-600" title="Salvar"><Save size={14} /> <span className="hidden sm:inline">Salvar</span></button>
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white border border-gray-600 cursor-pointer" title="Carregar"><Upload size={14} /> <span className="hidden sm:inline">Carregar</span><input type="file" onChange={loadMap} className="hidden" accept=".json" /></label>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white border border-gray-600" title="PDF"><FileText size={14} /> <span className="hidden sm:inline">Exportar PDF</span></button>
                </div>
            </div>
        )}

        {isPresentationMode && (
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 backdrop-blur transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600'}`}>{isRecording ? <Square size={16} fill="currentColor"/> : <Video size={16} />} {isRecording ? 'GRAVANDO...' : 'GRAVAR TELA'}</button>
                <button onClick={() => togglePresentationMode(false)} className="bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 backdrop-blur"><Minimize2 size={16} /> SAIR DO MODO TV</button>
            </div>
        )}
        
        {isPresentationMode && (
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">
                 <Timeline currentTime={currentTime} setCurrentTime={setCurrentTime} isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)} speed={playbackSpeed} setSpeed={setPlaybackSpeed} compact={true} />
             </div>
        )}

        <div className="flex-1 relative z-0">
            <MapCanvas 
                items={items} 
                currentTime={currentTime} 
                baseLayer={baseLayer}
                onDrop={handleDropIcon}
                onMapClick={handleMapClick}
                drawingPath={drawingPath}
                drawingMode={drawingMode}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                onDelete={handleDeleteItem}
                onUpdate={handleUpdateItem}
                isMeasuring={isMeasuring}
                onMeasureComplete={() => setIsMeasuring(false)}
                onMapMove={handleMapMove}
                flyTrigger={flyTrigger}
            />
        </div>
      </div>
    </div>
  );
};

export default App;