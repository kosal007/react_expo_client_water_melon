const DEFAULT_SERVER_URL = 'http://192.168.10.227:4000';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const SERVER_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL);
export const API_URL = `${SERVER_URL}/api`;

export const ENDPOINTS = {
  login: `${API_URL}/auth/login`,
  pushToken: `${API_URL}/user/push-token`,
} as const;
