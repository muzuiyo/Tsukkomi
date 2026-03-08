"use client";

import { authLogout, authMe } from "@/lib/api/auth";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/interfaces/user";

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  logout: () => void;
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
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const fetchUser = async () => {
      try {
        const data = await authMe();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [pathname]);

  const logout = async () => {
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
  };

  return (
    <AuthContext.Provider value={{ currentUser: user, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
