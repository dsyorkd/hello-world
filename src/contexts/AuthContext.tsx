import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  retirement_age?: number;
  risk_tolerance?: string;
  employment_status?: string;
  disclaimer_acknowledged_at?: string | null;
  has_financial_profile?: boolean;
  onboarding_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => Promise<{ is_new_user: boolean; disclaimer_required: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await api.getSession();
      setUser(userData);
    } catch {
      // Session invalid
      localStorage.removeItem("session_token");
      setUser(null);
    }
  }, []);

  // Validate existing session on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = useCallback(async (email: string, name?: string) => {
    const result = await api.login(email, name);
    localStorage.setItem("session_token", result.session_token);
    setUser(result.user);
    return {
      is_new_user: result.is_new_user,
      disclaimer_required: result.disclaimer_required,
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("session_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
