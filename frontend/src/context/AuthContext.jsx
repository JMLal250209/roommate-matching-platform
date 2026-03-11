/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { login, me } from "../lib/authApi";
import {
  clearSession,
  getStoredUser,
  getTokens,
  setAuthMessage,
  setStoredUser,
  setTokens,
} from "../lib/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    setStoredUser(nextUser || null);
  }, []);

  const signOut = useCallback(
    (reason) => {
      clearSession();
      applyUser(null);

      if (reason) {
        setAuthMessage(reason);
      }

      if (location.pathname !== "/signin") {
        navigate("/signin", { replace: true });
      }
    },
    [applyUser, location.pathname, navigate]
  );

  const bootstrapSession = useCallback(async () => {
    const { idToken } = getTokens();
    if (!idToken) {
      applyUser(null);
      setLoading(false);
      return null;
    }

    try {
      const currentUser = await me();
      applyUser(currentUser);
      setLoading(false);
      return currentUser;
    } catch (err) {
      applyUser(null);
      clearSession();
      setLoading(false);

      if (err instanceof ApiError && err.code === "SESSION_EXPIRED") {
        setAuthMessage("Session expired. Please sign in again.");
      }

      return null;
    }
  }, [applyUser]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const tokens = await login({ email, password });
      setTokens(tokens);

      const currentUser = await me();
      applyUser(currentUser);
      return currentUser;
    },
    [applyUser]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      bootstrapSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [bootstrapSession]);

  useEffect(() => {
    function onSessionExpired() {
      applyUser(null);
      clearSession();
      if (location.pathname !== "/signin") {
        navigate("/signin", { replace: true });
      }
    }

    window.addEventListener("shrmp:session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("shrmp:session-expired", onSessionExpired);
    };
  }, [applyUser, location.pathname, navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
      setUser: applyUser,
      bootstrapSession,
    }),
    [applyUser, bootstrapSession, loading, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
