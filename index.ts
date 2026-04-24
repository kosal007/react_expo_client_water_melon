import { registerRootComponent } from 'expo';
import { getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

import App from './App';

if (getApps().length > 0) {
	messaging().setBackgroundMessageHandler(async remoteMessage => {
		console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
	});
} else {
	console.warn('[FCM] Firebase default app is not configured. Skipping background message handler.');
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
