import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext.jsx";
import {
  ANIMAL_PROFILES,
  assignAnimal,
  getAnimalLabel,
  getAnimalPluralLabel,
} from "../utils/animalArchetypes.js";
import { getFellowAnimalProfiles } from "../utils/fellowAnimalProfiles.js";

export default function FellowAnimalProfiles() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const currentAnimal = useMemo(() => {
    const candidate = profile.animalArchetype || assignAnimal(profile);
    return ANIMAL_PROFILES[candidate] ? candidate : "panda";
  }, [profile]);

  const profiles = useMemo(() => getFellowAnimalProfiles(currentAnimal), [currentAnimal]);
  const animalInfo = ANIMAL_PROFILES[currentAnimal] || ANIMAL_PROFILES.panda;
  const animalLabel = getAnimalLabel(currentAnimal);
  const pluralLabel = getAnimalPluralLabel(currentAnimal);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_220px] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Student Homes</p>
            <h1 className="text-3xl font-bold text-slate-900">Other {pluralLabel}</h1>
            <p className="mt-1 text-slate-600">
              Scroll this page to browse fellow {animalLabel.toLowerCase()} profiles only.
            </p>
            <button
              type="button"
              onClick={() => navigate("/landing")}
              className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back To Student Homes
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
            <img src={animalInfo.image} alt={`Your animal: ${animalLabel}`} className="h-40 w-full object-cover" />
            <div className="p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your Animal</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {animalInfo.emoji} {animalLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 pb-8 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((fellow) => (
            <article
              key={fellow.id}
              onClick={() =>
                navigate(`/landing/others/${fellow.id}`, { state: { profile: fellow, animal: currentAnimal } })
              }
              className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={fellow.photoUrl}
                alt={`${animalLabel} profile`}
                className="h-44 w-full object-cover"
                loading="lazy"
              />

              <div className="space-y-2 p-4">
                <h2 className="text-lg font-semibold text-slate-900">{fellow.displayName}</h2>
                <p className="text-sm text-slate-600">{fellow.course}</p>
                <p
                  className="text-sm text-slate-700"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {fellow.bio}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {fellow.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
