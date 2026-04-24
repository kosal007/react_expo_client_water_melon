import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import type { GeofenceConfig } from '../api/attendance';

type PresenceState = 'inside' | 'outside';

type GeofenceAttendanceSnapshot = {
  geofence: GeofenceConfig | null;
  presence: PresenceState | null;
  isTracking: boolean;
  lastDistanceMeters: number | null;
  error: string | null;
};

const defaultSnapshot: GeofenceAttendanceSnapshot = {
  geofence: null,
  presence: null,
  isTracking: false,
  lastDistanceMeters: null,
  error: null,
};

const GeofenceAttendanceContext = createContext<GeofenceAttendanceSnapshot>(defaultSnapshot);

type GeofenceAttendanceProviderProps = PropsWithChildren<{
  value: GeofenceAttendanceSnapshot;
}>;

export function GeofenceAttendanceProvider({ value, children }: GeofenceAttendanceProviderProps) {
  const memoValue = useMemo(() => value, [value]);
  return <GeofenceAttendanceContext.Provider value={memoValue}>{children}</GeofenceAttendanceContext.Provider>;
}

export const useGeofenceAttendanceContext = () => useContext(GeofenceAttendanceContext);
