// frontend/src/Matches.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getMatches, markMatchesSeen } from "./lib/authApi";

const ANIMAL_EMOJI = {
  owl: "🦉", dog: "🐶", cat: "🐱", panda: "🐼",
  wolf: "🐺", turtle: "🐢", fox: "🦊", rabbit: "🐰",
};

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.userId) return;

    async function load() {
      try {
        const data = await getMatches(user.userId);
        setMatches(data?.matches || []);
        await markMatchesSeen(user.userId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.userId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Loading your matches...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-rose-500">Error: {error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="w-full max-w-3xl mx-auto">

        {/* Header */}
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

        {matches.length === 0 ? (
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
          <div className="space-y-4">
            {matches.map((match) => (
              <button
                key={match.interestId}
                onClick={() => navigate(`/matches/${match.interestId}`, { state: { match } })}
                className="w-full text-left rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold text-slate-900 truncate">
                        {match.propertyTitle}
                      </h2>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                        Matched ✓
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 truncate mb-3">
                      📍 {match.propertyAddress} · €{match.rentPerMonth}/month
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 mr-1">Flatmates:</span>
                      {(match.matchedFlatmates || []).slice(0, 4).map((f) => {
                        const emoji = ANIMAL_EMOJI[f.animalArchetype?.toLowerCase()] || "🐾";
                        return (
                          <span
                            key={f.userId}
                            title={`${f.name} · ${f.compatibilityScore}%`}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {emoji} {(f.name || f.firstName || "User").split(" ")[0]}
                          </span>
                        );
                      })}
                      {(match.matchedFlatmates || []).length > 4 && (
                        <span className="text-xs text-slate-400">
                          +{match.matchedFlatmates.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 text-right shrink-0">
                    <div className="text-xs text-slate-400 mb-1">
                      {new Date(match.matchedAt).toLocaleDateString("en-IE")}
                    </div>
                    <span className="text-slate-300 text-lg">›</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}