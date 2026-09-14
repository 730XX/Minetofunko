export type BoxFinish = 'matte' | 'gloss';
export type BoxFont = 'display' | 'mono' | 'sans' | 'comic';
export type DioramaPreset = 'bosque' | 'amatista' | 'nether' | 'studio' | 'custom';
export type WizardViewMode = '3d' | '2d';

export interface BoxPalette {
  id: string;
  name: string;
  primary: string;
  accent: string;
  tag: string;
}

export interface BoxCustomizationConfig {
  // Paso 1: Acabado y Colores
  primaryColor: string;
  accentColor: string;
  finish: BoxFinish;
  
  // Paso 2: Diorama Interior
  dioramaPreset: DioramaPreset;
  customDioramaUrl: string | null;
  dioramaZoom: number; // 80 - 180
  dioramaOffsetY: number; // -30 a 30 mm
  blisterLightIntensity: number; // 20 - 100%

  // Paso 3: Identidad y Tipografía
  characterName: string;
  collectionNumber: string;
  franchiseTag: string;
  fontFamily: BoxFont;
  logoUrl: string | null;
  logoName: string;
}

export const DEFAULT_BOX_CONFIG: BoxCustomizationConfig = {
  primaryColor: '#e11d48',
  accentColor: '#881337',
  finish: 'matte',
  dioramaPreset: 'bosque',
  customDioramaUrl: null,
  dioramaZoom: 100,
  dioramaOffsetY: 0,
  blisterLightIntensity: 85,
  characterName: 'Steve_Hero',
  collectionNumber: '#01',
  franchiseTag: 'MINECRAFT GAMES',
  fontFamily: 'display',
  logoUrl: null,
  logoName: 'craftpop_badge.png',
};

export const BOX_PALETTES: BoxPalette[] = [
  { id: 'funko', name: 'Funko Clásico', primary: '#e11d48', accent: '#881337', tag: '#E11D48 Carmine' },
  { id: 'nether', name: 'Nether Craft', primary: '#7f1d1d', accent: '#450a0a', tag: '#7F1D1D Crimson' },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: '#06b6d4', accent: '#164e63', tag: '#06B6D4 Cyan' },
  { id: 'obsidian', name: 'Obsidiana', primary: '#0f172a', accent: '#020617', tag: '#0F172A Slate' },
];
