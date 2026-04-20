import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSocket } from '../hooks/useSocket';

type LocationUpdatePayload = {
  userId: string;
  lat: number;
  lng: number;
  updatedAt: string;
};

const LOCATION_EVENT_NAME = 'location:update';

const DEFAULT_REGION: Region = {
  latitude: 11.5564,
  longitude: 104.9282,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RoleAViewer() {
  const { socket, status } = useSocket();
  const mapRef = useRef<MapView | null>(null);
  const [locationsByUser, setLocationsByUser] = useState<Record<string, LocationUpdatePayload>>({});
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handleLocationUpdate = (payload: LocationUpdatePayload) => {
      if (
        typeof payload?.userId !== 'string' ||
        typeof payload?.lat !== 'number' ||
        typeof payload?.lng !== 'number' ||
        typeof payload?.updatedAt !== 'string'
      ) {
        return;
      }

      setLocationsByUser((current) => ({
        ...current,
        [payload.userId]: payload,
      }));
    };

    socket.on(LOCATION_EVENT_NAME, handleLocationUpdate);

    return () => {
      socket.off(LOCATION_EVENT_NAME, handleLocationUpdate);
    };
  }, [socket]);

  const markers = useMemo(() => Object.values(locationsByUser), [locationsByUser]);

  const region = useMemo<Region>(() => {
    if (markers.length === 0) {
      return DEFAULT_REGION;
    }

    return {
      latitude: markers[0].lat,
      longitude: markers[0].lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [markers]);

  const handleCurrentLocation = async () => {
    if (isLocating) {
      return;
    }

    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Location permission', 'Please allow location permission to use current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(nextRegion, 500);
    } catch {
      Alert.alert('Location error', 'Unable to get current location.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
      >
        {markers.map((item) => (
          <Marker key={item.userId} coordinate={{ latitude: item.lat, longitude: item.lng }}>
            <View style={styles.driverMarkerContainer}>
              <Text style={styles.driverMarkerEmoji}>🚗</Text>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Driver: {item.userId}</Text>
                <Text style={styles.calloutDescription}>
                  Updated: {new Date(item.updatedAt).toLocaleTimeString()}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Pressable style={styles.currentLocationButton} onPress={() => void handleCurrentLocation()}>
        <Text style={styles.currentLocationButtonText}>{isLocating ? 'Locating...' : 'Current Location'}</Text>
      </Pressable>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Socket: {status}</Text>
        <Text style={styles.statusText}>Tracking {markers.length} ROLE_B user(s)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
  },
  driverMarkerContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  driverMarkerEmoji: {
    fontSize: 18,
  },
  calloutContainer: {
    minWidth: 150,
    paddingVertical: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  calloutDescription: {
    marginTop: 3,
    fontSize: 12,
    color: '#334155',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 12,
    bottom: 92,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentLocationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
});
