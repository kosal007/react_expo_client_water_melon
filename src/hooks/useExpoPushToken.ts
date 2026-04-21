import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export type ExpoPermissionStatus = Notifications.PermissionStatus | 'undetermined';

type UseExpoPushTokenResult = {
  expoPushToken: string | null;
  permissionStatus: ExpoPermissionStatus;
};

export const useExpoPushToken = (): UseExpoPushTokenResult => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<ExpoPermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED
  );

  useEffect(() => {
    let isMounted = true;

    const setupPushToken = async () => {
      try {
        const existingPermission = await Notifications.getPermissionsAsync();
        let nextStatus = existingPermission.status;

        if (nextStatus !== Notifications.PermissionStatus.GRANTED) {
          const requestedPermission = await Notifications.requestPermissionsAsync();
          nextStatus = requestedPermission.status;
        }

        if (!isMounted) {
          return;
        }

        setPermissionStatus(nextStatus);

        if (nextStatus !== Notifications.PermissionStatus.GRANTED) {
          setExpoPushToken(null);
          return;
        }

        const projectId =
          Constants?.easConfig?.projectId ??
          (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

        const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

        if (isMounted) {
          setExpoPushToken(tokenResponse.data);
        }
      } catch (error) {
        if (isMounted) {
          setExpoPushToken(null);
          setPermissionStatus(Notifications.PermissionStatus.DENIED);
        }
      }
    };

    void setupPushToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    expoPushToken,
    permissionStatus,
  };
};
