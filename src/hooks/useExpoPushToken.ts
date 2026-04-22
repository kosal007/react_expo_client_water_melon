import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const FCM_DEVICE_TOKEN_KEY = 'fcmDeviceToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useExpoPushToken = () => {
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2563eb',
          });
        }

        if (!Device.isDevice) {
          console.warn('Push notifications require a physical device.');
          return;
        }

        const current = await Notifications.getPermissionsAsync();
        let finalStatus = current.status;

        if (finalStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== 'granted') {
          await AsyncStorage.removeItem(FCM_DEVICE_TOKEN_KEY);
          console.warn('Push notification permission was not granted.');
          return;
        }

        const nativeToken = await Notifications.getDevicePushTokenAsync();
        const token = nativeToken?.data;

        if (typeof token === 'string' && token.length > 0) {
          await AsyncStorage.setItem(FCM_DEVICE_TOKEN_KEY, token);
          console.log('FCM device token:', token);
        }
      } catch (error) {
        console.warn('Failed to initialize push notifications:', error);
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title ?? '(no title)');
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification interaction:', response.actionIdentifier);
    });

    void registerForPushNotificationsAsync();

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
};
