import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { auth, tokenStore, ApiError } from "../lib/api";
import type { UserProfile } from "../types/api";

export const FIRM_USERS: UserProfile[] = [
  {
    id: "usr-001",
    email: "j.okafor@growadvisory.com.au",
    firstName: "James",
    lastName: "Okafor",
    displayName: "J. Okafor",
    initials: "JO",
    role: "Partner",
    firmName: "Grow Advisory Group",
  },
  {
    id: "usr-002",
    email: "a.brennan@growadvisory.com.au",
    firstName: "Amelia",
    lastName: "Brennan",
    displayName: "A. Brennan",
    initials: "AB",
    role: "Senior Manager",
    firmName: "Grow Advisory Group",
  },
  {
    id: "usr-003",
    email: "s.patel@growadvisory.com.au",
    firstName: "Sanjay",
    lastName: "Patel",
    displayName: "S. Patel",
    initials: "SP",
    role: "Senior Accountant",
    firmName: "Grow Advisory Group",
  },
  {
    id: "usr-004",
    email: "c.richardson@growadvisory.com.au",
    firstName: "Chloe",
    lastName: "Richardson",
    displayName: "C. Richardson",
    initials: "CR",
    role: "Accountant",
    firmName: "Grow Advisory Group",
  },
  {
    id: "usr-005",
    email: "m.webb@growadvisory.com.au",
    firstName: "Marcus",
    lastName: "Webb",
    displayName: "M. Webb",
    initials: "MW",
    role: "Graduate Accountant",
    firmName: "Grow Advisory Group",
  },
  {
    id: "usr-006",
    email: "l.tran@growadvisory.com.au",
    firstName: "Linda",
    lastName: "Tran",
    displayName: "L. Tran",
    initials: "LT",
    role: "Practice Manager",
    firmName: "Grow Advisory Group",
  },
];

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (target: UserProfile) => void;
  availableUsers: UserProfile[];
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("entiq:active_user");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return FIRM_USERS[0];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootedRef = useRef(false);

  const switchUser = useCallback((target: UserProfile) => {
    setUser(target);
    try {
      localStorage.setItem("entiq:active_user", JSON.stringify(target));
      window.dispatchEvent(new CustomEvent("entiq:user:switched", { detail: target }));
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => { /* best-effort */ });
    try {
      localStorage.removeItem("entiq:active_user");
      tokenStore.clear();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  // On mount: if we have a stored token, rehydrate the user profile
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const savedUser = localStorage.getItem("entiq:active_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
        return;
      } catch {
        // ignore
      }
    }

    const token = tokenStore.getAccess();
    if (!token) {
      // In dev environment, auto-login with default partner user
      setUser(FIRM_USERS[0]);
      setIsLoading(false);
      return;
    }

    auth
      .me()
      .then(setUser)
      .catch(() => {
        // Token invalid or expired beyond refresh — fallback to dev default
        setUser(FIRM_USERS[0]);
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

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Match against known firm users
      const matchedUser = FIRM_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        await new Promise((r) => setTimeout(r, 200));
        switchUser(matchedUser);
        return;
      }

      // Dev bypass: skip real API call when no credentials are provided
      if (!email && !password) {
        await new Promise((r) => setTimeout(r, 300));
        switchUser(FIRM_USERS[0]);
        return;
      }

      await auth.login(email, password);
      const profile = await auth.me();
      switchUser(profile);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign in failed. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [switchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        switchUser,
        availableUsers: FIRM_USERS,
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
