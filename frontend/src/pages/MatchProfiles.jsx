// frontend/src/pages/MatchProfiles.jsx
import { useLocation, useNavigate, useParams } from "react-router-dom";

const ANIMAL_EMOJI = {
  owl: "🦉", dog: "🐶", cat: "🐱", panda: "🐼",
  wolf: "🐺", turtle: "🐢", fox: "🦊", rabbit: "🐰",
};

function scoreColour(score) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function MatchProfiles() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { interestId } = useParams();
  const flatmates = state?.flatmates || [];
  const match = state?.match;

  if (flatmates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No profiles found.</p>
          <button onClick={() => navigate(-1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const colours = [
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-sky-400 to-blue-500",
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-5">

        <button
          onClick={() => navigate(`/matches/${interestId}`, { state: { match } })}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to match
        </button>

        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500 mb-1">Your matched flatmates</p>
          <h1 className="text-2xl font-extrabold text-slate-900">{match?.propertyTitle}</h1>
        </div>

        <div className="space-y-4">
          {flatmates.map((flatmate, idx) => {
            const emoji = ANIMAL_EMOJI[flatmate.animalArchetype?.toLowerCase()] || "🐾";
            const gradient = colours[idx % colours.length];
            const score = flatmate.compatibilityScore;

            return (
              <button
                key={flatmate.userId}
                onClick={() => navigate(`/profile/${flatmate.userId}`, { state: { flatmate } })}
                className="w-full text-left rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                    {(flatmate.name || "?").charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{flatmate.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {emoji} {flatmate.animalArchetype}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {flatmate.course ? flatmate.course : "Course not set"}
                      {flatmate.year ? ` · Year ${flatmate.year}` : ""}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold" style={{ color: scoreColour(score) }}>
                      {score}%
                    </div>
                    <div className="text-xs text-slate-400">match</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}