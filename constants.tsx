import React from 'react';
import { 
  Shield, Crosshair, Anchor, Plane, Phone, 
  Flame, Car, Radio, Users, Camera, Target, MapPin, 
  AlertTriangle, Navigation, Siren, Droplet, Swords, Radar, Waves
} from 'lucide-react';
import { TacticalIconDef, MapItem, Scene } from './types';
import { v4 as uuidv4 } from 'uuid';

export const INITIAL_CENTER = { lat: -15.793889, lng: -47.882778 }; // Brasilia
export const INITIAL_ZOOM = 5;

// TROCA TÁTICA: Usando CartoDB Dark Only Labels (Texto Branco) para contraste máximo sobre satélite
export const SATELLITE_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';

export const TACTICAL_ICONS: TacticalIconDef[] = [
  { type: 'police', label: 'Polícia', iconNode: <Shield size={16} />, defaultColor: '#3b82f6' },
  { type: 'army', label: 'Exército', iconNode: <Crosshair size={16} />, defaultColor: '#15803d' },
  { type: 'navy', label: 'Marinha', iconNode: <Anchor size={16} />, defaultColor: '#1e40af' },
  { type: 'aircraft', label: 'Aéreo', iconNode: <Plane size={16} />, defaultColor: '#60a5fa' },
  { type: 'helicopter', label: 'Heli', iconNode: <Navigation size={16} className="rotate-45" />, defaultColor: '#93c5fd' },
  { type: 'tanker', label: 'REVO (Fuel)', iconNode: <Droplet size={16} />, defaultColor: '#d946ef' },
  { type: 'base_attack', label: 'Base Ataque', iconNode: <Swords size={16} />, defaultColor: '#be123c' },
  { type: 'antiair', label: 'Defesa Aérea', iconNode: <Radar size={16} />, defaultColor: '#059669' },
  { type: 'submarine', label: 'Submarino', iconNode: <Waves size={16} />, defaultColor: '#172554' },
  { type: 'fire', label: 'Bombeiros', iconNode: <Flame size={16} />, defaultColor: '#ef4444' },
  { type: 'vehicle', label: 'Viatura', iconNode: <Car size={16} />, defaultColor: '#6b7280' },
  { type: 'drone', label: 'Drone', iconNode: <Radio size={16} />, defaultColor: '#a855f7' },
  { type: 'team', label: 'Equipe', iconNode: <Users size={16} />, defaultColor: '#eab308' },
  { type: 'media', label: 'Imprensa', iconNode: <Camera size={16} />, defaultColor: '#f97316' },
  { type: 'station', label: 'Base/DP', iconNode: <MapPin size={16} />, defaultColor: '#1f2937' },
  { type: 'protest', label: 'Protesto', iconNode: <AlertTriangle size={16} />, defaultColor: '#dc2626' },
];

export const MAP_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO'
  }
};

// DADOS DE DEMONSTRAÇÃO: OPERAÇÃO TEMPESTADE (RIO DE JANEIRO)
export const DEMO_SCENARIO = {
    center: { lat: -22.9673, lng: -43.1788 }, // Copacabana
    zoom: 16,
    items: [
        // ZONA QUENTE (HOTEL)
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'target',
            name: 'ALVO: Hotel VIP',
            description: 'Local com reféns confirmados. 4 hostis armados no lobby.',
            position: { lat: -22.9673, lng: -43.1788 },
            color: '#ef4444',
            visible: true,
            locked: true,
            startTime: 0,
            rangeRadius: 50
        },
        // PERÍMETRO DE ISOLAMENTO (POLÍCIA) - T=0
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'police',
            name: 'Bloqueio Norte',
            description: 'Viatura isolando Av. Atlântica.',
            position: { lat: -22.9660, lng: -43.1775 },
            color: '#3b82f6',
            visible: true,
            locked: false,
            startTime: 0,
            rangeRadius: 0
        },
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'police',
            name: 'Bloqueio Sul',
            description: 'Viatura isolando rua lateral.',
            position: { lat: -22.9685, lng: -43.1800 },
            color: '#3b82f6',
            visible: true,
            locked: false,
            startTime: 5,
            rangeRadius: 0
        },
        // SNIPER (COBERTURA) - T=20
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'army',
            name: 'Sniper Alpha',
            description: 'Posicionado no terraço do prédio vizinho. Visada limpa para o lobby.',
            position: { lat: -22.9670, lng: -43.1795 },
            color: '#15803d',
            visible: true,
            locked: false,
            startTime: 20,
            rangeRadius: 300
        },
        // DRONE (VIGILÂNCIA) - T=30
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'drone',
            name: 'Drone Eagle-1',
            description: 'Sobrevoo tático para identificação térmica.',
            position: { lat: -22.9673, lng: -43.1760 },
            color: '#a855f7',
            visible: true,
            locked: false,
            startTime: 30,
            rangeRadius: 100
        },
        // EQUIPE TÁTICA (ENTRADA) - T=60
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'team',
            name: 'Equipe de Assalto',
            description: 'Iniciando progressão pela entrada de serviço.',
            position: { lat: -22.9678, lng: -43.1785 },
            color: '#eab308',
            visible: true,
            locked: false,
            startTime: 60,
            rangeRadius: 0
        },
        // EXTRAÇÃO (HELICÓPTERO) - T=85
        {
            id: uuidv4(),
            type: 'marker',
            subType: 'helicopter',
            name: 'Águia 01 (Evac)',
            description: 'Aproximação para extração no heliponto.',
            position: { lat: -22.9665, lng: -43.1750 },
            color: '#93c5fd',
            visible: true,
            locked: false,
            startTime: 85,
            rangeRadius: 0
        },
        // ROTA DE FUGA POSSÍVEL
        {
            id: uuidv4(),
            type: 'polyline',
            name: 'Rota de Fuga (Hostis)',
            description: 'Possível rota de fuga em direção à comunidade.',
            path: [{lat: -22.9673, lng: -43.1788}, {lat: -22.9660, lng: -43.1810}, {lat: -22.9650, lng: -43.1830}],
            color: '#ef4444',
            visible: true,
            locked: false,
            startTime: 10
        }
    ] as MapItem[],
    scenes: [
        {
            id: uuidv4(),
            title: "Fase 1: Isolamento",
            description: "Estabelecimento do perímetro de segurança e isolamento da área crítica.",
            center: { lat: -22.9673, lng: -43.1788 },
            zoom: 16,
            timestamp: 10,
            activeLayerIds: []
        },
        {
            id: uuidv4(),
            title: "Fase 2: Posicionamento",
            description: "Snipers e Drones em posição. Inteligência confirmada.",
            center: { lat: -22.9673, lng: -43.1788 },
            zoom: 17,
            timestamp: 40,
            activeLayerIds: []
        },
        {
            id: uuidv4(),
            title: "Fase 3: Intervenção",
            description: "Entrada da equipe tática e extração aérea.",
            center: { lat: -22.9673, lng: -43.1788 },
            zoom: 18,
            timestamp: 90,
            activeLayerIds: []
        }
    ] as Scene[]
};