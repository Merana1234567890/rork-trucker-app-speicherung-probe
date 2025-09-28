import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Text,
  TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Plus, List, Filter } from 'lucide-react-native';
import { usePOI } from '@/hooks/usePOI';
import { POI, LocationCoords, POIWithDistance } from '@/types';
import { POI_TYPE_COLORS } from '@/constants/poi';
import { COLORS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { NearbyPOIsBottomSheet } from '@/components/map/NearbyPOIsBottomSheet';

// Platform-specific imports
let MapComponent: any, MarkerComponent: any, ProviderGoogle: any;

if (Platform.OS === 'web') {
  const { WebMapView, WebMarker } = require('@/components/map/MapView.web');
  MapComponent = WebMapView;
  MarkerComponent = WebMarker;
  ProviderGoogle = undefined;
} else {
  const { NativeMapView, NativeMarker, NativeProviderGoogle } = require('@/components/map/MapView.native');
  MapComponent = NativeMapView;
  MarkerComponent = NativeMarker;
  ProviderGoogle = NativeProviderGoogle;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const { 
    getPOIsWithDistance, 
    updateCurrentLocation,
    settings 
  } = usePOI();
  
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const poisWithDistance = getPOIsWithDistance;

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (!locationPermission?.granted) return;
    
    setIsLoadingLocation(true);
    try {
      console.log('Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      updateCurrentLocation(coords);
      
      if (mapRef.current && settings.followLocation) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      
      console.log('Location updated:', coords);
    } catch (error) {
      console.error('Error getting location:', error);
      if (Platform.OS !== 'web') {
        // eslint-disable-next-line @rork/linters/platform-specific-no-alerts
        Alert.alert('Fehler', 'Standort konnte nicht ermittelt werden');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [locationPermission?.granted, updateCurrentLocation, settings.followLocation]);

  useEffect(() => {
    if (locationPermission?.granted && settings.followLocation) {
      getCurrentLocation();
    }
  }, [locationPermission, settings.followLocation, getCurrentLocation]);

  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(permission);
      
      if (!permission.granted) {
        console.log('Location permission denied');
        if (Platform.OS !== 'web') {
          // eslint-disable-next-line @rork/linters/platform-specific-no-alerts
          Alert.alert(
            'Standort-Berechtigung',
            'Um Ihre Position auf der Karte anzuzeigen und POIs in der Nähe zu finden, benötigen wir Zugriff auf Ihren Standort.',
            [
              { text: 'Später', style: 'cancel' },
              { text: 'Einstellungen öffnen', onPress: () => Location.requestForegroundPermissionsAsync() }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };



  const handleMapLongPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    if (!coordinate?.latitude || !coordinate?.longitude) return;
    
    console.log('Map long press at:', coordinate);
    
    if (Platform.OS !== 'web') {
      // eslint-disable-next-line @rork/linters/platform-specific-no-alerts
      Alert.alert(
        'POI hinzufügen',
        'Möchten Sie hier einen neuen POI anlegen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'POI anlegen', 
            onPress: () => {
              console.log('Navigate to add POI form with coords:', coordinate);
              // TODO: Navigate to add POI form
            }
          }
        ]
      );
    } else {
      console.log('Navigate to add POI form with coords:', coordinate);
      // TODO: Navigate to add POI form
    }
  };

  const handleMarkerPress = (poi: POI) => {
    if (!poi?.id || !poi?.name?.trim() || poi.name.length > 100) return;
    
    const sanitizedName = poi.name.trim();
    console.log('Marker pressed:', sanitizedName);
    // TODO: Show POI details modal
  };

  const handleNavigateToPOI = (poi: POI) => {
    if (!poi?.lat || !poi?.lng || !poi?.name?.trim()) return;
    
    const url = `https://maps.google.com/?q=${poi.lat},${poi.lng}`;
    console.log('Opening navigation to:', poi.name, url);
    // TODO: Open external navigation app
  };

  const renderMarker = (poi: POI, MarkerComponent: any) => {
    if (!poi?.id || !poi?.name?.trim() || poi.name.length > 100) return null;
    
    const color = POI_TYPE_COLORS[poi.type];
    const sanitizedName = poi.name.trim();
    
    return (
      <MarkerComponent
        key={poi.id}
        coordinate={{ latitude: poi.lat, longitude: poi.lng }}
        title={sanitizedName}
        description={`${poi.type}${(poi as POIWithDistance).distance ? ` • ${(poi as POIWithDistance).distance} km` : ''}`}
        onPress={() => handleMarkerPress(poi)}
        testID={`poi-marker-${poi.id}`}
      >
        <View style={[styles.markerContainer, { backgroundColor: color }]}>
          <MapPin size={16} color="white" />
          {poi.flagged && (
            <View style={styles.flaggedBadge}>
              <Text style={styles.flaggedText}>!</Text>
            </View>
          )}
        </View>
      </MarkerComponent>
    );
  };

  const renderLocationPermissionCard = () => (
    <View style={[styles.permissionCard, { top: insets.top + 20 }]}>
      <Text style={styles.permissionTitle}>Standort deaktiviert</Text>
      <Text style={styles.permissionText}>
        Aktivieren Sie den Standort, um Ihre Position zu sehen und POIs in der Nähe zu finden.
      </Text>
      <Button
        title="Berechtigung erteilen"
        onPress={requestLocationPermission}
        size="small"
        style={styles.permissionButton}
        testID="location-permission-button"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        provider={ProviderGoogle}
        initialRegion={{
          latitude: 52.5200,
          longitude: 13.4050,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={locationPermission?.granted}
        showsMyLocationButton={false}
        onLongPress={handleMapLongPress}
        testID="map-view"
      >
        {poisWithDistance.map((poi) => renderMarker(poi, MarkerComponent)).filter(Boolean)}
      </MapComponent>

      {!locationPermission?.granted && renderLocationPermissionCard()}

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowBottomSheet(!showBottomSheet)}
          testID="nearby-pois-button"
        >
          <List size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => console.log('Open filter')}
          testID="filter-button"
        >
          <Filter size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={() => console.log('Add POI')}
          testID="add-poi-button"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* My Location Button */}
      {locationPermission?.granted && (
        <TouchableOpacity
          style={[styles.locationButton, { top: insets.top + 20 }]}
          onPress={getCurrentLocation}
          disabled={isLoadingLocation}
          testID="my-location-button"
        >
          <MapPin size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      <NearbyPOIsBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onPOISelect={handleMarkerPress}
        onNavigateToPOI={handleNavigateToPOI}
      />
      
      {/* TODO: Add POI details modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flaggedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  flaggedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  permissionCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabPrimary: {
    backgroundColor: COLORS.primary,
  },
  fabSecondary: {
    backgroundColor: COLORS.secondary,
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});