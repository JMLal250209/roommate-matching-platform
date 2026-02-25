import { request } from "./api";

export async function getUser(userId) {
  const payload = await request("GET", `/api/users/${encodeURIComponent(userId)}`, {
    auth: true,
  });
  return payload?.data || null;
}

export async function updateUser(userId, body) {
  const payload = await request("PUT", `/api/users/${encodeURIComponent(userId)}`, {
    auth: true,
    body,
  });
  return payload?.data || null;
}

export async function getUserAnimal(userId) {
  const payload = await request(
    "GET",
    `/api/users/${encodeURIComponent(userId)}/animal`,
    { auth: true }
  );
  return payload?.data || null;
}
