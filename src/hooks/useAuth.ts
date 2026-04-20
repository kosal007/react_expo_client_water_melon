import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from '../navigation/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

type AuthState = {
  isInitializing: boolean;
  token: string | null;
  user: AppUser | null;
};

type AuthListener = (state: AuthState) => void;

let authState: AuthState = {
  isInitializing: true,
  token: null,
  user: null,
};

const listeners = new Set<AuthListener>();
let hasHydrated = false;

const emit = () => {
  listeners.forEach((listener) => listener(authState));
};

const setAuthState = (nextState: AuthState) => {
  authState = nextState;
  emit();
};

const hydrateAuthState = async () => {
  try {
    const [token, userString] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);

    if (token && userString) {
      const user = JSON.parse(userString) as AppUser;
      setAuthState({
        isInitializing: false,
        token,
        user,
      });
      return;
    }

    setAuthState({
      isInitializing: false,
      token: null,
      user: null,
    });
  } catch (error) {
    setAuthState({
      isInitializing: false,
      token: null,
      user: null,
    });
  }
};

export const setSession = async (token: string, user: AppUser) => {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);

  setAuthState({
    isInitializing: false,
    token,
    user,
  });
};

export const logout = async () => {
  await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);

  setAuthState({
    isInitializing: false,
    token: null,
    user: null,
  });
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    listeners.add(setState);

    if (!hasHydrated) {
      hasHydrated = true;
      void hydrateAuthState();
    }

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    isAuthenticated: Boolean(state.token && state.user),
  };
};
