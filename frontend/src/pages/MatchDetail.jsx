// frontend/src/pages/MatchDetail.jsx
import { useLocation, useNavigate, useParams } from "react-router-dom";

const ANIMAL_EMOJI = {
  owl: "🦉", dog: "🐶", cat: "🐱", panda: "🐼",
  wolf: "🐺", turtle: "🐢", fox: "🦊", rabbit: "🐰",
};

function scoreColour(score) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

export default function MatchDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { interestId } = useParams();
  const match = state?.match;

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Match details not found.</p>
          <button
            onClick={() => navigate("/matches")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            ← Back to matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        <button
          onClick={() => navigate("/matches")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to matches
        </button>

        {/* Match header card */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                Matched ✓
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
                {match.propertyTitle}
              </h1>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>Matched on</div>
              <div className="font-medium text-slate-600">
                {new Date(match.matchedAt).toLocaleDateString("en-IE")}
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-sm mb-1">📍 {match.propertyAddress}</p>
          <p className="text-slate-500 text-sm mb-6">💶 €{match.rentPerMonth} / month</p>

          {/* 3 action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/house1/details", {
                state: { house: { propertyId: match.propertyId, title: match.propertyTitle } }
              })}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <span className="text-2xl">🏠</span>
              View property
            </button>

            <button
              onClick={() => navigate(`/matches/${match.interestId || interestId}/chat`, {
                state: { match }
              })}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <span className="text-2xl">💬</span>
              Chat
            </button>

            <button
              onClick={() => navigate(`/matches/${match.interestId}/profiles`, {
                state: { flatmates: match.matchedFlatmates, match }
              })}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <span className="text-2xl">👥</span>
              See profiles
            </button>
          </div>
        </div>

        {/* Flatmates list */}
        <div id="profiles-section" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Your flatmates</h2>

          <div className="space-y-4">
            {(match.matchedFlatmates || []).map((flatmate, idx) => {
              const emoji = ANIMAL_EMOJI[flatmate.animalArchetype?.toLowerCase()] || "🐾";
              const colours = [
                "from-emerald-400 to-teal-500",
                "from-violet-400 to-purple-500",
                "from-amber-400 to-orange-500",
                "from-sky-400 to-blue-500",
              ];
              const gradient = colours[idx % colours.length];

              return (
                <div
                  key={flatmate.userId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold shrink-0`}>
                      {(flatmate.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{flatmate.name}</div>
                      <div className="text-sm text-slate-500">
                        {emoji} {flatmate.animalArchetype}
                        {flatmate.course ? ` · ${flatmate.course}` : ""}
                        {flatmate.year ? ` · Year ${flatmate.year}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${scoreColour(flatmate.compatibilityScore)}`}>
                      {flatmate.compatibilityScore}%
                    </span>
                    <button
                      onClick={() => navigate(`/profile/${flatmate.userId}`, {
                        state: { flatmate }  // pass data so detail page doesn't need to fetch
                      })}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
