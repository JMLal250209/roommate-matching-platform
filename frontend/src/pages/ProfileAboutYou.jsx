import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressHeader from "../components/ProgressHeader.jsx";
import PillSelect from "../components/PillSelect.jsx";
import TagPicker from "../components/TagPicker.jsx";
import AnimalRevealModal from "../components/AnimalRevealModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfileDraft } from "../context/ProfileDraftContext.jsx";
import { mapFormToProfilePayload } from "../lib/profileMapping";
import { getUser, updateUser } from "../lib/usersApi";

const SCHEDULE = [
  { value: "early", label: "Early riser" },
  { value: "normal", label: "Normal" },
  { value: "late", label: "Late schedule" },
];

const NOISE = [
  { value: "quiet", label: "Quiet" },
  { value: "neutral", label: "Neutral" },
  { value: "lively", label: "Lively" },
];

const CLEAN = [
  { value: "very_clean", label: "Very clean" },
  { value: "average", label: "Average" },
  { value: "casual", label: "Casual" },
];

const STUDY_SOCIAL = [
  { value: "mostly_study", label: "Mostly study / chill at home" },
  { value: "balanced", label: "Balanced" },
  { value: "often_out", label: "Often out / social" },
];

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "sometimes", label: "Sometimes" },
];

const INTERESTS = [
  "Gym",
  "Sports",
  "Gaming",
  "Music",
  "Cooking",
  "Reading",
  "Nightlife",
  "Coffee",
  "Films",
  "Hiking",
  "Societies",
  "Tech",
  "Art",
  "Travel",
];

const TRAITS = [
  "Late schedule, quiet, tidy",
  "Social, flexible schedule, medium tidy",
  "Quiet, independent, tidy",
  "Flexible, calm, low conflict",
  "Social, group-oriented, energetic",
  "Early riser, quiet, routine-based",
  "Adaptable, medium social",
  "Quiet, clean, low-noise",
  "Friendly but respects space",
  "Studious weekdays, social weekends",
  "Likes shared meals sometimes",
  "Good communicator",
  "Guest-friendly (with notice)",
  "Minimalist / clutter-free",
  "Headphones for music",
  "Neat kitchen person",
];

function isDraftNearDefault(draft) {
  if (!draft) return true;
  const about = draft.about || {};
  const housing = draft.housing || {};

  return (
    !about.displayName &&
    !about.course &&
    !about.bio &&
    (!about.interests || about.interests.length === 0) &&
    (!about.traits || about.traits.length === 0) &&
    (!housing.notes || housing.notes.length === 0)
  );
}

export default function ProfileAboutYou() {
  const nav = useNavigate();
  const { user, setUser, signOut } = useAuth();
  const { draft, setAbout, hydrateFromBackend, resetDraft } = useProfileDraft();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [animalProfile, setAnimalProfile] = useState(null);
  const [savedUser, setSavedUser] = useState(null);
  const shouldHydrateFromBackend = useRef(isDraftNearDefault(draft));

  const about = useMemo(() => draft.about, [draft.about]);

  useEffect(() => {
    let isMounted = true;

    async function preloadProfile() {
      if (!user?.userId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const freshUser = await getUser(user.userId);
        if (!isMounted || !freshUser) return;

        setUser(freshUser);

        if (shouldHydrateFromBackend.current) {
          hydrateFromBackend(freshUser.profile, freshUser.name);
          shouldHydrateFromBackend.current = false;
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.code === "SESSION_EXPIRED") {
          signOut("Session expired. Please sign in again.");
          return;
        }
        setSaveError(err?.message || "Unable to load existing profile data.");
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    preloadProfile();
    return () => {
      isMounted = false;
    };
  }, [hydrateFromBackend, setUser, signOut, user?.userId]);

  useEffect(() => {
    if (user?.name && !about.displayName) {
      setAbout({ displayName: user.name });
    }
  }, [about.displayName, setAbout, user?.name]);

  function toggleTrait(trait) {
    const existing = about.traits || [];
    const nextSet = new Set(existing);
    if (nextSet.has(trait)) {
      nextSet.delete(trait);
    } else {
      nextSet.add(trait);
    }

    setAbout({ traits: Array.from(nextSet) });
  }

  async function onSave(e) {
    e.preventDefault();
    setSaveError("");

    if (!about.displayName?.trim()) {
      setSaveError("Please enter a display name.");
      return;
    }

    if (!user?.userId) {
      setSaveError("No authenticated user found. Please sign in again.");
      return;
    }

    const payload = mapFormToProfilePayload(draft);
    setSubmitting(true);

    try {
      let latestUser = user;

      if (payload.name && payload.name !== user.name) {
        const renamed = await updateUser(user.userId, { name: payload.name });
        if (renamed) {
          latestUser = renamed;
          setUser(renamed);
        }
      }

      const updated = await updateUser(user.userId, { profile: payload.profile });
      if (updated) {
        latestUser = updated;
        setUser(updated);
      }

      setAnimalProfile({
        schedule: about.schedule,
        cleanliness: about.cleanliness,
        studySocial: about.studySocial,
      });
      setSavedUser(latestUser);
      resetDraft();
      setShowAnimalModal(true);
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        signOut("Session expired. Please sign in again.");
        return;
      }
      setSaveError(err?.message || "Unable to save profile right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="container">
        <div className="card">
          <div className="cardBody">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <ProgressHeader step={2} total={2} title="About you" />

        <div className="cardHeader">
          <h1 className="h1">Tell us what you're like to live with.</h1>
          <p className="sub">
            This is used for roommate matching. Pick what fits and keep it simple.
          </p>
        </div>

        <form className="cardBody" onSubmit={onSave}>
          {saveError ? (
            <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {saveError}
            </div>
          ) : null}

          <div className="grid2">
            <div className="field">
              <label>Display name</label>
              <input
                className="input"
                value={about.displayName}
                onChange={(e) => setAbout({ displayName: e.target.value })}
                placeholder="e.g. Alex"
              />
              <div className="help">This is what other students will see.</div>
            </div>

            <div className="field">
              <label>Course / year (optional)</label>
              <input
                className="input"
                value={about.course}
                onChange={(e) => setAbout({ course: e.target.value })}
                placeholder="e.g. CS 2nd year"
              />
            </div>

            <div className="field">
              <label>Daily schedule</label>
              <PillSelect
                ariaLabel="Daily schedule"
                options={SCHEDULE}
                value={about.schedule}
                onChange={(value) => setAbout({ schedule: value })}
              />
            </div>

            <div className="field">
              <label>Noise preference</label>
              <PillSelect
                ariaLabel="Noise preference"
                options={NOISE}
                value={about.noise}
                onChange={(value) => setAbout({ noise: value })}
              />
            </div>

            <div className="field">
              <label>Cleanliness habits</label>
              <PillSelect
                ariaLabel="Cleanliness habits"
                options={CLEAN}
                value={about.cleanliness}
                onChange={(value) => setAbout({ cleanliness: value })}
              />
            </div>

            <div className="field">
              <label>Study / social preference</label>
              <PillSelect
                ariaLabel="Study/social"
                options={STUDY_SOCIAL}
                value={about.studySocial}
                onChange={(value) => setAbout({ studySocial: value })}
              />
            </div>

            <div className="field">
              <label>Do you smoke?</label>
              <PillSelect
                ariaLabel="Do you smoke"
                options={YES_NO}
                value={about.smoking}
                onChange={(value) => setAbout({ smoking: value })}
              />
            </div>

            <div className="field">
              <label>Okay with a roommate who smokes?</label>
              <PillSelect
                ariaLabel="Okay with smoking"
                options={YES_NO}
                value={about.okayWithSmoking}
                onChange={(value) => setAbout({ okayWithSmoking: value })}
              />
            </div>

            <div className="field">
              <label>Do you have pets?</label>
              <PillSelect
                ariaLabel="Do you have pets"
                options={YES_NO}
                value={about.pets}
                onChange={(value) => setAbout({ pets: value })}
              />
            </div>

            <div className="field">
              <label>Okay with pets in the home?</label>
              <PillSelect
                ariaLabel="Okay with pets"
                options={YES_NO}
                value={about.okayWithPets}
                onChange={(value) => setAbout({ okayWithPets: value })}
              />
            </div>
          </div>

          <div className="sectionTitle">Interest tags</div>
          <TagPicker
            value={about.interests}
            onChange={(value) => setAbout({ interests: value })}
            suggested={INTERESTS}
          />
          <div className="help">These can help explain matches.</div>

          <div className="sectionTitle">Quick descriptors</div>
          <div className="help" style={{ marginBottom: 10 }}>
            Pick a few, these will appear as a short summary line in match cards.
          </div>
          <div className="row">
            {TRAITS.map((trait) => {
              const active = about.traits?.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  className="pill"
                  data-active={active}
                  onClick={() => toggleTrait(trait)}
                  aria-pressed={active}
                >
                  {trait}
                </button>
              );
            })}
          </div>

          <div className="sectionTitle">Describe yourself (optional)</div>
          <div className="field">
            <label style={{ display: "none" }}>Bio</label>
            <textarea
              className="textarea"
              value={about.bio}
              onChange={(e) => setAbout({ bio: e.target.value })}
              maxLength={600}
              placeholder="A few lines about your routine, cooking, guests, and how you like to communicate."
            />
            <div className="help">{about.bio.length}/600</div>
          </div>

          <div className="btnBar" style={{ marginTop: 18 }}>
            <button type="button" className="btn btnGhost" onClick={() => nav("/profile/housing")}>
              Back
            </button>
            <button type="submit" className="btn btnPrimary" disabled={submitting}>
              {submitting ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
      {showAnimalModal ? (
        <AnimalRevealModal
          profile={animalProfile || {}}
          onClose={() => {
            setShowAnimalModal(false);
            nav("/landing", {
              replace: true,
              state: { fromProfileSave: true, user: savedUser || user },
            });
          }}
        />
      ) : null}
    </div>
  );
}
