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
