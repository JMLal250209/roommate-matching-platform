// frontend/src/pages/MatchedProfileView.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { request } from "../lib/api";

const ANIMAL_EMOJI = {
  owl: "🦉", dog: "🐶", cat: "🐱", panda: "🐼",
  wolf: "🐺", turtle: "🐢", fox: "🦊", rabbit: "🐰",
};

const STEP_TITLES = ["About them", "Housing", "Lifestyle"];

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{String(value)}</p>
    </div>
  );
}

function TagRow({ label, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AboutTab({ p, name, animal }) {
  const emoji = ANIMAL_EMOJI[animal?.toLowerCase()] || "🐾";
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">About {name}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Animal archetype" value={`${emoji} ${animal}`} />
        <InfoRow label="Course" value={p.course} />
        <InfoRow label="Year" value={p.year ? `Year ${p.year}` : null} />
        <InfoRow label="Age" value={p.age} />
        <InfoRow label="Wake time" value={p.wakeTime} />
        <InfoRow label="Bedtime" value={p.bedtime} />
      </div>
      {p.bio && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Bio</p>
          <p className="text-sm text-slate-700">{p.bio}</p>
        </div>
      )}
      <TagRow label="Interests" items={p.interests} />
      <TagRow label="Traits" items={p.traits} />
    </div>
  );
}

function HousingTab({ p }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Housing preferences</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Budget" value={p.budgetMin && p.budgetMax ? `€${p.budgetMin} – €${p.budgetMax}` : null} />
        <InfoRow label="Area" value={p.area} />
        <InfoRow label="Move in" value={p.moveIn} />
        <InfoRow label="Room type" value={p.roomType} />
        <InfoRow label="Lease" value={p.leaseMonths ? `${p.leaseMonths} months` : null} />
      </div>
      <TagRow label="Wanted amenities" items={p.amenities} />
      {p.housingNotes && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Notes</p>
          <p className="text-sm text-slate-700">{p.housingNotes}</p>
        </div>
      )}
    </div>
  );
}

function LifestyleTab({ p }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Lifestyle</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Noise level" value={p.noise_level} />
        <InfoRow label="Cleanliness" value={p.cleanliness} />
        <InfoRow label="Social preference" value={p.socialPreference} />
        <InfoRow label="Cooking" value={p.cooking} />
        <InfoRow label="Routine" value={p.routine} />
        <InfoRow label="Smoker" value={p.smoker ? "Yes" : "No"} />
        <InfoRow label="OK with smokers" value={p.smokersOk ? "Yes" : "No"} />
        <InfoRow label="Has pets" value={p.hasPets ? "Yes" : "No"} />
        <InfoRow label="OK with pets" value={p.petsOk ? "Yes" : "No"} />
      </div>
    </div>
  );
}

export default function MatchedProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [step, setStep] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    request("GET", `/api/users/${userId}`, { auth: true })
      .then((payload) => setProfileData(payload?.data || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Loading profile...</p>
    </div>
  );

  if (error || !profileData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <p className="text-rose-500 mb-4">{error || "Profile not found."}</p>
        <button onClick={() => navigate(-1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          ← Go back
        </button>
      </div>
    </div>
  );

  const p = profileData.profile || {};
  const name = profileData.name || "Unknown";
  const animal = profileData.animal_archetype || "";
  const emoji = ANIMAL_EMOJI[animal?.toLowerCase()] || "🐾";
  const score = state?.flatmate?.compatibilityScore;

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-2xl space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Matched flatmate</p>
            <h1 className="text-3xl font-bold text-slate-900">{name}</h1>
            <p className="text-slate-600">{emoji} {animal}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            ← Back
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold">
              {name.charAt(0)}
            </div>
          </div>

          {score != null && (
            <div className="flex justify-center -mt-4 mb-2 relative z-10">
              <span className="rounded-full bg-emerald-600 text-white px-4 py-1 text-sm font-bold shadow">
                {score}% compatible
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {STEP_TITLES.map((title, i) => (
                <button
                  key={title}
                  onClick={() => setStep(i)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    step === i
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {i + 1}. {title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 p-5 md:p-6">
            {step === 0 && <AboutTab p={p} name={name} animal={animal} />}
            {step === 1 && <HousingTab p={p} />}
            {step === 2 && <LifestyleTab p={p} />}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {step + 1} of 3</span>
              <button
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                disabled={step === 2}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}