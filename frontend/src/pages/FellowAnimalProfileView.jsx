import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../context/ProfileContext.jsx";
import {
  ANIMAL_PROFILES,
  assignAnimal,
  getAnimalLabel,
} from "../utils/animalArchetypes.js";
import { getFellowProfileById } from "../utils/fellowAnimalProfiles.js";

const STEP_TITLES = ["Course & Bio", "Housing Requirements", "About Them"];

const ROOM_TYPE_LABELS = {
  single: "Single room",
  shared: "Shared room",
  studio: "Studio",
  any: "Any",
};

const AREA_LABELS = {
  city: "City centre",
  suburbs: "Suburbs",
  either: "Either",
};

const MOVE_IN_LABELS = {
  asap: "ASAP",
  this_month: "This month",
  next_month: "Next month",
  flexible: "Flexible",
};

const SCHEDULE_LABELS = {
  early: "Early riser",
  normal: "Normal",
  late: "Late schedule",
};

const NOISE_LABELS = {
  quiet: "Quiet",
  neutral: "Neutral",
  lively: "Lively",
};

const CLEAN_LABELS = {
  very_clean: "Very clean",
  average: "Average",
  casual: "Casual",
};

const STUDY_SOCIAL_LABELS = {
  mostly_study: "Mostly study / chill at home",
  balanced: "Balanced",
  often_out: "Often out / social",
};

const YES_NO_LABELS = {
  yes: "Yes",
  no: "No",
  sometimes: "Sometimes",
};

export default function FellowAnimalProfileView() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { profile: currentUser } = useProfile();
  const [step, setStep] = useState(0);

  const currentAnimal = useMemo(() => {
    const candidate = currentUser.animalArchetype || assignAnimal(currentUser);
    return ANIMAL_PROFILES[candidate] ? candidate : "panda";
  }, [currentUser]);

  const fellowProfile = useMemo(() => {
    if (location.state?.profile?.animal === currentAnimal) {
      return location.state.profile;
    }

    if (!params.profileId) {
      return null;
    }

    return getFellowProfileById(currentAnimal, params.profileId);
  }, [location.state, params.profileId, currentAnimal]);

  if (!fellowProfile) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900 md:px-10 md:py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Profile Not Available</h1>
          <p className="mt-2 text-slate-600">
            You can only view profiles that match your own animal archetype.
          </p>
          <button
            type="button"
            onClick={() => navigate("/landing/others")}
            className="mt-5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Back To Fellow Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Matching Profile</p>
            <h1 className="text-3xl font-bold">{fellowProfile.displayName}</h1>
            <p className="text-slate-600">{getAnimalLabel(currentAnimal)} archetype</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/landing/others")}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back To Fellow Profiles
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-60 bg-slate-200">
            <img src={fellowProfile.photoUrl} alt="Animal profile" className="h-full w-full object-cover" />
          </div>

          <div className="border-b border-slate-200 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {STEP_TITLES.map((title, i) => (
                <button
                  key={title}
                  type="button"
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
            {step === 0 && <QuickInfoPage profile={fellowProfile} />}
            {step === 1 && <HousingPage profile={fellowProfile} />}
            {step === 2 && <AboutPage profile={fellowProfile} />}

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous Page
              </button>
              <span className="text-sm text-slate-600">Page {step + 1} of 3</span>
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                disabled={step === 2}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function QuickInfoPage({ profile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Course & Bio</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow label="Display name" value={profile.displayName} />
        <InfoRow label="Course" value={profile.course || "Not provided"} />
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</p>
        <p className="mt-2 text-sm text-slate-700">{profile.bio || "No bio provided."}</p>
      </div>
    </div>
  );
}

function HousingPage({ profile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Housing Requirements</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoRow label="Budget" value={`$${profile.budgetMin} - $${profile.budgetMax}`} />
        <InfoRow label="Move-in" value={MOVE_IN_LABELS[profile.moveIn] || profile.moveIn} />
        <InfoRow label="Room type" value={ROOM_TYPE_LABELS[profile.roomType] || profile.roomType} />
        <InfoRow label="Area" value={AREA_LABELS[profile.area] || profile.area} />
        <InfoRow label="Lease" value={`${profile.leaseMonths} months`} />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile.amenities || []).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
        <p className="mt-2 text-sm text-slate-700">{profile.notes || "No notes provided."}</p>
      </div>
    </div>
  );
}

function AboutPage({ profile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About Them</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoRow label="Schedule" value={SCHEDULE_LABELS[profile.schedule] || profile.schedule} />
        <InfoRow label="Noise" value={NOISE_LABELS[profile.noise] || profile.noise} />
        <InfoRow label="Cleanliness" value={CLEAN_LABELS[profile.cleanliness] || profile.cleanliness} />
        <InfoRow
          label="Study/social"
          value={STUDY_SOCIAL_LABELS[profile.studySocial] || profile.studySocial}
        />
        <InfoRow label="Smokes" value={YES_NO_LABELS[profile.smoking] || profile.smoking} />
        <InfoRow
          label="Okay with smoking"
          value={YES_NO_LABELS[profile.okayWithSmoking] || profile.okayWithSmoking}
        />
        <InfoRow label="Has pets" value={YES_NO_LABELS[profile.pets] || profile.pets} />
        <InfoRow label="Okay with pets" value={YES_NO_LABELS[profile.okayWithPets] || profile.okayWithPets} />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interests</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile.interests || []).map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Traits</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile.traits || []).map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
