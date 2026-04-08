const API_URL = 'http://192.168.10.85:3000/api';

export type UserRole = 'ROLE_A' | 'ROLE_B';
type RoleLike = UserRole | string;
type AuthorityLike = string | { authority?: string; role?: string };

interface RoleContainer {
  role?: RoleLike;
  userRole?: RoleLike;
  roles?: RoleLike[];
  authorities?: AuthorityLike[];
}

interface LoginUser extends RoleContainer {
  [key: string]: unknown;
}

interface LoginData extends RoleContainer {
  token?: string;
  user?: LoginUser | null;
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  role?: RoleLike;
  userRole?: RoleLike;
  user?: LoginUser | null;
  data?: LoginData | null;
  roles?: RoleLike[];
  authorities?: AuthorityLike[];
  message?: string;
  [key: string]: unknown;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} - ${body}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  } catch (error) {
    console.error(`API error for ${path}:`, error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    return await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('login failed:', error);
    throw error;
  }
};

const normalizeRole = (value: unknown): UserRole | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const role = value.trim().toUpperCase();

  if (role === 'ROLE_A' || role === 'A') return 'ROLE_A';
  if (role === 'ROLE_B' || role === 'B') return 'ROLE_B';

  return null;
};

const extractRoleFromAuthorities = (authorities: AuthorityLike[] | undefined): UserRole | null => {
  if (!authorities?.length) return null;

  for (const entry of authorities) {
    const value =
      typeof entry === 'string' ? entry : typeof entry?.authority === 'string' ? entry.authority : entry?.role;
    const role = normalizeRole(value);
    if (role) return role;
  }

  return null;
};

export const getUserRole = (response: LoginResponse): UserRole | null => {
  const candidates: unknown[] = [
    response.role,
    response.userRole,
    response.user?.role,
    response.user?.userRole,
    response.data?.role,
    response.data?.userRole,
    response.data?.user?.role,
    response.data?.user?.userRole,
    response.roles?.[0],
    response.user?.roles?.[0],
    response.data?.roles?.[0],
    response.data?.user?.roles?.[0],
  ];

  for (const candidate of candidates) {
    const role = normalizeRole(candidate);
    if (role) return role;
  }

  const fromAuthorities =
    extractRoleFromAuthorities(response.authorities) ??
    extractRoleFromAuthorities(response.user?.authorities) ??
    extractRoleFromAuthorities(response.data?.authorities) ??
    extractRoleFromAuthorities(response.data?.user?.authorities);
  if (fromAuthorities) return fromAuthorities;

  return null;
};
