import { request } from "./api";

export async function getChatMessages(interestId, { limit = 100 } = {}) {
  const payload = await request(
    "GET",
    `/api/chat/interest/${encodeURIComponent(interestId)}/messages?limit=${encodeURIComponent(limit)}`,
    { auth: true }
  );
  return payload?.data || null;
}

export async function sendChatMessage(interestId, message) {
  const payload = await request(
    "POST",
    `/api/chat/interest/${encodeURIComponent(interestId)}/messages`,
    {
      auth: true,
      body: { message },
    }
  );
  return payload?.data || null;
}
