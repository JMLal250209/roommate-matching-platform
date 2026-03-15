import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../lib/api';
import {
  getProperty,
  getUserMatchForProperty,
  registerPropertyInterest,
} from '../lib/propertiesApi';

const FALLBACK_IMAGE = `${API_BASE_URL}/api/images/house_1.jpeg`;

const DEFAULT_PROPERTY = {
  propertyId: "prop_001",
  title: "Sunlit 4BR Near Campus",
  address: "Trinity College Dublin, College Green, Dublin 2",
  city: "Dublin",
  rent_per_month: 1200,
  required_roommates: 3,
  bedrooms: 4,
  bathrooms: 2,
  description:
    "Spacious 4-bedroom house just minutes from campus. Recently renovated with modern appliances, high-speed fiber internet, and a large backyard perfect for study sessions or weekend hangouts.",
  amenities: ["WiFi", "Laundry", "Air Conditioning", "Furnished", "Dishwasher", "Parking", "Gym"],
  available_from: "2024-09-01",
  pets_allowed: true,
  smoking_allowed: false,
  status: "available",
  images: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
  ],
  landlord: { name: "Sarah Johnson", rating: 4.8, properties: 12, verified: true },
  nearbyPlaces: [
    { name: "Trinity College Dublin", distance: "0.3 mi", time: "6 min walk" },
    { name: "Tesco Express", distance: "0.5 mi", time: "10 min walk" },
  ],
};

const ANIMAL_EMOJI = {
  owl: "🦉", dog: "🐶", cat: "🐱", panda: "🐼",
  wolf: "🐺", turtle: "🐢", fox: "🦊", rabbit: "🐰",
};

const SCORE_LABELS = {
  animalArchetype:  "Personality type",
  cleanliness:      "Cleanliness",
  noise:            "Noise level",
  schedule:         "Sleep schedule",
  socialPreference: "Social vibe",
  interests:        "Shared interests",
  budget:           "Budget overlap",
};

const SCORE_MAX = {
  animalArchetype: 10, cleanliness: 18, noise: 16,
  schedule: 16, socialPreference: 10, interests: 10, budget: 10,
};

function toCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function formatAnimalTag(animalArchetype) {
  if (!animalArchetype) return "🐼 Panda";
  const normalized = String(animalArchetype).toLowerCase();
  const emoji = ANIMAL_EMOJI[normalized] || "🐾";
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `${emoji} ${label}`;
}

function resolveImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) return "";
  if (/^https?:\/\//.test(image)) return image;
  const filename = image.split("/").pop();
  return filename ? `${API_BASE_URL}/api/images/${encodeURIComponent(filename)}` : "";
}

function normalizeProperty(rawProperty, fallback = {}) {
  const source = rawProperty || {};
  const imageUrls = [];
  if (Array.isArray(source.image_urls)) imageUrls.push(...source.image_urls);
  if (Array.isArray(source.images)) imageUrls.push(...source.images);
  if (typeof source.image === "string" && source.image.trim()) imageUrls.push(source.image.trim());

  const cleanImages = [...new Set(imageUrls.filter(Boolean))].map(resolveImageUrl).filter(Boolean);
  const fallbackImages = (Array.isArray(fallback.images) ? fallback.images : DEFAULT_PROPERTY.images)
    .map(resolveImageUrl).filter(Boolean);

  return {
    ...DEFAULT_PROPERTY, ...fallback, ...source,
    amenities: Array.isArray(source.amenities) ? source.amenities : (fallback.amenities || DEFAULT_PROPERTY.amenities),
    images: cleanImages.length > 0 ? cleanImages : (fallbackImages.length > 0 ? fallbackImages : [FALLBACK_IMAGE]),
    rent_per_month: Number(source.rent_per_month ?? fallback.rent_per_month ?? DEFAULT_PROPERTY.rent_per_month),
    required_roommates: Number(source.required_roommates ?? fallback.required_roommates ?? DEFAULT_PROPERTY.required_roommates),
    nearbyPlaces: source.nearbyPlaces || fallback.nearbyPlaces || DEFAULT_PROPERTY.nearbyPlaces,
    landlord: source.landlord || fallback.landlord || DEFAULT_PROPERTY.landlord,
  };
}

// ── Fetch potential matches (no prior interest needed) ─────────────────────
async function getPotentialMatches(propertyId) {
  const res = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/potential-matches`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load potential matches");
  const json = await res.json();
  return json.data;
}

// ── Score breakdown bar ────────────────────────────────────────────────────
function ScoreBar({ label, score, maxScore }) {
  const pct = Math.round((score / maxScore) * 100);
  const colour = pct >= 80 ? "#059669" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: colour }}>{score.toFixed(0)}/{maxScore}</span>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: colour, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Single match card ──────────────────────────────────────────────────────
function MatchCard({ match, index, isExpanded, onToggle }) {
  const score = match.compatibility_score;
  const breakdown = match.scoreBreakdown || {};
  const scoreColour = score >= 80 ? "#059669" : score >= 60 ? "#f59e0b" : "#ef4444";
  const gradients = [
    ["#ff6b6b", "#ff8787"], ["#4ecdc4", "#5ee7df"], ["#45b7d1", "#5bc8de"],
    ["#a78bfa", "#c4b5fd"], ["#fb923c", "#fdba74"],
  ];
  const [g1, g2] = gradients[index % gradients.length];

  return (
    <div style={{
      background: "rgba(255,255,255,0.13)",
      backdropFilter: "blur(10px)",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.2)",
      overflow: "hidden",
      transition: "all 0.2s ease",
    }}>
      {/* Collapsed row */}
      <div
        onClick={onToggle}
        style={{
          padding: "18px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "white",
          }}>
            {match.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{match.name}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {match.course || "Course N/A"}{match.year ? ` • ${match.year}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Animal pill */}
          <div style={{
            background: "rgba(255,255,255,0.25)", padding: "6px 14px",
            borderRadius: 20, fontSize: 13, fontWeight: 600,
          }}>
            {formatAnimalTag(match.animal_archetype)}
          </div>
          {/* Score badge */}
          <div style={{
            background: scoreColour, color: "white", borderRadius: 20,
            padding: "6px 14px", fontSize: 14, fontWeight: 700, minWidth: 52, textAlign: "center",
          }}>
            {score}%
          </div>
          {/* Chevron */}
          <span style={{ fontSize: 12, opacity: 0.7, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </div>
      </div>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div style={{
          padding: "0 20px 20px",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: 16,
        }}>
          {/* Shared interests */}
          {Array.isArray(match.interests) && match.interests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Shared interests
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {match.interests.map((interest) => (
                  <span key={interest} style={{
                    background: "rgba(255,255,255,0.2)", padding: "4px 10px",
                    borderRadius: 20, fontSize: 12, fontWeight: 500,
                  }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Score bars */}
          <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
              Compatibility breakdown
            </div>
            {Object.entries(SCORE_LABELS).map(([key, label]) =>
              breakdown[key] != null ? (
                <ScoreBar key={key} label={label} score={breakdown[key]} maxScore={SCORE_MAX[key]} />
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PropertyDetails() {
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();
  const { state }  = useLocation();
  const { propertyId } = useParams();
  const house = state?.house;
  const resolvedPropertyId = propertyId || house?.propertyId || house?.id || "";

  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [property, setProperty]         = useState(() => normalizeProperty(house || {}));
  const [potentialData, setPotentialData] = useState(null);   // before interest
  const [matchData, setMatchData]         = useState(null);   // after interest
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(Boolean(resolvedPropertyId));
  const [loadingMatches, setLoadingMatches]   = useState(false);
  const [loadError, setLoadError]     = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  // Load property details
  useEffect(() => {
    let mounted = true;
    if (!resolvedPropertyId) { setLoadingProperty(false); return; }
    setLoadingProperty(true);
    getProperty(resolvedPropertyId)
      .then((fetched) => {
        if (!mounted || !fetched) return;
        setProperty((cur) => normalizeProperty(fetched, cur));
      })
      .catch((err) => {
        if (!mounted) return;
        if (err?.code === "SESSION_EXPIRED") { signOut("Session expired."); return; }
        setLoadError(err?.message || "Unable to load property details.");
      })
      .finally(() => { if (mounted) setLoadingProperty(false); });
    return () => { mounted = false; };
  }, [resolvedPropertyId, signOut]);

  // Load potential matches (shown before registering interest)
  useEffect(() => {
    let mounted = true;
    if (!user?.userId || !resolvedPropertyId) return;
    setLoadingMatches(true);

    // Try confirmed matches first (user may have already registered)
    getUserMatchForProperty(user.userId, resolvedPropertyId)
      .then((data) => {
        if (!mounted) return;
        setMatchData(data);
        setIsInterested(true);
        setLoadingMatches(false);
      })
      .catch(() => {
        // Not registered yet — load potential matches instead
        if (!mounted) return;
        getPotentialMatches(resolvedPropertyId)
          .then((data) => { if (mounted) setPotentialData(data); })
          .catch(() => {})
          .finally(() => { if (mounted) setLoadingMatches(false); });
      });

    return () => { mounted = false; };
  }, [resolvedPropertyId, user?.userId, signOut]);

  // Decide which match list to render
  const activeMatches = isInterested
    ? (matchData?.matches?.compatible || []).map((m) => ({
        name:                m.name,
        animal_archetype:    m.animal_archetype,
        compatibility_score: m.compatibility_score,
        scoreBreakdown:      m.scoreBreakdown || {},
        course:              m.course || "",
        year:                m.year || "",
        interests:           m.interests || [],
      }))
    : (potentialData?.potentialMatches || []);

  const compatibleCount = isInterested
    ? (matchData?.compatibleCount ?? activeMatches.length)
    : (potentialData?.compatibleCount ?? 0);

  const totalInterested = isInterested
    ? (matchData?.totalInterested ?? 0)
    : (potentialData?.totalInterested ?? 0);

  const matchSectionTitle = isInterested ? "Your Roommate Matches" : "People Already Interested";
  const matchSectionSubtitle = loadingMatches
    ? "Checking compatibility..."
    : isInterested
      ? `You have ${compatibleCount} compatible match${compatibleCount !== 1 ? "es" : ""} for this property.`
      : totalInterested === 0
        ? "No one else has registered interest yet. Be the first!"
        : `${compatibleCount} of ${totalInterested} interested student${totalInterested !== 1 ? "s" : ""} are compatible with you.`;

  const handleRegisterInterest = async () => {
    if (!resolvedPropertyId || isInterested || submittingInterest) return;
    setActionError("");
    setSubmittingInterest(true);
    try {
      await registerPropertyInterest(resolvedPropertyId, `${toCurrency(property.rent_per_month)}/month`);
      setIsInterested(true);
      if (user?.userId) {
        const refreshed = await getUserMatchForProperty(user.userId, resolvedPropertyId);
        setMatchData(refreshed);
        setPotentialData(null);
      }
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") { signOut("Session expired."); return; }
      setActionError(err?.message || "Unable to register interest.");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const amenityIcons = {
    "WiFi": "📶", "Laundry": "🧺", "Washing Machine": "🧺",
    "Air Conditioning": "❄️", "Furnished": "🛋️", "Dishwasher": "🍽️",
    "Microwave": "📻", "Coffee Maker": "☕", "Backyard": "🌳",
    "Garden / outdoor space": "🌳", "Bike Storage": "🚲",
    "Study Room": "📚", "Parking": "🚗", "Gym": "💪",
    "Ensuite bathroom": "🚿", "Bills included": "💡",
    "Near campus": "🎓", "Near public transport": "🚌",
    "Accessible / step-free": "♿", "Quiet area": "🤫", "Heating": "🔥",
    "Balcony": "🪟",
  };

  const displayAmenities = property.amenities.map((a) => ({ name: a, icon: amenityIcons[a] || "✓" }));
  const primaryImage = (property.images?.[0]) || FALLBACK_IMAGE;
  const availableFromLabel = property.available_from
    ? new Date(property.available_from).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
    : "TBA";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Outfit', -apple-system, sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>Amazon SHRMP</h1>
          <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", border: "2px solid #059669", cursor: "pointer" }}>
            <img src="https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=100&h=100&fit=crop" alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* ── Inline alerts ── */}
      {(loadingProperty || loadError || actionError) && (
        <div style={{ maxWidth: 1400, margin: "16px auto 0", padding: "0 40px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loadingProperty && <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#475569" }}>Loading property details...</div>}
          {loadError    && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#be123c" }}>{loadError}</div>}
          {actionError  && <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#be123c" }}>{actionError}</div>}
        </div>
      )}

      {/* ── Hero image ── */}
      <div style={{ background: "white", boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px" }}>
          <button onClick={() => navigate("/landing")} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "#475569", cursor: "pointer", marginBottom: 30, padding: "8px 16px 8px 8px", borderRadius: 20, transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.transform = "translateX(-4px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.transform = "translateX(0)"; }}>
            <span style={{ fontSize: 20 }}>←</span> Back to listings
          </button>
          <div style={{ height: 520, borderRadius: 16, overflow: "hidden" }}>
            <img src={primaryImage} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
          </div>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px", display: "grid", gridTemplateColumns: "1fr 400px", gap: 40 }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Property header */}
          <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.5px" }}>{property.title}</h1>
                <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>📍 {property.address}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, padding: "24px 0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
              {[{ label: "Bedrooms", value: property.bedrooms, icon: "🛏️" }, { label: "Bathrooms", value: property.bathrooms, icon: "🚿" }, { label: "Roommates", value: property.required_roommates, icon: "👥" }].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { cond: property.pets_allowed, yes: "🐕 Pets Allowed", no: "🚫 No Pets", yesColour: ["#d3f9d8","#2b8a3e"], noColour: ["#ffe8cc","#e67700"] },
                { cond: property.smoking_allowed, yes: "🚬 Smoking Allowed", no: "🚭 No Smoking", yesColour: ["#ffe8cc","#e67700"], noColour: ["#d3f9d8","#2b8a3e"] },
              ].map(({ cond, yes, no, yesColour, noColour }, i) => {
                const [bg, fg] = cond ? yesColour : noColour;
                return <div key={i} style={{ background: bg, color: fg, padding: "10px 20px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>{cond ? yes : no}</div>;
              })}
            </div>

            <div style={{ paddingTop: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>About this place</h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#475569", margin: 0 }}>{property.description}</p>
            </div>
          </div>

          {/* ── Matches section ── */}
          <div style={{
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            padding: 40, borderRadius: 16, color: "white",
            boxShadow: "0 8px 24px rgba(5,150,105,0.3)", position: "relative", overflow: "hidden",
          }}>
            {/* Decorative blur */}
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{matchSectionTitle}</h2>
              </div>

              {/* Badge row */}
              {totalInterested > 0 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>
                    👥 {totalInterested} interested
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>
                    ✅ {compatibleCount} compatible with you
                  </div>
                </div>
              )}

              <p style={{ fontSize: 15, opacity: 0.95, marginBottom: 28, lineHeight: 1.6 }}>{matchSectionSubtitle}</p>

              {/* Match cards */}
              {activeMatches.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeMatches.map((match, idx) => (
                    <MatchCard
                      key={idx}
                      match={match}
                      index={idx}
                      isExpanded={expandedMatch === idx}
                      onToggle={() => setExpandedMatch(expandedMatch === idx ? null : idx)}
                    />
                  ))}
                </div>
              ) : !loadingMatches && totalInterested === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "24px", textAlign: "center", opacity: 0.9 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Be the first to register interest!</div>
                  <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>Once others join, you'll see how compatible you are.</div>
                </div>
              ) : null}

              {/* CTA nudge when not yet interested */}
              {!isInterested && totalInterested > 0 && (
                <div style={{ marginTop: 20, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "16px 20px", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span>Register interest to confirm your spot and let these matches know you're in.</span>
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>Amenities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {displayAmenities.slice(0, showAllAmenities ? undefined : 8).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "#f8fafc", borderRadius: 10, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.transform = "translateX(0)"; }}>
                  <span style={{ fontSize: 24 }}>{a.icon}</span>
                  <span style={{ fontSize: 16, color: "#475569", fontWeight: 500 }}>{a.name}</span>
                </div>
              ))}
            </div>
            {displayAmenities.length > 8 && (
              <button onClick={() => setShowAllAmenities(!showAllAmenities)} style={{ marginTop: 20, background: "none", border: "2px solid #e2e8f0", padding: "12px 24px", borderRadius: 8, fontSize: 15, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                {showAllAmenities ? "Show Less" : `Show All ${displayAmenities.length} Amenities`}
              </button>
            )}
          </div>

          {/* Nearby */}
          <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>Nearby</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {property.nearbyPlaces.map((place, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, background: "#f8fafc", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{place.name}</div>
                    <div style={{ fontSize: 14, color: "#64748b" }}>{place.distance} • {place.time}</div>
                  </div>
                  <div style={{ background: "#059669", color: "white", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Directions</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column — booking card ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", position: "sticky", top: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: "#0f172a", letterSpacing: -1 }}>
                {toCurrency(property.rent_per_month)}<span style={{ fontSize: 18, fontWeight: 500, color: "#64748b" }}> / month</span>
              </span>
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Available From</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{availableFromLabel}</div>
            </div>

            {/* Compatibility teaser in booking card */}
            {!isInterested && compatibleCount > 0 && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🤝</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#065f46" }}>{compatibleCount} compatible student{compatibleCount !== 1 ? "s" : ""} interested</div>
                  <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>Register to confirm your match</div>
                </div>
              </div>
            )}

            <button
              onClick={handleRegisterInterest}
              disabled={isInterested || submittingInterest}
              style={{
                width: "100%",
                background: isInterested ? "#dcfce7" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: isInterested ? "#065f46" : "white",
                border: isInterested ? "2px solid #059669" : "none",
                padding: 18, borderRadius: 12, fontSize: 17, fontWeight: 700,
                cursor: isInterested || submittingInterest ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                opacity: submittingInterest ? 0.8 : 1,
              }}>
              {isInterested ? "Interest Registered ✓" : submittingInterest ? "Registering..." : "Register Interest"}
            </button>
          </div>

          {/* Landlord */}
          <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 20 }}>Hosted by</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "white" }}>
                {property.landlord.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  {property.landlord.name}
                  {property.landlord.verified && (
                    <span style={{ background: "#20c997", color: "white", fontSize: 12, padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>✓ Verified</span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>⭐ {property.landlord.rating} • {property.landlord.properties} properties</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}
