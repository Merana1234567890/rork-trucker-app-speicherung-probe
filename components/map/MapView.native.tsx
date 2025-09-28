import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';

export const NativeMapView = MapView;
export const NativeMarker = Marker;
export const NativeProviderGoogle = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;