export type AppUserRole = 'ROLE_A' | 'ROLE_B';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  createdAt: string;
};

export type RootStackParamList = {
  Login: undefined;
  Home: { user?: AppUser } | undefined;
  Products: undefined;
  Settings: undefined;
};
