import { User } from "./User";

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string, provider?: string) => Promise<void>;
  loadUser: () => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string, theme?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearToken: () => Promise<void>;
  token: string | null;
  user: User | null;
  authProvider: string;
  isLoading: boolean;
}