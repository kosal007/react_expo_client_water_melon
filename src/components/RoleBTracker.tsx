import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSocket } from '../hooks/useSocket';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RoleBTrackerProps = {
  userId: string;
};

type TrackerState = 'idle' | 'sending' | 'error';

const LOCATION_EVENT_NAME = 'location:update';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RoleBTracker({ userId }: RoleBTrackerProps) {
  const { socket, status } = useSocket();
  const navigation = useNavigation<NavigationProp>();
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [trackerState, setTrackerState] = useState<TrackerState>('idle');
  const [error, setError] = useState<string | null>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        setPermissionState('checking');

        const foreground = await Location.requestForegroundPermissionsAsync();
        if (foreground.status !== Location.PermissionStatus.GRANTED) {
          setPermissionState('denied');
          setError('Foreground location permission denied.');
          return;
        }

        setPermissionState('granted');
        setError(null);

        // Background permission is optional for this screen flow.
        // We only need foreground permission to send current location while app is active.
        if (Platform.OS === 'android') {
          try {
            const background = await Location.requestBackgroundPermissionsAsync();
            if (background.status !== Location.PermissionStatus.GRANTED) {
              setError('Background location denied. Tracking works while app is open.');
            }
          } catch (backgroundError) {
            setError('Background location unavailable. Tracking works while app is open.');
          }
        }
      } catch (permissionError) {
        setPermissionState('error');
        const message = permissionError instanceof Error ? permissionError.message : 'Unknown error';
        setError(`Failed to request location permissions: ${message}`);
      }
    };

    void requestPermissions();
  }, []);

  useEffect(() => {
    if (permissionState !== 'granted') {
      return;
    }

    const sendLocation = async () => {
      if (status !== 'connected') {
        return;
      }

      if (isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;

      try {
        setTrackerState('sending');
        setError(null);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const payload = {
          userId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          updatedAt: new Date().toISOString(),
        };

        socket.emit(LOCATION_EVENT_NAME, payload);
        setTrackerState('idle');
      } catch (sendError) {
        setTrackerState('error');
        setError('Failed to send location update.');
      } finally {
        isSendingRef.current = false;
      }
    };

    void sendLocation();
    const intervalId = setInterval(() => {
      void sendLocation();
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [permissionState, socket, status, userId]);

  const humanStatus =
    permissionState === 'denied'
      ? 'Permission denied'
      : permissionState === 'checking'
        ? 'Checking permissions...'
        : status !== 'connected'
          ? 'Disconnected'
          : trackerState === 'sending'
            ? 'Sending location...'
            : 'Sending location...';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROLE_B Tracker</Text>
      <Text style={styles.label}>{humanStatus}</Text>
      <Text style={styles.meta}>Socket: {status}</Text>

      {permissionState === 'checking' || trackerState === 'sending' ? <ActivityIndicator size="small" /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.productsButton} onPress={() => navigation.navigate('Products')}>
        <Text style={styles.productsButtonText}>Go to Products</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
  errorText: {
    marginTop: 8,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  productsButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  productsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
