/**
 * AuthContext — provides authentication state and actions
 * to all components in the app via React Context.
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  registerUser,
  logoutUser,
  getProfile,
  getToken,
  setToken,
} from "./auth-api";
import type { LoginRequest, RegisterRequest, UserProfile } from "./types";

// ===== Types =====

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

// ===== Context =====

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== Provider =====

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      // Token is invalid or expired
      logoutUser();
      setUser(null);
    }
  }, []);

  // On mount, check if we have a token and fetch the profile
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(
    async (data: LoginRequest) => {
      await loginUser(data);
      // After login, fetch the profile
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch {
        // If /users/me fails, we still have the token but no profile
        // Could happen if the endpoint is not available
        console.warn("Login succeeded but could not fetch profile");
      }
    },
    []
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const profile = await registerUser(data);
      setUser(profile);
    },
    []
  );

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===== Hook =====

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}