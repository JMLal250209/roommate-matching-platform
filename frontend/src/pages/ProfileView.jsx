import { useEffect, useMemo, useState } from "react";
import "./ProfileView.css";

const STEPS = ["Basic", "Housing", "About You"];

export default function ProfileView() {
  const [step, setStep] = useState(0); // 0,1,2
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
  if (!message) return;

  const timer = setTimeout(() => {
    setMessage("");
  }, 3000);

  return () => clearTimeout(timer);
}, [message]);


  const [profile, setProfile] = useState({
    // Step 1: Basic
    photoUrl: "", // optional external URL
    bio: "I enjoy fun but also do need to study 🚀",
    year: "2",
    course: "Computer Science",

    // Step 2: Housing requirements
    budget: "€900/month",
    location: "Dublin City Centre / Rathmines / Ranelagh",
    moveInDate: "2026-02-15",
    leaseLength: "6-12 months",
    smokersOk: false,
    petsOk: true,
    quietHours: "23:00 - 07:00",

    // Step 3: About you
    socialPreference: "Medium", // Low / Medium / High
    routine: "Early-ish — lectures, gym, study, chill",
    cleanliness: "High",
    cooking: "Sometimes",
    bedtime: "23:30",
    wakeTime: "07:30",
    notes: "I’m friendly, organised, and respect shared spaces.",
  });

  // Draft used in edit mode
  const [draft, setDraft] = useState(profile);

  // Local uploaded image preview (doesn't require backend)
  const [photoPreview, setPhotoPreview] = useState("");

  const accent = "#0F4570";
  const pageBg = "#F7F9FB";
  const cardBg = "#FA8D23";
  const text = "#1F2933";

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
    setMessage("Edit cancelled ❌");
  }

  function saveEdit(e) {
    e.preventDefault();
    setProfile(draft);
    setIsEditing(false);
    setMessage("Profile updated ✅");
  }

  function onUploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  const displayedPhoto = photoPreview || profile.photoUrl;

  return (
    <div className="page" style={{ background: pageBg, color: text }}>
      <div className="card" style={{ borderColor: accent, background: cardBg }}>
        <div className="header" style={{ background: accent }}>
          <div className="headerRow">
            <div className="title">👤 My Profile</div>

            <div className="headerActions">
              {!isEditing ? (
                <button className="btn btnLight" type="button" onClick={startEdit}>
                  ✏️ Edit
                </button>
              ) : (
                <button className="btn btnLight" type="button" onClick={cancelEdit}>
                  ❌ Cancel
                </button>
              )}
            </div>
          </div>

          <div className="subtitle">
            Step {step + 1} of {STEPS.length}: <strong>{stepTitle}</strong>
          </div>
        </div>

        {message && <div className="toast">{message}</div>}

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goStep(i)}
              className={`step ${i === step ? "active" : ""}`}
              style={{
                borderColor: accent,
              }}
            >
              <span className="stepNum">{i + 1}</span>
              <span className="stepLabel">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {!isEditing ? (
          <div className="content">
            <PhotoBlock
              accent={accent}
              displayedPhoto={displayedPhoto}
              fallbackLetter={"B"}
            />

            {step === 0 && <BasicView profile={profile} />}
            {step === 1 && <HousingView profile={profile} />}
            {step === 2 && <AboutView profile={profile} />}
          </div>
        ) : (
          <form className="content" onSubmit={saveEdit}>
            <PhotoEdit
              accent={accent}
              displayedPhoto={photoPreview || draft.photoUrl}
              fallbackLetter={"B"}
              draft={draft}
              setDraft={setDraft}
              onUploadPhoto={onUploadPhoto}
            />

            {step === 0 && <BasicEdit draft={draft} setDraft={setDraft} />}
            {step === 1 && <HousingEdit draft={draft} setDraft={setDraft} />}
            {step === 2 && <AboutEdit draft={draft} setDraft={setDraft} />}

            <div className="footerRow">
              <div className="navButtons">
                <button
                  className="btn btnDark"
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                >
                  ◀ Back
                </button>
                <button
                  className="btn btnDark"
                  type="button"
                  onClick={next}
                  disabled={step === STEPS.length - 1}
                >
                  Next ▶
                </button>
              </div>

              <button className="btn btnSave" type="submit">
                💾 Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Bottom navigation for view mode too */}
        {!isEditing && (
          <div className="footerRow">
            <div className="navButtons">
              <button
                className="btn btnDark"
                type="button"
                onClick={back}
                disabled={step === 0}
              >
                ◀ Back
              </button>
              <button
                className="btn btnDark"
                type="button"
                onClick={next}
                disabled={step === STEPS.length - 1}
              >
                Next ▶
              </button>
            </div>

            <button className="btn btnDark" type="button" onClick={startEdit}>
              ✏️ Edit This Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Shared blocks -------------------- */

function PhotoBlock({ accent, displayedPhoto, fallbackLetter }) {
  return (
    <div className="photoRow">
      {displayedPhoto ? (
        <img className="photo" src={displayedPhoto} alt="Profile" />
      ) : (
        <div className="avatar" style={{ background: accent }}>
          {fallbackLetter}
        </div>
      )}
    </div>
  );
}

function PhotoEdit({
  accent,
  displayedPhoto,
  fallbackLetter,
  draft,
  setDraft,
  onUploadPhoto,
}) {
  return (
    <div className="photoEdit">
      <div className="photoRow">
        {displayedPhoto ? (
          <img className="photo" src={displayedPhoto} alt="Profile preview" />
        ) : (
          <div className="avatar" style={{ background: accent }}>
            {fallbackLetter}
          </div>
        )}
      </div>

      <div className="grid2">
        <div className="field">
          <label className="label">Upload photo</label>
          <input className="input" type="file" accept="image/*" onChange={onUploadPhoto} />
          <div className="hint">Uses a local preview (no backend needed).</div>
        </div>

        <div className="field">
          <label className="label">Or photo URL</label>
          <input
            className="input"
            value={draft.photoUrl}
            onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })}
            placeholder="https://..."
          />
          <div className="hint">If you paste a URL, it will display it.</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Step 1: Basic -------------------- */

function BasicView({ profile }) {
  return (
    <div className="panel">
      <h2 className="h2">Basic</h2>
      <div className="kv">
        <div><strong>Year:</strong> {profile.year}</div>
        <div><strong>Course:</strong> {profile.course}</div>
        <div><strong>Bio:</strong> {profile.bio}</div>
      </div>
    </div>
  );
}

function BasicEdit({ draft, setDraft }) {
  return (
    <div className="panel">
      <h2 className="h2">Basic</h2>
      <div className="grid2">
        <div className="field">
          <label className="label">Year</label>
          <select
            className="input"
            value={draft.year}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="Masters">Masters</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Course</label>
          <input
            className="input"
            value={draft.course}
            onChange={(e) => setDraft({ ...draft, course: e.target.value })}
            placeholder="Computer Science"
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Bio</label>
        <textarea
          className="input"
          rows={3}
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          placeholder="A short intro..."
        />
      </div>
    </div>
  );
}

/* -------------------- Step 2: Housing -------------------- */

function HousingView({ profile }) {
  return (
    <div className="panel">
      <h2 className="h2">Housing requirements</h2>
      <div className="kv">
        <div><strong>Budget:</strong> {profile.budget}</div>
        <div><strong>Preferred location:</strong> {profile.location}</div>
        <div><strong>Move-in date:</strong> {profile.moveInDate}</div>
        <div><strong>Lease length:</strong> {profile.leaseLength}</div>
        <div><strong>Smokers OK:</strong> {profile.smokersOk ? "Yes" : "No"}</div>
        <div><strong>Pets OK:</strong> {profile.petsOk ? "Yes" : "No"}</div>
        <div><strong>Quiet hours:</strong> {profile.quietHours}</div>
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
          <label className="label">Budget</label>
          <input
            className="input"
            value={draft.budget}
            onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
            placeholder="€900/month"
          />
        </div>

        <div className="field">
          <label className="label">Move-in date</label>
          <input
            className="input"
            type="date"
            value={draft.moveInDate}
            onChange={(e) => setDraft({ ...draft, moveInDate: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Preferred location(s)</label>
        <input
          className="input"
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          placeholder="Areas you like..."
        />
      </div>

      <div className="grid2">
        <div className="field">
          <label className="label">Lease length</label>
          <select
            className="input"
            value={draft.leaseLength}
            onChange={(e) => setDraft({ ...draft, leaseLength: e.target.value })}
          >
            <option>3 months</option>
            <option>6 months</option>
            <option>6-12 months</option>
            <option>12 months</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Quiet hours</label>
          <input
            className="input"
            value={draft.quietHours}
            onChange={(e) => setDraft({ ...draft, quietHours: e.target.value })}
            placeholder="23:00 - 07:00"
          />
        </div>
      </div>

      <div className="toggleRow">
        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.smokersOk}
            onChange={(e) => setDraft({ ...draft, smokersOk: e.target.checked })}
          />
          <span>Smokers OK</span>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.petsOk}
            onChange={(e) => setDraft({ ...draft, petsOk: e.target.checked })}
          />
          <span>Pets OK</span>
        </label>
      </div>
    </div>
  );
}

/* -------------------- Step 3: About -------------------- */

function AboutView({ profile }) {
  return (
    <div className="panel">
      <h2 className="h2">About you</h2>
      <div className="kv">
        <div><strong>Social preference:</strong> {profile.socialPreference}</div>
        <div><strong>Routine:</strong> {profile.routine}</div>
        <div><strong>Cleanliness:</strong> {profile.cleanliness}</div>
        <div><strong>Cooking:</strong> {profile.cooking}</div>
        <div><strong>Bedtime:</strong> {profile.bedtime}</div>
        <div><strong>Wake time:</strong> {profile.wakeTime}</div>
        <div><strong>Extra notes:</strong> {profile.notes}</div>
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
          <label className="label">Social preference</label>
          <select
            className="input"
            value={draft.socialPreference}
            onChange={(e) => setDraft({ ...draft, socialPreference: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Cleanliness</label>
          <select
            className="input"
            value={draft.cleanliness}
            onChange={(e) => setDraft({ ...draft, cleanliness: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Daily routine</label>
        <textarea
          className="input"
          rows={3}
          value={draft.routine}
          onChange={(e) => setDraft({ ...draft, routine: e.target.value })}
          placeholder="How you spend a typical day..."
        />
      </div>

      <div className="grid2">
        <div className="field">
          <label className="label">Cooking</label>
          <select
            className="input"
            value={draft.cooking}
            onChange={(e) => setDraft({ ...draft, cooking: e.target.value })}
          >
            <option>Never</option>
            <option>Sometimes</option>
            <option>Often</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Bedtime</label>
          <input
            className="input"
            type="time"
            value={draft.bedtime}
            onChange={(e) => setDraft({ ...draft, bedtime: e.target.value })}
          />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label className="label">Wake time</label>
          <input
            className="input"
            type="time"
            value={draft.wakeTime}
            onChange={(e) => setDraft({ ...draft, wakeTime: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label">Extra notes</label>
          <input
            className="input"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Anything else?"
          />
        </div>
      </div>
    </div>
  );
}
