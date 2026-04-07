import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { ProductScreen } from '../screens';

export type RootStackParamList = {
  Products: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#0B1220' : '#F8FAFC';

  return (
    <Stack.Navigator
      id="root-stack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="Products" component={ProductScreen} />
    </Stack.Navigator>
  );
}
