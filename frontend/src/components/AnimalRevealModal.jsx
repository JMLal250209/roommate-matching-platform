import React, { useState, useEffect, useMemo } from "react";
import { ANIMAL_PROFILES, assignAnimal } from "../utils/animalArchetypes.js";

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
