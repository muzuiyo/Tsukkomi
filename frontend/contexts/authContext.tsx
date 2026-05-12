"use client";

import { authLogout, authMe } from "@/lib/api/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User } from "@/interfaces/user";

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await authLogout();
      setUser(null);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log("注销失败: " + err.message);
      }
      else {
        console.log("注销失败")
      }
    }
    return false;
  }, []);

  const value = useMemo(() => ({ currentUser: user, authLoading, logout, refreshUser: fetchUser }), [user, authLoading, logout, fetchUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
