import React from 'react';

export type IconType = 
  | 'police' | 'army' | 'navy' | 'aircraft' | 'helicopter' 
  | 'submarine' | 'protest' | 'station' | 'fire' | 'vehicle' 
  | 'drone' | 'team' | 'journalist' | 'media' | 'target' | 'poi'
  | 'tanker' | 'base_attack' | 'antiair';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ViewCone {
    enabled: boolean;
    range: number;      // Meters
    direction: number;  // 0-360 degrees (Azimuth)
    spread: number;     // Degrees (Field of View width)
}

export interface TargetingVector {
    enabled: boolean;
    range: number;      // Meters
    direction: number;  // 0-360 degrees (Azimuth)
}

export interface MapItem {
  id: string;
  type: 'marker' | 'polygon' | 'polyline' | 'circle';
  subType?: IconType; // For markers
  name: string;
  description?: string;
  position: LatLng; // Center for markers/circles
  path?: LatLng[]; // For polygons/polylines
  radius?: number; // For circles
  rangeRadius?: number; // Tactical Range Ring in meters
  
  // Advanced Visuals
  viewCone?: ViewCone; // Tactical Field of View
  targetingVector?: TargetingVector; // Direct Line of Fire (White Line)

  color: string;
  visible: boolean;
  locked: boolean;
  
  // Timeline features (Relative 0-100)
  startTime: number; 
  endTime?: number;

  // Real Calendar Dates
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string;   // YYYY-MM-DD

  // Tactical Gallery / Evidence
  images?: string[]; // Array of Base64 strings

  // Custom Icon URL (for user uploaded icons)
  customIconUrl?: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  center: LatLng;
  zoom: number;
  timestamp: number; // The time on the timeline this scene represents
  activeLayerIds: string[];
}

export interface AppState {
  items: MapItem[];
  scenes: Scene[];
  currentTime: number; // 0 to 100 usually
  isPlaying: boolean;
  playbackSpeed: number;
  drawingMode: 'polygon' | 'line' | 'poi' | null;
  selectedItemId: string | null;
  mapCenter: LatLng;
  mapZoom: number;
  baseLayer: 'osm' | 'satellite' | 'dark';
}

export type MapTool = 'select' | 'measure' | 'draw_poly' | 'draw_line' | 'add_marker';

export interface TacticalIconDef {
  type: IconType;
  label: string;
  iconNode: React.ReactNode;
  defaultColor: string;
}

// ORGANOGRAM STRUCTURE
export interface CommandNode {
    id: string;
    role: string; // e.g. "Commander", "Sniper Team Leader"
    name: string; // e.g. "Cap. Nascimento"
    color?: string;
    imageUrl?: string; // Base64 image data
    subordinates?: CommandNode[];
}