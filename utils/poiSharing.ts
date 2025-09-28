import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { POI, POIWithDistance } from '@/types';
import { POI_TYPE_LABELS } from '@/constants/poi';

export interface ShareOptions {
  includeText?: boolean;
  includeJSON?: boolean;
  includeGPX?: boolean;
}

export interface ExportData {
  text?: string;
  jsonUri?: string;
  gpxUri?: string;
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
}

function formatDateTime(): string {
  const now = new Date();
  return now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
}

function formatPOIText(poi: POI | POIWithDistance): string {
  const typeLabel = POI_TYPE_LABELS[poi.type];
  const coords = `${poi.lat.toFixed(6)},${poi.lng.toFixed(6)}`;
  const mapsUrl = `https://maps.google.com/?q=${coords}`;
  
  let text = `POI: ${poi.name} (${typeLabel}) • ${coords} • Maps: ${mapsUrl}`;
  
  if (poi.tags && poi.tags.length > 0) {
    text += ` • Tags: ${poi.tags.join(', ')}`;
  }
  
  if (poi.open_hours) {
    text += ` • Öffnungszeiten: ${poi.open_hours}`;
  }
  
  if (poi.price_info) {
    text += ` • Preise: ${poi.price_info}`;
  }
  
  if (poi.rating) {
    text += ` • Bewertung: ${poi.rating}/5`;
  }
  
  if (poi.flagged && poi.flagged_reason) {
    text += ` • ⚠️ Gemeldet: ${poi.flagged_reason}`;
  }
  
  return text;
}

function createPOIJSON(poi: POI): object {
  const data: any = {
    id: poi.id,
    name: poi.name,
    type: poi.type,
    lat: poi.lat,
    lng: poi.lng,
    favorite: poi.favorite,
    created_at: poi.created_at,
    updated_at: poi.updated_at
  };
  
  if (poi.rating !== null) {
    data.rating = poi.rating;
  }
  
  if (poi.tags && poi.tags.length > 0) {
    data.tags = poi.tags;
  }
  
  if (poi.open_hours) {
    data.open_hours = poi.open_hours;
  }
  
  if (poi.price_info) {
    data.price_info = poi.price_info;
  }
  
  if (poi.flagged) {
    data.flagged = poi.flagged;
    if (poi.flagged_reason) {
      data.flagged_reason = poi.flagged_reason;
    }
  }
  
  return data;
}

function createGPXWaypoint(poi: POI): string {
  const typeLabel = POI_TYPE_LABELS[poi.type];
  let description = `${typeLabel}`;
  
  if (poi.tags && poi.tags.length > 0) {
    description += ` • Tags: ${poi.tags.join(', ')}`;
  }
  
  if (poi.open_hours) {
    description += ` • Öffnungszeiten: ${poi.open_hours}`;
  }
  
  if (poi.price_info) {
    description += ` • Preise: ${poi.price_info}`;
  }
  
  if (poi.rating) {
    description += ` • Bewertung: ${poi.rating}/5`;
  }
  
  if (poi.flagged && poi.flagged_reason) {
    description += ` • ⚠️ Gemeldet: ${poi.flagged_reason}`;
  }
  
  return `    <wpt lat="${poi.lat.toFixed(6)}" lon="${poi.lng.toFixed(6)}">
      <name>${escapeXML(poi.name)}</name>
      <desc>${escapeXML(description)}</desc>
    </wpt>`;
}

function createGPXDocument(waypoints: string[]): string {
  const timestamp = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trucker Cockpit" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trucker POIs</name>
    <time>${timestamp}</time>
  </metadata>
${waypoints.join('\n')}
</gpx>`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function shareSinglePOI(
  poi: POI | POIWithDistance, 
  options: ShareOptions = { includeText: true, includeJSON: true, includeGPX: true }
): Promise<boolean> {
  try {
    console.log('Sharing single POI:', poi.name);
    
    const slug = createSlug(poi.name);
    const timestamp = formatDateTime();
    const exportData: ExportData = {};
    
    if (options.includeText) {
      exportData.text = formatPOIText(poi);
    }
    
    if (options.includeJSON) {
      const jsonData = createPOIJSON(poi);
      const jsonContent = JSON.stringify(jsonData, null, 2);
      const jsonFilename = `poi-${slug}-${timestamp}.json`;
      const jsonUri = `${FileSystem.documentDirectory}${jsonFilename}`;
      
      await FileSystem.writeAsStringAsync(jsonUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      exportData.jsonUri = jsonUri;
    }
    
    if (options.includeGPX) {
      const waypoint = createGPXWaypoint(poi);
      const gpxContent = createGPXDocument([waypoint]);
      const gpxFilename = `poi-${slug}-${timestamp}.gpx`;
      const gpxUri = `${FileSystem.documentDirectory}${gpxFilename}`;
      
      await FileSystem.writeAsStringAsync(gpxUri, gpxContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      exportData.gpxUri = gpxUri;
    }
    
    // Share files
    const filesToShare = [];
    if (exportData.jsonUri) filesToShare.push(exportData.jsonUri);
    if (exportData.gpxUri) filesToShare.push(exportData.gpxUri);
    
    if (Platform.OS === 'web') {
      // Web fallback - just log the data
      console.log('Share data (web):', exportData);
      return true;
    }
    
    if (filesToShare.length > 0) {
      await Sharing.shareAsync(filesToShare[0], {
        mimeType: filesToShare[0].endsWith('.json') ? 'application/json' : 'application/gpx+xml',
        dialogTitle: `POI: ${poi.name}`,
        UTI: filesToShare[0].endsWith('.json') ? 'public.json' : 'public.gpx'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error sharing POI:', error);
    return false;
  }
}

export async function shareMultiplePOIs(
  pois: (POI | POIWithDistance)[], 
  options: ShareOptions = { includeJSON: true, includeGPX: true }
): Promise<boolean> {
  try {
    console.log('Sharing multiple POIs:', pois.length);
    
    if (pois.length === 0) {
      throw new Error('No POIs to share');
    }
    
    if (pois.length > 10) {
      throw new Error('Maximum 10 POIs can be shared at once');
    }
    
    const timestamp = formatDateTime();
    const count = pois.length;
    const exportData: ExportData = {};
    
    if (options.includeJSON) {
      const jsonData = pois.map(poi => createPOIJSON(poi));
      const jsonContent = JSON.stringify(jsonData, null, 2);
      const jsonFilename = `pois-${count}-${timestamp}.json`;
      const jsonUri = `${FileSystem.documentDirectory}${jsonFilename}`;
      
      await FileSystem.writeAsStringAsync(jsonUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      exportData.jsonUri = jsonUri;
    }
    
    if (options.includeGPX) {
      const waypoints = pois.map(poi => createGPXWaypoint(poi));
      const gpxContent = createGPXDocument(waypoints);
      const gpxFilename = `pois-${count}-${timestamp}.gpx`;
      const gpxUri = `${FileSystem.documentDirectory}${gpxFilename}`;
      
      await FileSystem.writeAsStringAsync(gpxUri, gpxContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      exportData.gpxUri = gpxUri;
    }
    
    // Share files
    const filesToShare = [];
    if (exportData.jsonUri) filesToShare.push(exportData.jsonUri);
    if (exportData.gpxUri) filesToShare.push(exportData.gpxUri);
    
    if (Platform.OS === 'web') {
      // Web fallback - just log the data
      console.log('Share data (web):', exportData);
      return true;
    }
    
    if (filesToShare.length > 0) {
      await Sharing.shareAsync(filesToShare[0], {
        mimeType: filesToShare[0].endsWith('.json') ? 'application/json' : 'application/gpx+xml',
        dialogTitle: `${count} POIs`,
        UTI: filesToShare[0].endsWith('.json') ? 'public.json' : 'public.gpx'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error sharing multiple POIs:', error);
    return false;
  }
}

export async function exportAllPOIs(pois: POI[]): Promise<{ jsonUri?: string; gpxUri?: string; csvUri?: string }> {
  try {
    console.log('Exporting all POIs:', pois.length);
    
    const timestamp = formatDateTime();
    const result: { jsonUri?: string; gpxUri?: string; csvUri?: string } = {};
    
    // JSON Export
    const jsonData = pois.map(poi => createPOIJSON(poi));
    const jsonContent = JSON.stringify(jsonData, null, 2);
    const jsonFilename = `trucker-pois-${timestamp}.json`;
    const jsonUri = `${FileSystem.documentDirectory}${jsonFilename}`;
    
    await FileSystem.writeAsStringAsync(jsonUri, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    result.jsonUri = jsonUri;
    
    // GPX Export
    if (pois.length > 0) {
      const waypoints = pois.map(poi => createGPXWaypoint(poi));
      const gpxContent = createGPXDocument(waypoints);
      const gpxFilename = `trucker-pois-${timestamp}.gpx`;
      const gpxUri = `${FileSystem.documentDirectory}${gpxFilename}`;
      
      await FileSystem.writeAsStringAsync(gpxUri, gpxContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      result.gpxUri = gpxUri;
    }
    
    // CSV Export
    const csvHeaders = 'ID,Name,Type,Latitude,Longitude,Rating,Tags,OpenHours,PriceInfo,Favorite,Flagged,FlaggedReason,CreatedAt,UpdatedAt';
    const csvRows = pois.map(poi => {
      const row = [
        poi.id,
        `"${poi.name.replace(/"/g, '""')}"`,
        poi.type,
        poi.lat.toString(),
        poi.lng.toString(),
        poi.rating?.toString() || '',
        `"${poi.tags?.join(';') || ''}"`,
        `"${poi.open_hours?.replace(/"/g, '""') || ''}"`,
        `"${poi.price_info?.replace(/"/g, '""') || ''}"`,
        poi.favorite.toString(),
        poi.flagged.toString(),
        `"${poi.flagged_reason?.replace(/"/g, '""') || ''}"`,
        poi.created_at,
        poi.updated_at
      ];
      return row.join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const csvFilename = `trucker-pois-${timestamp}.csv`;
    const csvUri = `${FileSystem.documentDirectory}${csvFilename}`;
    
    await FileSystem.writeAsStringAsync(csvUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    result.csvUri = csvUri;
    
    console.log('Export completed:', result);
    return result;
  } catch (error) {
    console.error('Error exporting POIs:', error);
    throw error;
  }
}

export async function importPOIsFromJSON(jsonContent: string): Promise<{ pois: POI[]; errors: string[] }> {
  try {
    console.log('Importing POIs from JSON...');
    
    const data = JSON.parse(jsonContent);
    const pois: POI[] = [];
    const errors: string[] = [];
    
    const poiArray = Array.isArray(data) ? data : [data];
    
    for (let i = 0; i < poiArray.length; i++) {
      const item = poiArray[i];
      
      try {
        // Validate required fields
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`POI ${i + 1}: Name ist erforderlich`);
          continue;
        }
        
        if (!item.type || typeof item.type !== 'string') {
          errors.push(`POI ${i + 1}: Typ ist erforderlich`);
          continue;
        }
        
        if (typeof item.lat !== 'number' || typeof item.lng !== 'number') {
          errors.push(`POI ${i + 1}: Gültige Koordinaten sind erforderlich`);
          continue;
        }
        
        // Create POI object
        const poi: POI = {
          id: item.id || `imported-${Date.now()}-${i}`,
          name: item.name.trim(),
          type: item.type,
          lat: item.lat,
          lng: item.lng,
          rating: item.rating || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          open_hours: item.open_hours || null,
          price_info: item.price_info || null,
          favorite: Boolean(item.favorite),
          flagged: Boolean(item.flagged),
          flagged_reason: item.flagged_reason || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
        
        pois.push(poi);
      } catch (itemError) {
        errors.push(`POI ${i + 1}: ${itemError}`);
      }
    }
    
    console.log(`Import completed: ${pois.length} POIs, ${errors.length} errors`);
    return { pois, errors };
  } catch (error) {
    console.error('Error importing POIs:', error);
    return { pois: [], errors: [`JSON parsing error: ${error}`] };
  }
}