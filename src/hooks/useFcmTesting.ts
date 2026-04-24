import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { getApps } from '@react-native-firebase/app';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

type PermissionState = 'unknown' | 'granted' | 'denied';

const isFirebaseConfigured = (): boolean => getApps().length > 0;

const normalizeMessage = (message?: FirebaseMessagingTypes.RemoteMessage | null) => {
  if (!message) {
    return '';
  }

  const title = message.notification?.title;
  const body = message.notification?.body;
  const data = message.data ? JSON.stringify(message.data) : '';

  return [title, body, data].filter(Boolean).join(' | ');
};

const requestAndroid13Permission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version < 33) {
    return true;
  }

  const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return status === PermissionsAndroid.RESULTS.GRANTED;
};

const showForegroundHeadsUpNotification = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  const title = message.notification?.title ?? 'New message';
  const body = message.notification?.body ?? 'You received a notification';

  const channelId = await notifee.createChannel({
    id: 'fcm-foreground',
    name: 'FCM Foreground',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    data: message.data,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
  });
};

export function useFcmTesting() {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [fcmToken, setFcmToken] = useState<string>('');
  const [lastMessage, setLastMessage] = useState<string>('');

  const refreshToken = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      console.warn('[FCM] Firebase default app is not configured. Add GoogleService-Info.plist (iOS) and google-services.json (Android).');
      setFcmToken('');
      return '';
    }

    try {
      const token = await messaging().getToken();
      setFcmToken(token);
      console.log('[FCM] Device token:', token);
      return token;
    } catch (error) {
      console.warn('[FCM] Failed to get token:', error);
      setFcmToken('');
      return '';
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isFirebaseConfigured()) {
      console.warn('[FCM] Firebase default app is not configured. FCM listeners are disabled for this build.');
      setPermission('denied');
      setLastMessage('Firebase app is not configured on this device build');
      return () => {
        isMounted = false;
      };
    }

    const initialize = async () => {
      try {
        await messaging().registerDeviceForRemoteMessages();
      } catch (error) {
        console.warn('[FCM] registerDeviceForRemoteMessages failed:', error);
      }

      const androidGranted = await requestAndroid13Permission();
      if (!androidGranted) {
        if (isMounted) {
          setPermission('denied');
        }
        return;
      }

      try {
        const authStatus = await messaging().requestPermission();
        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (isMounted) {
          setPermission(granted ? 'granted' : 'denied');
        }

        if (granted) {
          await refreshToken();
        }
      } catch (error) {
        console.warn('[FCM] Permission request failed:', error);
        if (isMounted) {
          setPermission('denied');
        }
      }
    };

    const foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
      const messageText = normalizeMessage(remoteMessage);
      console.log('[FCM] Foreground message:', JSON.stringify(remoteMessage));

      try {
        await showForegroundHeadsUpNotification(remoteMessage);
      } catch (error) {
        console.warn('[FCM] Failed to show foreground notification:', error);
      }

      if (isMounted) {
        setLastMessage(messageText || 'Foreground message received');
      }
    });

    const openedUnsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const messageText = normalizeMessage(remoteMessage);
      console.log('[FCM] Notification opened app:', JSON.stringify(remoteMessage));
      if (isMounted) {
        setLastMessage(messageText || 'Notification opened the app');
      }
    });

    void messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (!remoteMessage || !isMounted) {
          return;
        }

        const messageText = normalizeMessage(remoteMessage);
        setLastMessage(messageText || 'App opened from quit state notification');
      })
      .catch(error => {
        console.warn('[FCM] getInitialNotification failed:', error);
      });

    const tokenRefreshUnsubscribe = messaging().onTokenRefresh(token => {
      if (!isMounted) {
        return;
      }
      setFcmToken(token);
      console.log('[FCM] Token refreshed:', token);
    });

    void initialize();

    return () => {
      isMounted = false;
      foregroundUnsubscribe();
      openedUnsubscribe();
      tokenRefreshUnsubscribe();
    };
  }, [refreshToken]);

  const shortToken = useMemo(() => {
    if (!fcmToken) {
      return 'Not available';
    }

    if (fcmToken.length <= 28) {
      return fcmToken;
    }

    return `${fcmToken.slice(0, 14)}...${fcmToken.slice(-10)}`;
  }, [fcmToken]);

  return {
    permission,
    fcmToken,
    shortToken,
    lastMessage,
    refreshToken,
  };
}
