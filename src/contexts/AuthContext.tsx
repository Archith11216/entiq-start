import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { auth, tokenStore, ApiError } from "../lib/api";
import type { UserProfile } from "../types/api";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootedRef = useRef(false);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => { /* best-effort */ });
    setUser(null);
  }, []);

  // On mount: if we have a stored token, rehydrate the user profile
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const token = tokenStore.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }

    auth
      .me()
      .then(setUser)
      .catch(() => {
        // Token invalid or expired beyond refresh — clear and show login
        tokenStore.clear();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for token expiry signals from the API layer
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener("entiq:auth:expired", handler);
    return () => window.removeEventListener("entiq:auth:expired", handler);
  }, []);

  const DEV_USER: UserProfile = {
    id: "dev-001",
    email: "j.okafor@growadvisory.com.au",
    firstName: "James",
    lastName: "Okafor",
    displayName: "J. Okafor",
    initials: "JO",
    role: "Partner",
    firmName: "Grow Advisory Group",
  };

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Dev bypass: skip real API call when no credentials are provided
      if (!email && !password) {
        await new Promise((r) => setTimeout(r, 400));
        setUser(DEV_USER);
        return;
      }
      await auth.login(email, password);
      const profile = await auth.me();
      setUser(profile);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign in failed. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
