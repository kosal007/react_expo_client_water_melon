import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { LoginScreen, ProductScreen, HomeScreen, SettingsScreen } from '../screens';
import { useAuth } from '../hooks';
import type { RootStackParamList } from '../navigation/types';

export type { AppUserRole, AppUser, RootStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isInitializing, user } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#0B1220' : '#F8FAFC';

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={user ? 'authenticated' : 'anonymous'}
      id="root-stack"
      initialRouteName={user ? 'Home' : 'Login'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} initialParams={user ? { user } : undefined} />
      <Stack.Screen name="Products" component={ProductScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
