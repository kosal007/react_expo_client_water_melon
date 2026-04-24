import { API_URL } from '../config/network';

export type GeofenceConfig = {
  storeId: string;
  latitude: number;
  longitude: number;
  radius: number;
};

type AttendanceCurrentResponse = {
  active?: boolean;
  isActive?: boolean;
  hasActiveSession?: boolean;
  activeSession?: boolean;
  status?: string;
  data?: Record<string, unknown>;
};

const resolveApiUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Avoid duplicating '/api' when caller passes '/api/...'
  if (path.startsWith('/api/')) {
    return `${API_URL}${path.replace(/^\/api/, '')}`;
  }

  if (path.startsWith('api/')) {
    return `${API_URL}/${path.replace(/^api\//, '')}`;
  }

  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }

  return `${API_URL}/${path}`;
};

const summarizeResponseBody = (body: string, contentType: string): string => {
  if (!body) {
    return '';
  }

  if (contentType.includes('text/html') || /<!doctype html>|<html/i.test(body)) {
    return 'Received HTML response (endpoint may be incorrect or unavailable).';
  }

  const compact = body.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return '';
  }

  const MAX_LENGTH = 180;
  return compact.length > MAX_LENGTH ? `${compact.slice(0, MAX_LENGTH)}...` : compact;
};

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const pickStoreId = (candidate: Record<string, unknown>): string | null => {
  const possible = [candidate.storeId, candidate.id].find((value) => typeof value === 'string');
  if (typeof possible !== 'string') {
    return null;
  }

  return isUuid(possible) ? possible : null;
};

const extractGeofence = (payload: unknown): GeofenceConfig | null => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    const activeFirst = payload
      .filter((item) => item && typeof item === 'object')
      .sort((a, b) => {
        const aStatus = (a as Record<string, unknown>).status;
        const bStatus = (b as Record<string, unknown>).status;
        const aRank = typeof aStatus === 'string' && aStatus.toLowerCase() === 'active' ? 0 : 1;
        const bRank = typeof bStatus === 'string' && bStatus.toLowerCase() === 'active' ? 0 : 1;
        return aRank - bRank;
      });

    for (const item of activeFirst) {
      const geofence = extractGeofence(item);
      if (geofence) {
        return geofence;
      }
    }

    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const storeId = pickStoreId(candidate);
  const latitude = safeNumber(candidate.latitude);
  const longitude = safeNumber(candidate.longitude);
  const radius = safeNumber(candidate.radius);

  if (storeId && latitude !== null && longitude !== null && radius !== null && radius > 0) {
    return { storeId, latitude, longitude, radius };
  }

  const nested = ['data', 'stores', 'store', 'geofence'];
  for (const key of nested) {
    const maybeGeofence = extractGeofence(candidate[key]);
    if (maybeGeofence) {
      return maybeGeofence;
    }
  }

  return null;
};

const request = async <T = unknown>(url: string, token: string, options: RequestInit = {}): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      const contentType = response.headers.get('content-type') || '';
      const summary = summarizeResponseBody(body, contentType);
      const details = summary ? ` - ${summary}` : '';
      throw new Error(`HTTP ${response.status} for ${url}${details}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchStoreGeofence = async (token: string): Promise<GeofenceConfig> => {
  const endpointCandidates = [
    process.env.EXPO_PUBLIC_ATTENDANCE_GEOFENCE_ENDPOINT,
    '/api/stores',
    '/stores',
    '/attendance/store-geofence',
    '/attendance/geofences',
    '/attendance/stores',
    '/stores',
  ].filter(Boolean) as string[];

  let lastError: unknown = null;
  const failedEndpoints: string[] = [];

  for (const path of endpointCandidates) {
    const url = resolveApiUrl(path);
    try {
      const payload = await request<unknown>(url, token, { method: 'GET' });
      const geofence = extractGeofence(payload);
      if (geofence) {
        return geofence;
      }

      failedEndpoints.push(`${url} (missing geofence fields)`);
    } catch (error) {
      lastError = error;
      failedEndpoints.push(url);
    }
  }

  const lastMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
  const tried = failedEndpoints.length > 0 ? ` Tried: ${failedEndpoints.join(', ')}` : '';
  throw new Error(`Unable to fetch store geofence.${tried} Last error: ${lastMessage}`);
};

export const fetchAttendanceCurrent = async (token: string): Promise<boolean> => {
  const payload = await request<AttendanceCurrentResponse>(resolveApiUrl('/attendance/current'), token, {
    method: 'GET',
  });

  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (payload.active === true || payload.isActive === true || payload.hasActiveSession === true || payload.activeSession === true) {
    return true;
  }

  if (typeof payload.status === 'string') {
    return payload.status.toLowerCase() === 'active';
  }

  const nested = payload.data;
  if (nested && typeof nested === 'object') {
    const data = nested as Record<string, unknown>;
    return (
      data.active === true ||
      data.isActive === true ||
      data.hasActiveSession === true ||
      data.activeSession === true ||
      (typeof data.status === 'string' && data.status.toLowerCase() === 'active')
    );
  }

  return false;
};

export const triggerCheckIn = async (token: string, storeId: string): Promise<void> => {
  await request(resolveApiUrl('/attendance/check-in'), token, {
    method: 'POST',
    body: JSON.stringify({ storeId }),
  });
};

export const triggerCheckOut = async (token: string): Promise<void> => {
  await request(resolveApiUrl('/attendance/check-out'), token, {
    method: 'POST',
    body: JSON.stringify({}),
  });
};
