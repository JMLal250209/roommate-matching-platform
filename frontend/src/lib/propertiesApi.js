import { request } from "./api";

export async function listProperties() {
  const payload = await request("GET", "/api/properties", { auth: true });
  return payload?.data || [];
}

export async function registerPropertyInterest(propertyId, budget) {
  const payload = await request(
    "POST",
    `/api/properties/${encodeURIComponent(propertyId)}/register-interest`,
    {
      auth: true,
      body: budget ? { budget } : {},
    }
  );

  return payload?.data || null;
}

export async function getUserPropertyInterests(userId) {
  const payload = await request(
    "GET",
    `/api/user/${encodeURIComponent(userId)}/interests`,
    { auth: true }
  );
  return payload?.data?.interests || [];
}

export async function getUserMatchForProperty(userId, propertyId) {
  const payload = await request(
    "GET",
    `/api/match/user/${encodeURIComponent(userId)}/property/${encodeURIComponent(propertyId)}`,
    { auth: true }
  );
  return payload?.data || null;
}
