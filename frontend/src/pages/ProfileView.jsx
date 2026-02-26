import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  mapBackendProfileToProfileView,
  mapProfileViewToBackendProfile,
} from "../lib/profileMapping";
import { getUser, getUserAnimal, updateUser } from "../lib/usersApi";
import PillSelect from "../components/PillSelect.jsx";
import TagPicker from "../components/TagPicker.jsx";
import "./ProfileView.css";

const STEPS = ["Basic", "Housing", "About You"];
const DEFAULT_PROFILE = mapBackendProfileToProfileView({});

const ROOM_TYPES = [
  { value: "single", label: "Single room" },
  { value: "shared", label: "Shared room" },
  { value: "studio", label: "Studio" },
  { value: "any", label: "Any" },
];

const AREA = [
  { value: "city", label: "City centre" },
  { value: "suburbs", label: "Suburbs" },
  { value: "either", label: "Either" },
];

const MOVE_IN = [
  { value: "asap", label: "ASAP" },
  { value: "this_month", label: "This month" },
  { value: "next_month", label: "Next month" },
  { value: "flexible", label: "Flexible" },
];

const AMENITIES = [
  "Garden / outdoor space",
  "Ensuite bathroom",
  "Bills included",
  "Washing machine",
  "Dishwasher",
  "Bike storage",
  "Parking",
  "Near campus",
  "Near public transport",
  "Accessible / step-free",
  "Quiet area",
];

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

function labelFor(value, options) {
  return options.find((option) => option.value === value)?.label || value || "—";
}

function omitUndefinedFields(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export default function ProfileView() {
  const navigate = useNavigate();
  const { user, setUser, signOut } = useAuth();
  const [step, setStep] = useState(0); // 0,1,2
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendProfile, setBackendProfile] = useState({});
  const [animalInfo, setAnimalInfo] = useState(null);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const [draft, setDraft] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.userId) {
        setAnimalInfo(null);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setLoadError("");

      try {
        const [freshUser, freshAnimal] = await Promise.all([
          getUser(user.userId),
          getUserAnimal(user.userId).catch(() => null),
        ]);
        if (!isMounted || !freshUser) return;

        const mapped = mapBackendProfileToProfileView(freshUser.profile || {}, freshUser.name);
        setBackendProfile(freshUser.profile || {});
        setProfile(mapped);
        setDraft(mapped);
        setUser(freshUser);
        setAnimalInfo(freshAnimal);
      } catch (err) {
        if (!isMounted) return;
        if (err?.code === "SESSION_EXPIRED") {
          signOut("Session expired. Please sign in again.");
          return;
        }
        setLoadError(err?.message || "Unable to load profile.");
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [setUser, signOut, user?.userId]);

  const fallbackLetter = (user?.name || "U").charAt(0).toUpperCase();

  // Local uploaded image preview (doesn't require backend)
  const [photoPreview, setPhotoPreview] = useState("");

  const accent = "#059669";
  const pageBg = "#FFFFFF";
  const cardBg = "#FFFFFF";
  const text = "#1F2933";

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const stepTitle = useMemo(() => STEPS[step], [step]);

  function goStep(i) {
    setStep(i);
    setMessage("");
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setMessage("");
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    setMessage("");
  }

  function startEdit() {
    setDraft(profile);
    setIsEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    setDraft(profile);
    setIsEditing(false);
    setPhotoPreview("");
    setLoadError("");
    setMessage("Edit cancelled.");
  }

  async function saveEdit(e) {
    e.preventDefault();
    setLoadError("");

    if (!user?.userId) {
      setLoadError("No authenticated user found. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      let latestUser = user;

      const nextDisplayName = (draft.displayName || "").trim();
      if (nextDisplayName && nextDisplayName !== user.name) {
        const renamed = await updateUser(user.userId, { name: nextDisplayName });
        if (renamed) {
          latestUser = renamed;
          setUser(renamed);
        }
      }

      const profilePatch = omitUndefinedFields({
        ...backendProfile,
        ...mapProfileViewToBackendProfile(draft),
      });

      const updatedUser = await updateUser(user.userId, { profile: profilePatch });
      if (updatedUser) {
        latestUser = updatedUser;
        setUser(updatedUser);
      }

      const persistedProfile = updatedUser?.profile || profilePatch;
      const mapped = mapBackendProfileToProfileView(
        persistedProfile,
        latestUser?.name || nextDisplayName || user.name
      );
      setBackendProfile(persistedProfile);
      setProfile(mapped);
      setDraft(mapped);
      setIsEditing(false);
      setMessage("Profile updated.");
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        signOut("Session expired. Please sign in again.");
        return;
      }
      setLoadError(err?.message || "Unable to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  function onUploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  const displayedPhoto = photoPreview || profile.photoUrl;

  if (loadingProfile) {
    return (
      <div className="page" style={{ background: pageBg, color: text }}>
        <div className="card" style={{ borderColor: accent, background: cardBg }}>
          <div className="cardBody">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: pageBg, color: text }}>
      <div className="card" style={{ borderColor: accent, background: cardBg }}>
        <div className="header" style={{ background: accent }}>
          <div className="headerRow">
            <div className="title">My Profile</div>
            {isEditing && (
              <div className="headerActions">
                <button className="btn btnLight" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="subtitle">
            Step {step + 1} of {STEPS.length}: {stepTitle}
          </div>
        </div>

        {message && <div className="toast">{message}</div>}
        {loadError && <div className="toast" style={{ background: "#FEE2E2", color: "#9F1239" }}>{loadError}</div>}

        <div className="stepper">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goStep(i)}
              className={`step ${i === step ? "active" : ""}`}
              style={{ borderColor: accent }}
            >
              <span className="stepNum">{i + 1}</span>
              <span className="stepLabel">{label}</span>
            </button>
          ))}
        </div>

        {!isEditing ? (
          <div className="content">
            <PhotoBlock
              accent={accent}
              displayedPhoto={displayedPhoto}
              fallbackLetter={fallbackLetter}
            />
            {step === 0 && <QuickInfoView profile={profile} animalInfo={animalInfo} />}
            {step === 1 && <HousingView profile={profile} />}
            {step === 2 && <AboutView profile={profile} />}
          </div>
        ) : (
          <form className="content" onSubmit={saveEdit}>
            <PhotoEdit
              accent={accent}
              displayedPhoto={photoPreview || draft.photoUrl}
              fallbackLetter={fallbackLetter}
              draft={draft}
              setDraft={setDraft}
              onUploadPhoto={onUploadPhoto}
            />
            {step === 0 && <QuickInfoEdit draft={draft} setDraft={setDraft} />}
            {step === 1 && <HousingEdit draft={draft} setDraft={setDraft} />}
            {step === 2 && <AboutEdit draft={draft} setDraft={setDraft} />}
            <div className="footerRow">
              <div className="navButtons">
                <button className="btn btnDark" type="button" onClick={back} disabled={step === 0}>
                  Back
                </button>
                <button
                  className="btn btnDark"
                  type="button"
                  onClick={next}
                  disabled={step === STEPS.length - 1}
                >
                  Next
                </button>
              </div>

              <button className="btn btnSave" type="submit" disabled={saving}>
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </form>
        )}

        {!isEditing && (
          <div className="footerRow">
            <div className="navButtons">
              <button className="btn btnDark" type="button" onClick={back} disabled={step === 0}>
                Back
              </button>
              <button
                className="btn btnDark"
                type="button"
                onClick={next}
                disabled={step === STEPS.length - 1}
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btnDark" type="button" onClick={startEdit}>
                Edit
              </button>
              <button className="btn btnSave" type="button" onClick={() => navigate("/landing")}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoBlock({ accent, displayedPhoto, fallbackLetter }) {
  return (
    <div className="photoRow">
      {displayedPhoto ? (
        <img className="photo" src={displayedPhoto} alt="Profile" />
      ) : (
        <div className="avatar" style={{ background: accent }}>{fallbackLetter}</div>
      )}
    </div>
  );
}

function PhotoEdit({ accent, displayedPhoto, fallbackLetter, draft, setDraft, onUploadPhoto }) {
  return (
    <div className="photoEdit">
      <div className="photoRow">
        {displayedPhoto ? (
          <img className="photo" src={displayedPhoto} alt="Profile preview" />
        ) : (
          <div className="avatar" style={{ background: accent }}>{fallbackLetter}</div>
        )}
      </div>
      <div className="grid2">
        <div className="field">
          <label className="label">Upload photo</label>
          <input className="input" type="file" accept="image/*" onChange={onUploadPhoto} />
        </div>
        <div className="field">
          <label className="label">Or photo URL</label>
          <input
            className="input"
            value={draft.photoUrl || ""}
            onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}

function formatAnimalLabel(value) {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function QuickInfoView({ profile, animalInfo }) {
  const compatibleAnimals = Array.isArray(animalInfo?.compatible_animals)
    ? animalInfo.compatible_animals.map(formatAnimalLabel).join(", ")
    : "";

  return (
    <div className="panel">
      <h2 className="h2">Course, quick info & bio</h2>
      <div className="kv">
        <div><strong>Display name:</strong> {profile.displayName || "—"}</div>
        <div><strong>Course / year:</strong> {profile.course || "—"}</div>
        <div><strong>Animal archetype:</strong> {formatAnimalLabel(animalInfo?.animal)}</div>
        <div><strong>Best matches:</strong> {compatibleAnimals || "—"}</div>
        <div><strong>Quick descriptors:</strong> {Array.isArray(profile.traits) && profile.traits.length > 0 ? profile.traits.join(", ") : "None"}</div>
        <div><strong>Bio:</strong> {profile.bio || "—"}</div>
      </div>
    </div>
  );
}

function QuickInfoEdit({ draft, setDraft }) {
  function toggleTrait(t) {
    const prev = draft.traits ?? [];
    const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
    setDraft({ ...draft, traits: next });
  }

  return (
    <div className="panel">
      <h2 className="h2">Course, quick info & bio</h2>
      <div className="grid2">
        <div className="field">
          <label className="label">Display name</label>
          <input
            className="input"
            value={draft.displayName ?? ""}
            onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
            placeholder="e.g. Alex"
          />
        </div>
        <div className="field">
          <label className="label">Course / year</label>
          <input
            className="input"
            value={draft.course ?? ""}
            onChange={(e) => setDraft({ ...draft, course: e.target.value })}
            placeholder="e.g. CS 2nd year"
          />
        </div>
      </div>
      <div className="sectionTitle">Quick descriptors</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {TRAITS.map((t) => (
          <button
            key={t}
            type="button"
            className="pill"
            data-active={(draft.traits ?? []).includes(t)}
            onClick={() => toggleTrait(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="sectionTitle">Bio</div>
      <div className="field">
        <textarea
          className="textarea"
          value={draft.bio ?? ""}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          maxLength={600}
          placeholder="A few lines about yourself..."
        />
        <div className="help">{(draft.bio ?? "").length}/600</div>
      </div>
    </div>
  );
}

function HousingView({ profile }) {
  return (
    <div className="panel">
      <h2 className="h2">Housing requirements</h2>
      <div className="kv">
        <div><strong>Budget:</strong> €{profile.budgetMin ?? 0} – €{profile.budgetMax ?? 0} / month</div>
        <div><strong>Preferred move-in:</strong> {labelFor(profile.moveIn, MOVE_IN)}</div>
        <div><strong>Room type:</strong> {labelFor(profile.roomType, ROOM_TYPES)}</div>
        <div><strong>Area:</strong> {labelFor(profile.area, AREA)}</div>
        <div><strong>Lease length:</strong> {profile.leaseMonths ?? 0} months</div>
        <div><strong>Amenities:</strong> {Array.isArray(profile.amenities) && profile.amenities.length > 0 ? profile.amenities.join(", ") : "None selected"}</div>
        <div><strong>Dealbreakers / notes:</strong> {profile.notes || "None"}</div>
      </div>
    </div>
  );
}

function HousingEdit({ draft, setDraft }) {
  return (
    <div className="panel">
      <h2 className="h2">Housing requirements</h2>
      <div className="grid2">
        <div className="field">
          <label className="label">Budget min (€/month)</label>
          <input
            className="input"
            type="number"
            value={draft.budgetMin ?? ""}
            onChange={(e) => setDraft({ ...draft, budgetMin: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label className="label">Budget max (€/month)</label>
          <input
            className="input"
            type="number"
            value={draft.budgetMax ?? ""}
            onChange={(e) => setDraft({ ...draft, budgetMax: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label className="label">Preferred move-in</label>
          <PillSelect ariaLabel="Move-in" options={MOVE_IN} value={draft.moveIn ?? "flexible"} onChange={(v) => setDraft({ ...draft, moveIn: v })} />
        </div>
        <div className="field">
          <label className="label">Room type</label>
          <PillSelect ariaLabel="Room type" options={ROOM_TYPES} value={draft.roomType ?? "any"} onChange={(v) => setDraft({ ...draft, roomType: v })} />
        </div>
        <div className="field">
          <label className="label">Area</label>
          <PillSelect ariaLabel="Area" options={AREA} value={draft.area ?? "either"} onChange={(v) => setDraft({ ...draft, area: v })} />
        </div>
        <div className="field">
          <label className="label">Lease length (months)</label>
          <input
            className="input"
            type="number"
            min="1"
            max="24"
            value={draft.leaseMonths ?? ""}
            onChange={(e) => setDraft({ ...draft, leaseMonths: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="label">Dealbreakers (optional)</label>
          <input
            className="input"
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="e.g. near Luas, guests ok..."
          />
        </div>
      </div>
      <div className="sectionTitle">Amenities</div>
      <TagPicker value={draft.amenities ?? []} onChange={(v) => setDraft({ ...draft, amenities: v })} suggested={AMENITIES} />
    </div>
  );
}

function AboutView({ profile }) {
  return (
    <div className="panel">
      <h2 className="h2">About you</h2>
      <div className="kv">
        <div><strong>Daily schedule:</strong> {labelFor(profile.schedule, SCHEDULE)}</div>
        <div><strong>Noise preference:</strong> {labelFor(profile.noise, NOISE)}</div>
        <div><strong>Cleanliness:</strong> {labelFor(profile.cleanliness, CLEAN)}</div>
        <div><strong>Study / social:</strong> {labelFor(profile.studySocial, STUDY_SOCIAL)}</div>
        <div><strong>Smoking:</strong> {profile.smoking || "—"}</div>
        <div><strong>Okay with smoking:</strong> {profile.okayWithSmoking || "—"}</div>
        <div><strong>Pets:</strong> {profile.pets || "—"}</div>
        <div><strong>Okay with pets:</strong> {profile.okayWithPets || "—"}</div>
        <div><strong>Interests:</strong> {Array.isArray(profile.interests) && profile.interests.length > 0 ? profile.interests.join(", ") : "None"}</div>
      </div>
    </div>
  );
}

function AboutEdit({ draft, setDraft }) {
  return (
    <div className="panel">
      <h2 className="h2">About you</h2>
      <div className="grid2">
        <div className="field">
          <label className="label">Daily schedule</label>
          <PillSelect ariaLabel="Schedule" options={SCHEDULE} value={draft.schedule ?? "normal"} onChange={(v) => setDraft({ ...draft, schedule: v })} />
        </div>
        <div className="field">
          <label className="label">Noise preference</label>
          <PillSelect ariaLabel="Noise" options={NOISE} value={draft.noise ?? "neutral"} onChange={(v) => setDraft({ ...draft, noise: v })} />
        </div>
        <div className="field">
          <label className="label">Cleanliness</label>
          <PillSelect ariaLabel="Cleanliness" options={CLEAN} value={draft.cleanliness ?? "average"} onChange={(v) => setDraft({ ...draft, cleanliness: v })} />
        </div>
        <div className="field">
          <label className="label">Study / social</label>
          <PillSelect ariaLabel="Study social" options={STUDY_SOCIAL} value={draft.studySocial ?? "balanced"} onChange={(v) => setDraft({ ...draft, studySocial: v })} />
        </div>
        <div className="field">
          <label className="label">Do you smoke?</label>
          <PillSelect ariaLabel="Smoking" options={YES_NO} value={draft.smoking ?? "no"} onChange={(v) => setDraft({ ...draft, smoking: v })} />
        </div>
        <div className="field">
          <label className="label">Okay with smoking?</label>
          <PillSelect ariaLabel="Okay smoking" options={YES_NO} value={draft.okayWithSmoking ?? "no"} onChange={(v) => setDraft({ ...draft, okayWithSmoking: v })} />
        </div>
        <div className="field">
          <label className="label">Do you have pets?</label>
          <PillSelect ariaLabel="Pets" options={YES_NO} value={draft.pets ?? "no"} onChange={(v) => setDraft({ ...draft, pets: v })} />
        </div>
        <div className="field">
          <label className="label">Okay with pets?</label>
          <PillSelect ariaLabel="Okay pets" options={YES_NO} value={draft.okayWithPets ?? "yes"} onChange={(v) => setDraft({ ...draft, okayWithPets: v })} />
        </div>
      </div>
      <div className="sectionTitle">Interest tags</div>
      <TagPicker value={draft.interests ?? []} onChange={(v) => setDraft({ ...draft, interests: v })} suggested={INTERESTS} />
    </div>
  );
}
