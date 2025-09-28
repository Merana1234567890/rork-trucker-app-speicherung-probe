import { POIType } from '@/types';

export const POI_TAG_PRESETS = [
  'Dusche',
  'WC',
  'LKW-geeignet',
  'Security',
  '24/7',
  'Essen gut',
  'Strom',
  'WLAN',
  'bewacht',
  'günstig'
] as const;

export const POI_TYPE_LABELS: Record<POIType, string> = {
  rest: 'Rastplatz',
  parking: 'Parkplatz',
  fuel: 'Tankstelle',
  wash: 'Waschanlage',
  service: 'Werkstatt',
  hotel: 'Hotel/Motel'
};

export const POI_TYPE_COLORS: Record<POIType, string> = {
  rest: '#4CAF50',
  parking: '#2196F3',
  fuel: '#FF9800',
  wash: '#00BCD4',
  service: '#9C27B0',
  hotel: '#F44336'
};

export const FLAG_REASONS = [
  'geschlossen',
  'keine LKW-Parkplätze',
  'Preise falsch',
  'unseriös',
  'sonstiges'
] as const;

export const DISTANCE_THRESHOLD_DUPLICATE = 20; // meters
export const MAX_TAGS_PER_POI = 10;
export const MAX_TAG_LENGTH = 20;
export const MAX_FIELD_LENGTH = 120;
export const CLUSTERING_THRESHOLD = 100;
export const SEARCH_DEBOUNCE_MS = 300;
export const ESTIMATED_SPEED_KMH = 80;