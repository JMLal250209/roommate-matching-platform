import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext.jsx";
import ProgressHeader from "../components/ProgressHeader.jsx";
import PillSelect from "../components/PillSelect.jsx";
import TagPicker from "../components/TagPicker.jsx";
import { useProfileDraft } from "../context/ProfileDraftContext.jsx";

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

export default function ProfileHousingRequirements() {
  const nav = useNavigate();
  const { draft, setHousing } = useProfileDraft();
  const [error, setError] = useState("");

  const housing = draft.housing;

  function onNext(e) {
    e.preventDefault();
    setError("");

    if (Number(housing.budgetMin) > Number(housing.budgetMax)) {
      setError("Your minimum budget cannot be higher than your maximum budget.");
      return;
    }

    nav("/profile/about-you");
  }

  return (
    <div className="container">
      <div className="card">
        <ProgressHeader step={1} total={2} title="Housing requirements" />

        <div className="cardHeader">
          <h1 className="h1">What do you want in a place?</h1>
          <p className="sub">
            Quick preferences first. You can change everything later - no pressure.
          </p>
        </div>

        <form className="cardBody" onSubmit={onNext}>
          {error ? (
            <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid2">
            <div className="field">
              <label>Budget range (EUR/month)</label>
              <div className="row">
                <input
                  className="input"
                  style={{ maxWidth: 140 }}
                  type="number"
                  value={housing.budgetMin}
                  onChange={(e) => setHousing({ budgetMin: Number(e.target.value) || 0 })}
                />
                <span style={{ opacity: 0.7 }}>to</span>
                <input
                  className="input"
                  style={{ maxWidth: 140 }}
                  type="number"
                  value={housing.budgetMax}
                  onChange={(e) => setHousing({ budgetMax: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="help">Helps filter listings that fit you.</div>
            </div>

            <div className="field">
              <label>Preferred move-in</label>
              <PillSelect
                ariaLabel="Preferred move-in time"
                options={MOVE_IN}
                value={housing.moveIn}
                onChange={(value) => setHousing({ moveIn: value })}
              />
            </div>

            <div className="field">
              <label>Room type</label>
              <PillSelect
                ariaLabel="Room type preference"
                options={ROOM_TYPES}
                value={housing.roomType}
                onChange={(value) => setHousing({ roomType: value })}
              />
            </div>

            <div className="field">
              <label>Area</label>
              <PillSelect
                ariaLabel="Area preference"
                options={AREA}
                value={housing.area}
                onChange={(value) => setHousing({ area: value })}
              />
            </div>

            <div className="field">
              <label>Lease length (months)</label>
              <input
                className="input"
                type="number"
                min="1"
                max="24"
                value={housing.leaseMonths}
                onChange={(e) => setHousing({ leaseMonths: Number(e.target.value) || 1 })}
              />
              <div className="help">Typical student leases: 6-12 months.</div>
            </div>

            <div className="field">
              <label>Dealbreakers (optional)</label>
              <input
                className="input"
                value={housing.notes}
                onChange={(e) => setHousing({ notes: e.target.value })}
                placeholder="e.g. near Luas, guests ok, no basement rooms..."
              />
              <div className="help">One sentence is plenty.</div>
            </div>
          </div>

          <div className="sectionTitle">Amenities you care about</div>
          <TagPicker
            value={housing.amenities}
            onChange={(value) => setHousing({ amenities: value })}
            suggested={AMENITIES}
          />

          <div className="btnBar" style={{ marginTop: 18 }}>
            <button type="button" className="btn btnGhost" onClick={() => nav("/create-profile")}>
              Back
            </button>
            <button type="submit" className="btn btnPrimary">
              Next: About you
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
