const KEYS = {
  idToken: "shrmp.idToken",
  accessToken: "shrmp.accessToken",
  refreshToken: "shrmp.refreshToken",
  user: "shrmp.user",
  profileDraft: "shrmp.profileDraft",
  authMessage: "shrmp.authMessage",
};

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export function getTokens() {
  return {
    idToken: safeGet(KEYS.idToken),
    accessToken: safeGet(KEYS.accessToken),
    refreshToken: safeGet(KEYS.refreshToken),
  };
}

export function setTokens(tokens) {
  if (!tokens) return;
  if (tokens.idToken) safeSet(KEYS.idToken, tokens.idToken);
  if (tokens.accessToken) safeSet(KEYS.accessToken, tokens.accessToken);
  if (tokens.refreshToken) safeSet(KEYS.refreshToken, tokens.refreshToken);
}

export function clearTokens() {
  safeRemove(KEYS.idToken);
  safeRemove(KEYS.accessToken);
  safeRemove(KEYS.refreshToken);
}

export function getStoredUser() {
  const raw = safeGet(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    safeRemove(KEYS.user);
    return;
  }
  safeSet(KEYS.user, JSON.stringify(user));
}

export function clearStoredUser() {
  safeRemove(KEYS.user);
}

export function clearSession() {
  clearTokens();
  clearStoredUser();
}

export function getProfileDraftRaw() {
  return safeGet(KEYS.profileDraft);
}

export function setProfileDraftRaw(value) {
  if (typeof value !== "string") return;
  safeSet(KEYS.profileDraft, value);
}

export function clearProfileDraft() {
  safeRemove(KEYS.profileDraft);
}

export function setAuthMessage(message) {
  try {
    window.sessionStorage.setItem(KEYS.authMessage, message);
  } catch {
    // ignore storage failures
  }
}

export function consumeAuthMessage() {
  try {
    const value = window.sessionStorage.getItem(KEYS.authMessage);
    if (value) {
      window.sessionStorage.removeItem(KEYS.authMessage);
    }
    return value;
  } catch {
    return null;
  }
}

export { KEYS };
