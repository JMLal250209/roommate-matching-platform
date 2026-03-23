// frontend/src/Matches.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getMatches, markMatchesSeen } from "./lib/authApi";
import { getUserPropertyInterests } from "./lib/propertiesApi";

const ANIMAL_EMOJI = {
  owl: "🦉",
  dog: "🐶",
  cat: "🐱",
  panda: "🐼",
  wolf: "🐺",
  turtle: "🐢",
  fox: "🦊",
  rabbit: "🐰",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IE");
}

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [pendingCompatible, setPendingCompatible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.userId) return;

    async function load() {
      try {
        const [confirmedData, interests] = await Promise.all([
          getMatches(user.userId),
          getUserPropertyInterests(user.userId),
        ]);

        setConfirmedMatches(confirmedData?.matches || []);

        const compatiblePending = (interests || [])
          .filter((interest) => interest?.status !== "matched" && Number(interest?.compatibleMatches) > 0)
          .sort((a, b) => Number(b.compatibleMatches || 0) - Number(a.compatibleMatches || 0));

        setPendingCompatible(compatiblePending);

        try {
          await markMatchesSeen(user.userId);
        } catch {
          // Badge marking is best-effort and should not block the matches view.
        }
      } catch (err) {
        setError(err?.message || "Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.userId]);

  const hasAnyEntries = useMemo(
    () => confirmedMatches.length > 0 || pendingCompatible.length > 0,
    [confirmedMatches.length, pendingCompatible.length]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading your matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-rose-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500 mb-1">SHRMP</p>
            <h1 className="text-3xl font-extrabold text-slate-900">Your Matches</h1>
          </div>
          <Link
            to="/landing"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to listings
          </Link>
        </div>

        {!hasAnyEntries ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No matches yet</h2>
            <p className="text-slate-500 mb-6">
              Register interest in properties to get matched with flatmates.
            </p>
            <Link
              to="/landing"
              className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Browse houses
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {confirmedMatches.length > 0 ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed Matches
                </h2>
                <div className="space-y-4">
                  {confirmedMatches.map((match) => (
                    <button
                      key={match.interestId}
                      onClick={() => navigate(`/matches/${match.interestId}`, { state: { match } })}
                      className="w-full text-left rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-lg font-bold text-slate-900 truncate">{match.propertyTitle}</h2>
                            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                              Matched ✓
                            </span>
                          </div>

                          <p className="text-sm text-slate-500 truncate mb-3">
                            📍 {match.propertyAddress} · €{match.rentPerMonth}/month
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 mr-1">Flatmates:</span>
                            {(match.matchedFlatmates || []).slice(0, 4).map((flatmate) => {
                              const emoji = ANIMAL_EMOJI[flatmate.animalArchetype?.toLowerCase()] || "🐾";
                              return (
                                <span
                                  key={flatmate.userId}
                                  title={`${flatmate.name} · ${flatmate.compatibilityScore}%`}
                                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                >
                                  {emoji} {(flatmate.name || "User").split(" ")[0]}
                                </span>
                              );
                            })}
                            {(match.matchedFlatmates || []).length > 4 ? (
                              <span className="text-xs text-slate-400">
                                +{match.matchedFlatmates.length - 4} more
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="ml-6 text-right shrink-0">
                          <div className="text-xs text-slate-400 mb-1">{formatDate(match.matchedAt)}</div>
                          <span className="text-slate-300 text-lg">›</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {pendingCompatible.length > 0 ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Compatible Pending Matches
                </h2>
                <div className="space-y-4">
                  {pendingCompatible.map((interest) => (
                    <button
                      key={interest.interestId}
                      onClick={() =>
                        navigate(`/matches/${interest.interestId}/chat`, {
                          state: {
                            match: {
                              interestId: interest.interestId,
                              propertyId: interest.propertyId,
                              propertyTitle: interest.propertyTitle,
                              propertyAddress: interest.propertyAddress,
                              rentPerMonth: interest.rentPerMonth,
                              pending: true,
                              matchedFlatmates: (interest.topMatches || []).map((candidate) => ({
                                userId: candidate.userId,
                                name: candidate.name,
                                animalArchetype: candidate.animal_archetype,
                                compatibilityScore: candidate.compatibility_score,
                              })),
                            },
                          },
                        })
                      }
                      className="w-full text-left rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center gap-3">
                            <h3 className="truncate text-lg font-bold text-slate-900">{interest.propertyTitle}</h3>
                            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          </div>

                          <p className="mb-2 truncate text-sm text-slate-500">
                            📍 {interest.propertyAddress} · €{interest.rentPerMonth}/month
                          </p>
                          <p className="mb-3 text-sm text-slate-600">
                            {interest.compatibleMatches} compatible student
                            {Number(interest.compatibleMatches) === 1 ? "" : "s"} found ·{" "}
                            {interest.totalInterested}/{interest.requiredRoommates} interested
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 mr-1">Top compatible:</span>
                            {(interest.topMatches || []).slice(0, 3).map((candidate) => {
                              const emoji = ANIMAL_EMOJI[candidate?.animal_archetype?.toLowerCase()] || "🐾";
                              return (
                                <span
                                  key={candidate.userId}
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                                >
                                  {emoji} {(candidate.name || "User").split(" ")[0]} · {candidate.compatibility_score}%
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="ml-6 text-right shrink-0">
                          <div className="text-xs text-slate-400 mb-1">
                            Registered {formatDate(interest.registeredAt)}
                          </div>
                          <span className="text-slate-300 text-lg">›</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
