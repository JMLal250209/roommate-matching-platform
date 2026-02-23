import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext.jsx";
import ProgressHeader from "../components/ProgressHeader.jsx";
import PillSelect from "../components/PillSelect.jsx";
import TagPicker from "../components/TagPicker.jsx";

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
  const { profile, setHousing } = useProfile();

  const [budgetMin, setBudgetMin] = useState(profile.budgetMin ?? 400);
  const [budgetMax, setBudgetMax] = useState(profile.budgetMax ?? 900);
  const [moveIn, setMoveIn] = useState(profile.moveIn ?? "flexible");
  const [roomType, setRoomType] = useState(profile.roomType ?? "any");
  const [area, setArea] = useState(profile.area ?? "either");
  const [leaseMonths, setLeaseMonths] = useState(profile.leaseMonths ?? 9);
  const [amenities, setAmenities] = useState(profile.amenities ?? []);
  const [notes, setNotes] = useState(profile.notes ?? "");

  useEffect(() => {
    setBudgetMin(profile.budgetMin ?? 400);
    setBudgetMax(profile.budgetMax ?? 900);
    setMoveIn(profile.moveIn ?? "flexible");
    setRoomType(profile.roomType ?? "any");
    setArea(profile.area ?? "either");
    setLeaseMonths(profile.leaseMonths ?? 9);
    setAmenities(profile.amenities ?? []);
    setNotes(profile.notes ?? "");
  }, [profile.budgetMin, profile.budgetMax, profile.moveIn, profile.roomType, profile.area, profile.leaseMonths, profile.amenities, profile.notes]);

  function onNext(e) {
    e.preventDefault();
    // UI only: no validation required yet, but basic sanity helps UX
    if (Number(budgetMin) > Number(budgetMax)) {
      alert("Your minimum budget can’t be higher than your maximum budget.");
      return;
    }
    setHousing({
      budgetMin,
      budgetMax,
      moveIn,
      roomType,
      area,
      leaseMonths,
      amenities,
      notes,
    });
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
          <div className="grid2">
            <div className="field">
              <label>Budget range (€/month)</label>
              <div className="row">
                <input
                  className="input"
                  style={{ maxWidth: 140 }}
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
                <span style={{ opacity: 0.7 }}>to</span>
                <input
                  className="input"
                  style={{ maxWidth: 140 }}
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
              <div className="help">Helps filter listings that fit you.</div>
            </div>

            <div className="field">
              <label>Preferred move-in</label>
              <PillSelect
                ariaLabel="Preferred move-in time"
                options={MOVE_IN}
                value={moveIn}
                onChange={setMoveIn}
              />
            </div>

            <div className="field">
              <label>Room type</label>
              <PillSelect
                ariaLabel="Room type preference"
                options={ROOM_TYPES}
                value={roomType}
                onChange={setRoomType}
              />
            </div>

            <div className="field">
              <label>Area</label>
              <PillSelect
                ariaLabel="Area preference"
                options={AREA}
                value={area}
                onChange={setArea}
              />
            </div>

            <div className="field">
              <label>Lease length (months)</label>
              <input
                className="input"
                type="number"
                min="1"
                max="24"
                value={leaseMonths}
                onChange={(e) => setLeaseMonths(Number(e.target.value))}
              />
              <div className="help">Typical student leases: 6–12 months.</div>
            </div>

            <div className="field">
              <label>Dealbreakers (optional)</label>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. near Luas, guests ok, no basement rooms…"
              />
              <div className="help">One sentence is plenty.</div>
            </div>
          </div>

          <div className="sectionTitle">Amenities you care about</div>
          <TagPicker value={amenities} onChange={setAmenities} suggested={AMENITIES} />

          <div className="btnBar" style={{ marginTop: 18 }}>
            <button type="button" className="btn btnGhost" onClick={() => nav("/")}>
              Back
            </button>
            <button type="submit" className="btn btnPrimary">
              Next: About you →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}