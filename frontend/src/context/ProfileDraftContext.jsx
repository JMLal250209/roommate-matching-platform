/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createDefaultProfileDraft,
  mapBackendProfileToDraft,
} from "../lib/profileMapping";
import {
  clearProfileDraft,
  getProfileDraftRaw,
  setProfileDraftRaw,
} from "../lib/session";

const ProfileDraftContext = createContext(null);

function readInitialDraft() {
  const raw = getProfileDraftRaw();
  if (!raw) return createDefaultProfileDraft();

  try {
    const parsed = JSON.parse(raw);
    return {
      housing: {
        ...createDefaultProfileDraft().housing,
        ...(parsed?.housing || {}),
      },
      about: {
        ...createDefaultProfileDraft().about,
        ...(parsed?.about || {}),
      },
    };
  } catch {
    return createDefaultProfileDraft();
  }
}

function persistDraft(draft) {
  setProfileDraftRaw(JSON.stringify(draft));
}

export function ProfileDraftProvider({ children }) {
  const [draft, setDraft] = useState(readInitialDraft);

  const setHousing = useCallback((partial) => {
    setDraft((current) => {
      const next = {
        ...current,
        housing: {
          ...current.housing,
          ...partial,
        },
      };
      persistDraft(next);
      return next;
    });
  }, []);

  const setAbout = useCallback((partial) => {
    setDraft((current) => {
      const next = {
        ...current,
        about: {
          ...current.about,
          ...partial,
        },
      };
      persistDraft(next);
      return next;
    });
  }, []);

  const overwriteDraft = useCallback((nextDraft) => {
    const normalized = {
      housing: {
        ...createDefaultProfileDraft().housing,
        ...(nextDraft?.housing || {}),
      },
      about: {
        ...createDefaultProfileDraft().about,
        ...(nextDraft?.about || {}),
      },
    };

    setDraft(normalized);
    persistDraft(normalized);
  }, []);

  const hydrateFromBackend = useCallback((profile, userName) => {
    const mapped = mapBackendProfileToDraft(profile, userName);
    overwriteDraft(mapped);
  }, [overwriteDraft]);

  const resetDraft = useCallback(() => {
    const clean = createDefaultProfileDraft();
    setDraft(clean);
    clearProfileDraft();
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setHousing,
      setAbout,
      overwriteDraft,
      hydrateFromBackend,
      resetDraft,
    }),
    [draft, hydrateFromBackend, overwriteDraft, resetDraft, setAbout, setHousing]
  );

  return (
    <ProfileDraftContext.Provider value={value}>
      {children}
    </ProfileDraftContext.Provider>
  );
}

export function useProfileDraft() {
  const value = useContext(ProfileDraftContext);
  if (!value) {
    throw new Error("useProfileDraft must be used within ProfileDraftProvider");
  }
  return value;
}
