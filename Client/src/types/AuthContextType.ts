export interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string,provider?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}