import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { 
  POI, 
  POINote, 
  POIPhoto, 
  LocationCoords, 
  POIWithDistance,
  MapSettings 
} from '@/types';
import { 
  DISTANCE_THRESHOLD_DUPLICATE, 
  MAX_TAGS_PER_POI, 
  MAX_TAG_LENGTH, 
  MAX_FIELD_LENGTH,
  ESTIMATED_SPEED_KMH 
} from '@/constants/poi';

const STORAGE_KEYS = {
  POIS: 'pois',
  POI_NOTES: 'poi_notes',
  POI_PHOTOS: 'poi_photos',
  MAP_SETTINGS: 'map_settings'
};

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateETA(distanceKm: number): number {
  return (distanceKm / ESTIMATED_SPEED_KMH) * 60;
}

export const [POIProvider, usePOI] = createContextHook(() => {
  const [pois, setPois] = useState<POI[]>([]);
  const [notes, setNotes] = useState<POINote[]>([]);
  const [photos, setPhotos] = useState<POIPhoto[]>([]);
  const [settings, setSettings] = useState<MapSettings>({
    id: 'settings',
    followLocation: true,
    distanceUnit: 'km'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading POI data from storage...');
        
        const [poisData, notesData, photosData, settingsData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.POIS),
          AsyncStorage.getItem(STORAGE_KEYS.POI_NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.POI_PHOTOS),
          AsyncStorage.getItem(STORAGE_KEYS.MAP_SETTINGS)
        ]);

        if (poisData) {
          setPois(JSON.parse(poisData));
        }
        if (notesData) {
          setNotes(JSON.parse(notesData));
        }
        if (photosData) {
          setPhotos(JSON.parse(photosData));
        }
        if (settingsData) {
          setSettings(JSON.parse(settingsData));
        }

        console.log('POI data loaded successfully');
      } catch (error) {
        console.error('Error loading POI data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const savePOIs = useCallback(async (newPois: POI[]) => {
    if (!Array.isArray(newPois)) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POIS, JSON.stringify(newPois));
      setPois(newPois);
      console.log('POIs saved to storage');
    } catch (error) {
      console.error('Error saving POIs:', error);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes: POINote[]) => {
    if (!Array.isArray(newNotes)) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POI_NOTES, JSON.stringify(newNotes));
      setNotes(newNotes);
      console.log('POI notes saved to storage');
    } catch (error) {
      console.error('Error saving POI notes:', error);
    }
  }, []);

  const savePhotos = useCallback(async (newPhotos: POIPhoto[]) => {
    if (!Array.isArray(newPhotos)) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POI_PHOTOS, JSON.stringify(newPhotos));
      setPhotos(newPhotos);
      console.log('POI photos saved to storage');
    } catch (error) {
      console.error('Error saving POI photos:', error);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: MapSettings) => {
    if (!newSettings || typeof newSettings !== 'object') return;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAP_SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('Map settings saved to storage');
    } catch (error) {
      console.error('Error saving map settings:', error);
    }
  }, []);

  const validatePOI = useCallback((poi: Partial<POI>): string[] => {
    const errors: string[] = [];
    
    if (!poi.name?.trim()) {
      errors.push('Name ist erforderlich');
    }
    if (!poi.type) {
      errors.push('Typ ist erforderlich');
    }
    if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') {
      errors.push('Gültige Koordinaten sind erforderlich');
    }
    if (poi.rating !== null && poi.rating !== undefined && (poi.rating < 1 || poi.rating > 5)) {
      errors.push('Bewertung muss zwischen 1 und 5 liegen');
    }
    if (poi.tags && poi.tags.length > MAX_TAGS_PER_POI) {
      errors.push(`Maximal ${MAX_TAGS_PER_POI} Tags erlaubt`);
    }
    if (poi.tags?.some(tag => tag.length > MAX_TAG_LENGTH)) {
      errors.push(`Tags dürfen maximal ${MAX_TAG_LENGTH} Zeichen haben`);
    }
    if (poi.open_hours && poi.open_hours.length > MAX_FIELD_LENGTH) {
      errors.push(`Öffnungszeiten dürfen maximal ${MAX_FIELD_LENGTH} Zeichen haben`);
    }
    if (poi.price_info && poi.price_info.length > MAX_FIELD_LENGTH) {
      errors.push(`Preisinfos dürfen maximal ${MAX_FIELD_LENGTH} Zeichen haben`);
    }

    return errors;
  }, []);

  const findDuplicates = useCallback((newPoi: Partial<POI>): POI[] => {
    if (!newPoi.name || typeof newPoi.lat !== 'number' || typeof newPoi.lng !== 'number') {
      return [];
    }

    return pois.filter(poi => {
      const nameMatch = poi.name.toLowerCase() === newPoi.name!.toLowerCase();
      const distance = calculateDistance(poi.lat, poi.lng, newPoi.lat!, newPoi.lng!);
      const locationMatch = distance <= (DISTANCE_THRESHOLD_DUPLICATE / 1000);
      
      return nameMatch && locationMatch;
    });
  }, [pois]);

  const addPOI = useCallback((poiData: Omit<POI, 'id' | 'created_at' | 'updated_at'>): { success: boolean; poi?: POI; errors?: string[] } => {
    console.log('Adding new POI:', poiData);
    
    const errors = validatePOI(poiData);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const duplicates = findDuplicates(poiData);
    if (duplicates.length > 0) {
      return { success: false, errors: ['Ein ähnlicher POI existiert bereits in der Nähe'] };
    }

    const now = new Date().toISOString();
    const newPOI: POI = {
      ...poiData,
      id: generateId(),
      created_at: now,
      updated_at: now,
      tags: poiData.tags?.map(tag => tag.trim().toLowerCase()) || [],
      rating: poiData.rating || null,
      open_hours: poiData.open_hours?.trim() || null,
      price_info: poiData.price_info?.trim() || null
    };

    const updatedPois = [...pois, newPOI];
    savePOIs(updatedPois);
    
    return { success: true, poi: newPOI };
  }, [pois, validatePOI, findDuplicates, savePOIs]);

  const updatePOI = useCallback((id: string, updates: Partial<POI>): { success: boolean; poi?: POI; errors?: string[] } => {
    console.log('Updating POI:', id, updates);
    
    const existingPoi = pois.find(p => p.id === id);
    if (!existingPoi) {
      return { success: false, errors: ['POI nicht gefunden'] };
    }

    const updatedPoi = { ...existingPoi, ...updates };
    const errors = validatePOI(updatedPoi);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    updatedPoi.updated_at = new Date().toISOString();
    if (updates.tags) {
      updatedPoi.tags = updates.tags.map(tag => tag.trim().toLowerCase());
    }

    const updatedPois = pois.map(p => p.id === id ? updatedPoi : p);
    savePOIs(updatedPois);
    
    return { success: true, poi: updatedPoi };
  }, [pois, validatePOI, savePOIs]);

  const deletePOI = useCallback((id: string): boolean => {
    console.log('Deleting POI:', id);
    
    const updatedPois = pois.filter(p => p.id !== id);
    const updatedNotes = notes.filter(n => n.poi_id !== id);
    const updatedPhotos = photos.filter(p => p.poi_id !== id);
    
    savePOIs(updatedPois);
    saveNotes(updatedNotes);
    savePhotos(updatedPhotos);
    
    return true;
  }, [pois, notes, photos, savePOIs, saveNotes, savePhotos]);

  const toggleFavorite = useCallback((id: string): boolean => {
    const poi = pois.find(p => p.id === id);
    if (!poi) return false;

    const result = updatePOI(id, { favorite: !poi.favorite });
    return result.success;
  }, [pois, updatePOI]);

  const flagPOI = useCallback((id: string, reason: string): boolean => {
    const result = updatePOI(id, { 
      flagged: true, 
      flagged_reason: reason.trim() 
    });
    return result.success;
  }, [updatePOI]);

  const unflagPOI = useCallback((id: string): boolean => {
    const result = updatePOI(id, { 
      flagged: false, 
      flagged_reason: null 
    });
    return result.success;
  }, [updatePOI]);

  const addNote = useCallback((poi_id: string, text: string): POINote => {
    const note: POINote = {
      id: generateId(),
      poi_id,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    const updatedNotes = [...notes, note];
    saveNotes(updatedNotes);
    
    return note;
  }, [notes, saveNotes]);

  const updateNote = useCallback((id: string, text: string): boolean => {
    const updatedNotes = notes.map(n => 
      n.id === id ? { ...n, text: text.trim() } : n
    );
    saveNotes(updatedNotes);
    return true;
  }, [notes, saveNotes]);

  const deleteNote = useCallback((id: string): boolean => {
    const updatedNotes = notes.filter(n => n.id !== id);
    saveNotes(updatedNotes);
    return true;
  }, [notes, saveNotes]);

  const addPhoto = useCallback((poi_id: string, uri: string): POIPhoto => {
    const photo: POIPhoto = {
      id: generateId(),
      poi_id,
      uri,
      created_at: new Date().toISOString()
    };

    const updatedPhotos = [...photos, photo];
    savePhotos(updatedPhotos);
    
    return photo;
  }, [photos, savePhotos]);

  const deletePhoto = useCallback((id: string): boolean => {
    const updatedPhotos = photos.filter(p => p.id !== id);
    savePhotos(updatedPhotos);
    return true;
  }, [photos, savePhotos]);

  const getNotesForPOI = useCallback((poi_id: string): POINote[] => {
    return notes.filter(n => n.poi_id === poi_id).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notes]);

  const getPhotosForPOI = useCallback((poi_id: string): POIPhoto[] => {
    return photos.filter(p => p.poi_id === poi_id).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [photos]);

  const getPOIsWithDistance = useMemo((): POIWithDistance[] => {
    if (!currentLocation) {
      return pois.map(poi => ({ ...poi }));
    }

    return pois.map(poi => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        poi.lat,
        poi.lng
      );
      const eta = calculateETA(distance);

      return {
        ...poi,
        distance: Math.round(distance * 10) / 10,
        eta: Math.round(eta)
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [pois, currentLocation]);

  const updateCurrentLocation = useCallback((location: LocationCoords | null) => {
    if (location && (typeof location.latitude !== 'number' || typeof location.longitude !== 'number')) {
      return;
    }
    setCurrentLocation(location);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<MapSettings>) => {
    if (!newSettings || typeof newSettings !== 'object') return;
    const updated = { ...settings, ...newSettings };
    saveSettings(updated);
  }, [settings, saveSettings]);

  return useMemo(() => ({
    pois,
    notes,
    photos,
    settings,
    isLoading,
    currentLocation,
    
    addPOI,
    updatePOI,
    deletePOI,
    toggleFavorite,
    flagPOI,
    unflagPOI,
    
    addNote,
    updateNote,
    deleteNote,
    getNotesForPOI,
    
    addPhoto,
    deletePhoto,
    getPhotosForPOI,
    
    getPOIsWithDistance,
    
    findDuplicates,
    validatePOI,
    updateCurrentLocation,
    updateSettings
  }), [
    pois,
    notes,
    photos,
    settings,
    isLoading,
    currentLocation,
    addPOI,
    updatePOI,
    deletePOI,
    toggleFavorite,
    flagPOI,
    unflagPOI,
    addNote,
    updateNote,
    deleteNote,
    getNotesForPOI,
    addPhoto,
    deletePhoto,
    getPhotosForPOI,
    getPOIsWithDistance,
    findDuplicates,
    validatePOI,
    updateCurrentLocation,
    updateSettings
  ]);
});