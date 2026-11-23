"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { configureApiAuth } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isGuest?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  login: (accessToken: string, user: AuthUser, refreshToken?: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read cached user synchronously to avoid auth flashing on client navigation
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("partywatch_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("partywatch_token") || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      tokenRef.current = localStorage.getItem("partywatch_token") || null;
    }
  }, []);

  const setAccessToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    setAccessTokenState(token);
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("partywatch_token", token);
      else localStorage.removeItem("partywatch_token");
    }
  }, []);

  const login = useCallback(
    (token: string, userData: AuthUser, refreshToken?: string) => {
      setAccessToken(token);
      setUser(userData);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("partywatch_user", JSON.stringify(userData));
          if (refreshToken) {
            localStorage.setItem("partywatch_refresh_token", refreshToken);
          }
        } catch (e) {
          console.warn("Could not cache user locally", e);
        }
      }
    },
    [setAccessToken]
  );

  const logout = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const storedRefresh = typeof window !== "undefined" ? localStorage.getItem("partywatch_refresh_token") : null;
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("partywatch_user");
          localStorage.removeItem("partywatch_token");
          localStorage.removeItem("partywatch_refresh_token");
        } catch {}
      }
    }
  }, [setAccessToken]);

  // Hook api.ts up to the in-memory token
  useEffect(() => {
    configureApiAuth(
      () => tokenRef.current,
      (newToken) => setAccessToken(newToken)
    );
  }, [setAccessToken]);

  // Restore session on mount: first check existing access token, then refresh if needed
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const existingToken = typeof window !== "undefined" ? localStorage.getItem("partywatch_token") : null;
      const storedRefresh = typeof window !== "undefined" ? localStorage.getItem("partywatch_refresh_token") : null;

      // 1. Try existing access token with /auth/me first (avoids needless refresh race conditions on page load)
      if (existingToken) {
        try {
          const userRes = await fetch(`${apiBase}/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${existingToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (userRes.ok) {
            const userData = await userRes.json();
            const profile = userData.user || userData;
            if (isMounted) {
              setAccessToken(existingToken);
              setUser(profile);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Fall through to refresh
        }
      }

      // 2. Access token missing or expired: call /auth/refresh with cookie + body fallback
      try {
        const refreshRes = await fetch(`${apiBase}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });

        if (!refreshRes.ok) {
          if (refreshRes.status === 401 && isMounted) {
            setAccessToken(null);
            setUser(null);
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("partywatch_user");
                localStorage.removeItem("partywatch_token");
                localStorage.removeItem("partywatch_refresh_token");
              } catch {}
            }
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        const data = await refreshRes.json();
        const newToken = data.accessToken;
        const newRefresh = data.refreshToken;

        if (newToken && isMounted) {
          setAccessToken(newToken);
          if (newRefresh && typeof window !== "undefined") {
            localStorage.setItem("partywatch_refresh_token", newRefresh);
          }

          // Retrieve current user profile
          const userRes = await fetch(`${apiBase}/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${newToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (userRes.ok) {
            const userData = await userRes.json();
            const profile = userData.user || userData;
            if (isMounted) {
              setUser(profile);
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("partywatch_user", JSON.stringify(profile));
                } catch {}
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to restore auth session:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [setAccessToken]);

  // Proactive background silent refresh before access token expires (runs every 10 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const storedRefresh = typeof window !== "undefined" ? localStorage.getItem("partywatch_refresh_token") : null;
      try {
        const res = await fetch(`${apiBase}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            setAccessToken(data.accessToken);
            if (data.refreshToken && typeof window !== "undefined") {
              localStorage.setItem("partywatch_refresh_token", data.refreshToken);
            }
          }
        }
      } catch (e) {
        console.warn("Background silent refresh failed, will retry on next request", e);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessToken, setAccessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
