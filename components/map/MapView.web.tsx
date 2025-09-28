import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, ExternalLink } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { LocationCoords } from '@/types';

interface WebMapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  onLongPress?: (event: { nativeEvent: { coordinate: LocationCoords } }) => void;
  children?: React.ReactNode;
  testID?: string;
}

interface WebMarkerProps {
  coordinate: LocationCoords;
  title?: string;
  description?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  testID?: string;
}

const WebMapViewComponent = React.forwardRef<any, WebMapViewProps>(({
  style,
  initialRegion,
  showsUserLocation,
  onLongPress,
  children,
  testID,
  ...props
}, ref) => {
  const region = initialRegion || {
    latitude: 52.5200,
    longitude: 13.4050,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const handleOpenInMaps = () => {
    const url = `https://maps.google.com/?q=${region.latitude},${region.longitude}&z=12`;
    window.open(url, '_blank');
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress({
        nativeEvent: {
          coordinate: {
            latitude: region.latitude,
            longitude: region.longitude,
          }
        }
      });
    }
  };

  return (
    <View style={[styles.webMapContainer, style]} testID={testID}>
      <View style={styles.webMapPlaceholder}>
        <MapPin size={48} color={COLORS.primary} />
        <Text style={styles.webMapTitle}>Karte (Web-Version)</Text>
        <Text style={styles.webMapText}>
          Die interaktive Karte ist nur in der mobilen App verfügbar.
        </Text>
        <Text style={styles.webMapText}>
          Verwenden Sie den QR-Code, um die App auf Ihrem Mobilgerät zu öffnen.
        </Text>
        
        <TouchableOpacity 
          style={styles.openMapsButton}
          onPress={handleOpenInMaps}
        >
          <ExternalLink size={16} color="white" />
          <Text style={styles.openMapsText}>In Google Maps öffnen</Text>
        </TouchableOpacity>

        {onLongPress && (
          <TouchableOpacity 
            style={styles.addPOIButton}
            onPress={handleLongPress}
          >
            <Text style={styles.addPOIText}>POI hier hinzufügen</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Render markers as a list on web */}
      <View style={styles.webMarkersList}>
        {children}
      </View>
    </View>
  );
});

WebMapViewComponent.displayName = 'WebMapView';

export const WebMapView = WebMapViewComponent;

export const WebMarker: React.FC<WebMarkerProps> = ({
  coordinate,
  title,
  description,
  onPress,
  children,
  testID
}) => {
  const handleOpenLocation = () => {
    const url = `https://maps.google.com/?q=${coordinate.latitude},${coordinate.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <TouchableOpacity 
      style={styles.webMarkerItem}
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.webMarkerContent}>
        {children}
        <View style={styles.webMarkerInfo}>
          <Text style={styles.webMarkerTitle}>{title}</Text>
          {description && (
            <Text style={styles.webMarkerDescription}>{description}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.webMarkerMapButton}
          onPress={handleOpenLocation}
        >
          <ExternalLink size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f0f8ff',
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  webMapText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  openMapsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  addPOIButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  addPOIText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  webMarkersList: {
    maxHeight: 200,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  webMarkerItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webMarkerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  webMarkerInfo: {
    flex: 1,
  },
  webMarkerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  webMarkerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  webMarkerMapButton: {
    padding: 8,
  },
});