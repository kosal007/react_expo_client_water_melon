import { useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  fetchAttendanceCurrent,
  fetchStoreGeofence,
  triggerCheckIn,
  triggerCheckOut,
  type GeofenceConfig,
} from '../api/attendance';

type PresenceState = 'inside' | 'outside';

type GeofenceAttendanceOptions = {
  token: string | null;
  enabled?: boolean;
};

type GeofenceAttendanceState = {
  geofence: GeofenceConfig | null;
  presence: PresenceState | null;
  isTracking: boolean;
  lastDistanceMeters: number | null;
  error: string | null;
};

const EARTH_RADIUS_METERS = 6_371_000;
const LOCATION_TIME_INTERVAL_MS = 15_000;
const LOCATION_DISTANCE_INTERVAL_METERS = 15;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const distanceBetweenMeters = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number => {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

export const useGeofenceAttendance = ({ token, enabled = true }: GeofenceAttendanceOptions): GeofenceAttendanceState => {
  const [geofence, setGeofence] = useState<GeofenceConfig | null>(null);
  const [presence, setPresence] = useState<PresenceState | null>(null);
  const [lastDistanceMeters, setLastDistanceMeters] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousPresenceRef = useRef<PresenceState | null>(null);
  const transitionInFlightRef = useRef(false);

  const canRun = useMemo(() => enabled && Boolean(token), [enabled, token]);

  useEffect(() => {
    if (!canRun || !token) {
      setGeofence(null);
      setPresence(null);
      setLastDistanceMeters(null);
      setIsTracking(false);
      setError(null);
      previousPresenceRef.current = null;
      transitionInFlightRef.current = false;
      return;
    }

    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const processLocation = async (
      locationLatitude: number,
      locationLongitude: number,
      geofenceConfig: GeofenceConfig,
      currentToken: string
    ) => {
      const distance = distanceBetweenMeters(
        locationLatitude,
        locationLongitude,
        geofenceConfig.latitude,
        geofenceConfig.longitude
      );
      const radius = geofenceConfig.radius;
      const nextPresence: PresenceState = distance <= radius ? 'inside' : 'outside';

      if (!isMounted) {
        return;
      }

      setLastDistanceMeters(distance);
      setPresence(nextPresence);

      const previousPresence = previousPresenceRef.current;

      if (!previousPresence) {
        previousPresenceRef.current = nextPresence;
        return;
      }

      if (previousPresence === nextPresence) {
        return;
      }

      if (transitionInFlightRef.current) {
        return;
      }

      transitionInFlightRef.current = true;

      try {
        if (previousPresence === 'outside' && nextPresence === 'inside') {
          if (!geofenceConfig.storeId) {
            throw new Error('Missing storeId in geofence configuration.');
          }
          await triggerCheckIn(currentToken, geofenceConfig.storeId);
        } else if (previousPresence === 'inside' && nextPresence === 'outside') {
          await triggerCheckOut(currentToken);
        }

        previousPresenceRef.current = nextPresence;
        setError(null);
      } catch (transitionError) {
        const message = transitionError instanceof Error ? transitionError.message : 'Attendance transition failed.';
        setError(message);
      } finally {
        transitionInFlightRef.current = false;
      }
    };

    const start = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          const requested = await Location.requestForegroundPermissionsAsync();
          if (requested.status !== Location.PermissionStatus.GRANTED) {
            if (isMounted) {
              setIsTracking(false);
              setError('Location permission denied.');
            }
            return;
          }
        }

        const geofenceConfig = await fetchStoreGeofence(token);

        if (!isMounted) {
          return;
        }

        setGeofence(geofenceConfig);

        const hasActiveSession = await fetchAttendanceCurrent(token);

        if (!isMounted) {
          return;
        }

        previousPresenceRef.current = hasActiveSession ? 'inside' : 'outside';

        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        await processLocation(
          initialPosition.coords.latitude,
          initialPosition.coords.longitude,
          geofenceConfig,
          token
        );

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: LOCATION_TIME_INTERVAL_MS,
            distanceInterval: LOCATION_DISTANCE_INTERVAL_METERS,
          },
          (position) => {
            if (transitionInFlightRef.current) {
              return;
            }

            const { latitude, longitude } = position.coords;
            void processLocation(latitude, longitude, geofenceConfig, token);
          }
        );

        if (!isMounted) {
          subscription.remove();
          subscription = null;
          return;
        }

        setIsTracking(true);
      } catch (startError) {
        if (!isMounted) {
          return;
        }

        const message = startError instanceof Error ? startError.message : 'Unable to start geofence attendance tracking.';
        setError(message);
        setIsTracking(false);
      }
    };

    void start();

    return () => {
      isMounted = false;
      subscription?.remove();
      transitionInFlightRef.current = false;
      setIsTracking(false);
    };
  }, [canRun, token]);

  return {
    geofence,
    presence,
    isTracking,
    lastDistanceMeters,
    error,
  };
};
