import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GeofenceAttendanceProvider, LanguageProvider } from '../contexts';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { useAuth } from '../hooks/useAuth';
import { useGeofenceAttendance } from '../hooks/useGeofenceAttendance';
import RootNavigator from '../navigation/RootNavigator';

export default function RootLayout() {
  useBackgroundSync();
  const { token, user } = useAuth();
  const geofenceAttendance = useGeofenceAttendance({
    token,
    enabled: Boolean(user),
  });

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const current = await Location.getForegroundPermissionsAsync();
        if (current.status !== Location.PermissionStatus.GRANTED) {
          await Location.requestForegroundPermissionsAsync();
        }
      } catch (error) {
        console.warn('Location permission request failed:', error);
      }
    };

    void requestLocationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <GeofenceAttendanceProvider value={geofenceAttendance}>
        <LanguageProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </LanguageProvider>
      </GeofenceAttendanceProvider>
    </SafeAreaProvider>
  );
}
