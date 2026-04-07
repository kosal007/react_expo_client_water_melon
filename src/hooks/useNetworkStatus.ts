import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

const toOnlineState = (isConnected: boolean | null, isInternetReachable: boolean | null): boolean => {
  return isConnected === true && isInternetReachable === true;
};

export const useNetworkStatus = (): { isOnline: boolean } => {
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const state = await NetInfo.fetch();
      if (isMounted) {
        setIsOnline(toOnlineState(state.isConnected, state.isInternetReachable));
      }
    };

    void initialize();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(toOnlineState(state.isConnected, state.isInternetReachable));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline };
};
