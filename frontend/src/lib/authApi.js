import { request } from "./api";

export async function signup({ email, password, name }) {
  const payload = await request("POST", "/api/auth/signup", {
    body: { email, password, name },
  });
  return payload?.data || null;
}

export async function login({ email, password }) {
  const payload = await request("POST", "/api/auth/login", {
    body: { email, password },
  });
  return payload?.data || null;
}

export async function me() {
  const payload = await request("GET", "/api/auth/me", { auth: true });
  return payload?.data || null;
}

export async function getMatches(userId) {
  const payload = await request("GET", `/api/user/${userId}/matches`, { auth: true });
  return payload?.data || null;
}

export async function markMatchesSeen(userId) {
  const payload = await request("PATCH", `/api/user/${userId}/matches/seen`, { auth: true });
  return payload?.data || null;
}
