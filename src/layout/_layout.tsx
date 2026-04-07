import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import RootNavigator from '../navigation/RootNavigator';

export default function RootLayout() {
  useBackgroundSync();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
