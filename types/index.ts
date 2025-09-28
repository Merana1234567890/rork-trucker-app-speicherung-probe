export interface Vehicle {
  id: string;
  name: string;
  kennzeichen: string;
  tankvolumen_l: number;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  start_datetime: string;
  end_datetime?: string;
  start_km: number;
  end_km?: number;
}

export interface FuelLog {
  id: string;
  trip_id: string;
  datum: string;
  ort: string;
  km: number;
  liter: number;
  preis_total: number;
}

export interface Expense {
  id: string;
  trip_id: string;
  datum: string;
  kategorie: 'Verpflegung' | 'Maut' | 'Parken' | 'Sonstiges';
  betrag: number;
  beleg_url?: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface ChecklistRun {
  id: string;
  checklist_id: string;
  trip_id: string;
  datum: string;
  type: 'Vorfahrt' | 'Nachfahrt';
  items: ChecklistItem[];
}

export interface PauseBlock {
  start: string;
  end?: string;
  duration_minutes: number;
}

export interface DriveTimer {
  id: string;
  trip_id: string;
  start_time: string;
  end_time?: string;
  pauses: PauseBlock[];
  pause_variant: 'A' | 'B'; // A = 45min, B = 15+30min
  gefahrene_min_heute: number;
  gefahrene_min_woche: number;
  is_active: boolean;
}

export interface DashboardStats {
  current_trip?: Trip;
  gefahrene_zeit_heute: number;
  naechste_pause_in: number;
  letzter_tankstopp?: FuelLog;
  heutige_spesen: number;
  pause_variant: 'A' | 'B';
}

export type POIType = 'rest' | 'parking' | 'fuel' | 'wash' | 'service' | 'hotel';

export interface POI {
  id: string;
  name: string;
  type: POIType;
  lat: number;
  lng: number;
  rating: number | null;
  tags: string[];
  open_hours: string | null;
  price_info: string | null;
  favorite: boolean;
  flagged: boolean;
  flagged_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface POINote {
  id: string;
  poi_id: string;
  text: string;
  created_at: string;
}

export interface POIPhoto {
  id: string;
  poi_id: string;
  uri: string;
  created_at: string;
}

export interface MapSettings {
  id: 'settings';
  followLocation: boolean;
  distanceUnit: 'km';
}

export interface POIFilter {
  types: POIType[];
  favoriteOnly: boolean;
  minRating: number | null;
  tags: string[];
  searchQuery: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface POIWithDistance extends POI {
  distance?: number;
  eta?: number;
}