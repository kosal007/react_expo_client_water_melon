import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { ProductScreen , HomeScreen , SettingsScreen, LoginScreen, RoleAScreen } from '../screens';

export type RootStackParamList = {
  Login: undefined;
  RoleAHome: undefined;
  Home: undefined;
  Products: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#0B1220' : '#F8FAFC';

  return (
    <Stack.Navigator
      id="root-stack"
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleAHome" component={RoleAScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Products" component={ProductScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
