import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressHeader from "../components/ProgressHeader.jsx";
import PillSelect from "../components/PillSelect.jsx";
import TagPicker from "../components/TagPicker.jsx";

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
  "Gym", "Sports", "Gaming", "Music", "Cooking", "Reading",
  "Nightlife", "Coffee", "Films", "Hiking", "Societies", "Tech",
  "Art", "Travel",
];

const TRAITS = [
  // based on your image + extras
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

export default function ProfileAboutYou() {
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [course, setCourse] = useState("");
  const [schedule, setSchedule] = useState("normal");
  const [noise, setNoise] = useState("neutral");
  const [cleanliness, setCleanliness] = useState("average");
  const [studySocial, setStudySocial] = useState("balanced");

  const [smoking, setSmoking] = useState("no");
  const [okayWithSmoking, setOkayWithSmoking] = useState("no");
  const [pets, setPets] = useState("no");
  const [okayWithPets, setOkayWithPets] = useState("yes");

  const [interests, setInterests] = useState([]);
  const [traits, setTraits] = useState([]);
  const [bio, setBio] = useState("");

  function toggleTrait(t) {
    setTraits((prev) => {
      const s = new Set(prev);
      if (s.has(t)) s.delete(t);
      else s.add(t);
      return Array.from(s);
    });
  }

  function onSave(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("Please enter a display name.");
      return;
    }

    // UI only — just show what would be submitted later:
    console.log({
      displayName,
      course,
      schedule,
      noise,
      cleanliness,
      studySocial,
      smoking,
      okayWithSmoking,
      pets,
      okayWithPets,
      interests,
      traits,
      bio,
    });

    alert("UI only: profile saved (check console).");
    nav("/profile/view");
  }

  return (
    <div className="container">
      <div className="card">
        <ProgressHeader step={2} total={2} title="About you" />

        <div className="cardHeader">
          <h1 className="h1">Tell us what you’re like to live with.</h1>
          <p className="sub">
            This is used for roommate matching. Pick what fits — keep it simple.
          </p>
        </div>

        <form className="cardBody" onSubmit={onSave}>
          <div className="grid2">
            <div className="field">
              <label>Display name</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
              />
              <div className="help">This is what other students will see.</div>
            </div>

            <div className="field">
              <label>Course / year (optional)</label>
              <input
                className="input"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. CS 2nd year"
              />
            </div>

            <div className="field">
              <label>Daily schedule</label>
              <PillSelect ariaLabel="Daily schedule" options={SCHEDULE} value={schedule} onChange={setSchedule} />
            </div>

            <div className="field">
              <label>Noise preference</label>
              <PillSelect ariaLabel="Noise preference" options={NOISE} value={noise} onChange={setNoise} />
            </div>

            <div className="field">
              <label>Cleanliness habits</label>
              <PillSelect ariaLabel="Cleanliness habits" options={CLEAN} value={cleanliness} onChange={setCleanliness} />
            </div>

            <div className="field">
              <label>Study / social preference</label>
              <PillSelect ariaLabel="Study/social" options={STUDY_SOCIAL} value={studySocial} onChange={setStudySocial} />
            </div>

            <div className="field">
              <label>Do you smoke?</label>
              <PillSelect ariaLabel="Do you smoke" options={YES_NO} value={smoking} onChange={setSmoking} />
            </div>

            <div className="field">
              <label>Okay with a roommate who smokes?</label>
              <PillSelect ariaLabel="Okay with smoking" options={YES_NO} value={okayWithSmoking} onChange={setOkayWithSmoking} />
            </div>

            <div className="field">
              <label>Do you have pets?</label>
              <PillSelect ariaLabel="Do you have pets" options={YES_NO} value={pets} onChange={setPets} />
            </div>

            <div className="field">
              <label>Okay with pets in the home?</label>
              <PillSelect ariaLabel="Okay with pets" options={YES_NO} value={okayWithPets} onChange={setOkayWithPets} />
            </div>
          </div>

          <div className="sectionTitle">Interest tags</div>
          <TagPicker value={interests} onChange={setInterests} suggested={INTERESTS} />
          <div className="help">These can help explain matches (“you both like hiking”).</div>

          <div className="sectionTitle">Quick descriptors</div>
          <div className="help" style={{ marginBottom: 10 }}>
            Pick a few — these will appear as a short “summary line” in match cards.
          </div>
          <div className="row">
            {TRAITS.map((t) => {
              const active = traits.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  className="pill"
                  data-active={active}
                  onClick={() => toggleTrait(t)}
                  aria-pressed={active}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="sectionTitle">Describe yourself (optional)</div>
          <div className="field">
            <label style={{ display: "none" }}>Bio</label>
            <textarea
              className="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={600}
              placeholder="A few lines about your routine, cooking, guests, and how you like to communicate."
            />
            <div className="help">{bio.length}/600</div>
          </div>

          <div className="btnBar" style={{ marginTop: 18 }}>
            <button type="button" className="btn btnGhost" onClick={() => nav("/profile/housing")}>
              ← Back
            </button>
            <button type="submit" className="btn btnPrimary">
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
