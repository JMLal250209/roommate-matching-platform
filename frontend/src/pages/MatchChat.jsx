import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMatches } from "../lib/authApi";
import { getChatMessages, sendChatMessage } from "../lib/chatApi";
import { getUserPropertyInterests } from "../lib/propertiesApi";

const POLL_INTERVAL_MS = 5000;

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

export default function MatchChat() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { interestId } = useParams();
  const { user } = useAuth();

  const [match, setMatch] = useState(state?.match || null);
  const [resolvingMatch, setResolvingMatch] = useState(!state?.match);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (state?.match) {
      setResolvingMatch(false);
      return;
    }

    if (!user?.userId || !interestId) return;

    let mounted = true;
    setResolvingMatch(true);

    Promise.all([getMatches(user.userId), getUserPropertyInterests(user.userId)])
      .then(([confirmedData, interests]) => {
        if (!mounted) return;

        const confirmedMatch =
          (confirmedData?.matches || []).find((item) => item.interestId === interestId) || null;
        if (confirmedMatch) {
          setMatch(confirmedMatch);
          return;
        }

        const pendingInterest =
          (interests || []).find((item) => item.interestId === interestId && item.status !== "matched") || null;

        if (!pendingInterest) {
          setMatch(null);
          return;
        }

        setMatch({
          interestId: pendingInterest.interestId,
          propertyId: pendingInterest.propertyId,
          propertyTitle: pendingInterest.propertyTitle,
          propertyAddress: pendingInterest.propertyAddress,
          rentPerMonth: pendingInterest.rentPerMonth,
          pending: true,
          matchedFlatmates: (pendingInterest.topMatches || []).map((candidate) => ({
            userId: candidate.userId,
            name: candidate.name,
            animalArchetype: candidate.animal_archetype,
            compatibilityScore: candidate.compatibility_score,
          })),
        });
      })
      .catch(() => {
        if (!mounted) return;
        setMatch(null);
      })
      .finally(() => {
        if (mounted) setResolvingMatch(false);
      });

    return () => {
      mounted = false;
    };
  }, [interestId, state?.match, user?.userId]);

  useEffect(() => {
    if (!user?.userId || !interestId) return;

    let mounted = true;

    async function loadMessages({ showLoading = false } = {}) {
      if (showLoading) setLoadingMessages(true);

      try {
        const data = await getChatMessages(interestId, { limit: 200 });
        if (!mounted) return;
        setMessages(data?.messages || []);
        setLoadError("");
      } catch (err) {
        if (!mounted) return;
        setLoadError(err?.message || "Unable to load chat messages.");
      } finally {
        if (mounted && showLoading) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages({ showLoading: true });
    const timer = window.setInterval(() => {
      loadMessages({ showLoading: false });
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [interestId, user?.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const title = match?.propertyTitle || "Match Chat";
  const flatmateNames = useMemo(
    () => (match?.matchedFlatmates || []).map((flatmate) => flatmate.name).filter(Boolean),
    [match?.matchedFlatmates]
  );
  const isPendingChat = Boolean(match?.pending);

  async function handleSend(event) {
    event.preventDefault();
    const messageText = input.trim();
    if (!messageText || sending) return;

    setSending(true);
    setSendError("");

    try {
      const created = await sendChatMessage(interestId, messageText);
      if (created) {
        setMessages((prev) => [...prev, created]);
      }
      setInput("");
    } catch (err) {
      setSendError(err?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <button
            onClick={() => navigate(`/matches/${interestId}`, match ? { state: { match } } : undefined)}
            className="mb-4 text-sm text-slate-500 hover:text-slate-800"
          >
            Back to match
          </button>

          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {flatmateNames.length > 0
              ? `Group: ${flatmateNames.join(", ")}`
              : isPendingChat
                ? "Pending compatibility chat for this property."
                : "Matched group chat."}
          </p>
        </div>

        <div className="h-[58vh] overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {resolvingMatch || loadingMessages ? (
            <p className="text-sm text-slate-500">Loading chat...</p>
          ) : loadError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              {isPendingChat
                ? "No messages yet. Start the conversation with your pending compatible matches."
                : "No messages yet. Start the conversation with your matched flatmates."}
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwn = message.senderId === user?.userId;

                return (
                  <div
                    key={message.messageId || message.sentAt || `${message.createdAt || "m"}-${index}`}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[72%] ${
                        isOwn
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <div className={`mb-1 text-xs ${isOwn ? "text-emerald-100" : "text-slate-400"}`}>
                        {message.senderName || "Unknown user"}{formatTime(message.createdAt) ? ` · ${formatTime(message.createdAt)}` : ""}
                      </div>
                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-200 p-4 sm:p-5">
          {sendError ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {sendError}
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write a message..."
              rows={2}
              maxLength={2000}
              className="min-h-[52px] flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
