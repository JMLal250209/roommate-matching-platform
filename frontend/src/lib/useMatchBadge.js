import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getMatches } from "./authApi";

export function useMatchBadge() {
  const { user, loading } = useAuth();
  const [unseenCount, setUnseenCount] = useState(0);

  const userId = user?.userId || user?.id || user?.sub || null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getMatches(userId);
      if (data) setUnseenCount(data.unseenCount ?? 0);
    } catch {
      // non-critical — badge just won't update
    }
  }, [userId]);

  useEffect(() => {
    if (loading || !userId) return;
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [loading, userId, refresh]);

  return { unseenCount, refresh };
}