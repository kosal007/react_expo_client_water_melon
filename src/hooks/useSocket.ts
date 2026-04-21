import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from '../config/network';

const TOKEN_KEY = 'token';

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

let sharedSocket: Socket | null = null;

const getOrCreateSocket = (): Socket => {
  if (sharedSocket) {
    return sharedSocket;
  }

  sharedSocket = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
  });

  return sharedSocket;
};

export const useSocket = (): { socket: Socket; status: SocketStatus } => {
  const socket = useMemo(() => getOrCreateSocket(), []);
  const [status, setStatus] = useState<SocketStatus>(socket.connected ? 'connected' : 'connecting');

  useEffect(() => {
    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => {
      setStatus('disconnected');
    };
    const handleConnectError = () => setStatus('error');
    const handleError = () => setStatus('error');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('error', handleError);

    setStatus('connecting');

    let isMounted = true;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        if (!isMounted) {
          return;
        }

        if (!token) {
          setStatus('disconnected');
          return;
        }

        socket.auth = { token };

        if (!socket.connected) {
          socket.connect();
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    void connectSocket();

    return () => {
      isMounted = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('error', handleError);
    };
  }, [socket]);

  return { socket, status };
};
