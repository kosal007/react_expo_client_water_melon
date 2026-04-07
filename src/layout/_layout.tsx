import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../contexts';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import RootNavigator from '../navigation/RootNavigator';

export default function RootLayout() {
  useBackgroundSync();

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
