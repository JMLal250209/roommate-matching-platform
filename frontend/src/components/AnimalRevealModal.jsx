import React, { useState, useEffect, useMemo } from "react";

const ANIMAL_PROFILES = {
  owl:    { emoji: "\u{1F989}", label: "Owl",    description: "Late schedule, quiet, tidy",            traits: { schedule: "late",     noise: "quiet",    clean: "tidy",   social: "low" } },
  dog:    { emoji: "\u{1F415}", label: "Dog",    description: "Social, flexible schedule, medium tidy", traits: { schedule: "flexible", noise: "moderate", clean: "medium", social: "high" } },
  cat:    { emoji: "\u{1F431}", label: "Cat",    description: "Quiet, independent, tidy",              traits: { schedule: "flexible", noise: "quiet",    clean: "tidy",   social: "medium" } },
  panda:  { emoji: "\u{1F43C}", label: "Panda",  description: "Flexible, calm, low conflict",          traits: { schedule: "flexible", noise: "quiet",    clean: "medium", social: "medium" } },
  wolf:   { emoji: "\u{1F43A}", label: "Wolf",   description: "Social, group-oriented, energetic",     traits: { schedule: "flexible", noise: "loud",     clean: "medium", social: "high" } },
  turtle: { emoji: "\u{1F422}", label: "Turtle", description: "Early riser, quiet, routine-based",     traits: { schedule: "early",    noise: "quiet",    clean: "tidy",   social: "low" } },
  fox:    { emoji: "\u{1F98A}", label: "Fox",    description: "Adaptable, medium social",              traits: { schedule: "flexible", noise: "moderate", clean: "medium", social: "medium" } },
  rabbit: { emoji: "\u{1F430}", label: "Rabbit", description: "Quiet, clean, low-noise",               traits: { schedule: "early",    noise: "quiet",    clean: "tidy",   social: "low" } },
};

const NOISE_NUM = { quiet: 0, moderate: 1, loud: 2 };
const CLEAN_NUM = { messy: 0, medium: 1, tidy: 2 };
const SOCIAL_NUM = { low: 0, medium: 1, high: 2 };

function mapProfileTraits(profile) {
  // Map frontend schedule values to algorithm values
  const scheduleMap = { early: "early", normal: "flexible", late: "late" };
  const schedule = scheduleMap[profile.schedule] || "flexible";

  // Map studySocial to social level
  const socialMap = { mostly_study: "low", balanced: "medium", often_out: "high" };
  const social = socialMap[profile.studySocial] || "medium";

  // Map cleanliness
  const cleanMap = { very_clean: "tidy", average: "medium", casual: "messy" };
  const clean = cleanMap[profile.cleanliness] || "medium";

  // Derive noise from social + cleanliness (mirrors backend logic)
  let noise;
  if (social === "high") noise = "loud";
  else if (social === "low" || clean === "tidy") noise = "quiet";
  else noise = "moderate";

  return { schedule, noise, clean, social };
}

function assignAnimal(profile) {
  const user = mapProfileTraits(profile);
  const scores = {};

  for (const [animal, data] of Object.entries(ANIMAL_PROFILES)) {
    let score = 0;
    const t = data.traits;

    // Schedule (max 3)
    if (t.schedule === user.schedule) score += 3;
    else if (t.schedule === "flexible" || user.schedule === "flexible") score += 1;

    // Noise (max 2)
    if (t.noise === user.noise) score += 2;
    else if (Math.abs((NOISE_NUM[t.noise] ?? 1) - (NOISE_NUM[user.noise] ?? 1)) === 1) score += 1;

    // Cleanliness (max 2)
    if (t.clean === user.clean) score += 2;
    else if (Math.abs((CLEAN_NUM[t.clean] ?? 1) - (CLEAN_NUM[user.clean] ?? 1)) === 1) score += 1;

    // Social (max 2)
    if (t.social === user.social) score += 2;
    else if (Math.abs((SOCIAL_NUM[t.social] ?? 1) - (SOCIAL_NUM[user.social] ?? 1)) === 1) score += 1;

    scores[animal] = score;
  }

  return Object.entries(scores).reduce((best, [animal, score]) =>
    score > best[1] ? [animal, score] : best
  , ["panda", -1])[0];
}

const PHASES = [
  { key: "calculating", text: "Consulting the animal council...", duration: 1500 },
  { key: "finalising",  text: "Feeding your animal a snack...",  duration: 2000 },
  { key: "reveal",      text: "",                           duration: 0 },
];

export default function AnimalRevealModal({ profile, onClose }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const animal = useMemo(() => assignAnimal(profile), [profile]);
  const animalData = ANIMAL_PROFILES[animal];

  useEffect(() => {
    if (phaseIndex >= PHASES.length - 1) return;
    const timer = setTimeout(() => setPhaseIndex((i) => i + 1), PHASES[phaseIndex].duration);
    return () => clearTimeout(timer);
  }, [phaseIndex]);

  const phase = PHASES[phaseIndex];
  const isReveal = phase.key === "reveal";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <style>{`
        @keyframes animalSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes animalPop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes animalFadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "48px 40px",
        maxWidth: "400px",
        width: "100%",
        margin: "20px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        {!isReveal ? (
          <>
            {/* Spinner */}
            <div style={{
              width: 56,
              height: 56,
              border: "4px solid rgba(5,150,105,0.2)",
              borderTopColor: "#059669",
              borderRadius: "50%",
              margin: "0 auto 24px",
              animation: "animalSpin 0.8s linear infinite",
            }} />
            <p style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1F2933",
              margin: 0,
            }}>
              {phase.text}
            </p>
          </>
        ) : (
          <>
            {/* Animal emoji */}
            <div style={{
              fontSize: "80px",
              lineHeight: 1,
              marginBottom: "16px",
              animation: "animalPop 0.5s ease-out",
            }}>
              {animalData.emoji}
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#1F2933",
              margin: "0 0 8px",
              animation: "animalFadeUp 0.4s ease-out 0.2s both",
            }}>
              You are a {animalData.label}!
            </h2>

            {/* Description */}
            <p style={{
              fontSize: "15px",
              color: "#64748b",
              margin: "0 0 32px",
              lineHeight: 1.5,
              animation: "animalFadeUp 0.4s ease-out 0.35s both",
            }}>
              {animalData.description}
            </p>

            {/* Continue button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "white",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5,150,105,0.35)",
                animation: "animalFadeUp 0.4s ease-out 0.45s both",
              }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
