import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { API_BASE_URL } from "./lib/api";
import {
  getUserMatchForProperty,
  getUserPropertyInterests,
  listProperties,
  registerPropertyInterest,
} from "./lib/propertiesApi";

const PER_PAGE = 6;
const FALLBACK_IMAGE = `${API_BASE_URL}/api/images/house_1.jpeg`;

function toCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getImageUrl(property) {
  const imageCandidates = [];

  if (Array.isArray(property?.image_urls)) {
    imageCandidates.push(...property.image_urls);
  }
  if (typeof property?.image === "string") {
    imageCandidates.push(property.image);
  }

  const firstImage = imageCandidates.find((image) => typeof image === "string" && image.trim());
  if (!firstImage) return FALLBACK_IMAGE;

  if (/^https?:\/\//.test(firstImage)) {
    return firstImage;
  }

  const filename = firstImage.split("/").pop();
  if (!filename) {
    return FALLBACK_IMAGE;
  }

  return `${API_BASE_URL}/api/images/${encodeURIComponent(filename)}`;
}

function getMatchSummary(matchInfo) {
  if (!matchInfo) return "";

  if (matchInfo.interestStatus === "matched") {
    return "Matched group formed for this property.";
  }

  const totalInterested = Number(matchInfo.totalInterested) || 0;
  const requiredRoommates = Number(matchInfo.requiredRoommates) || 0;
  if (totalInterested < requiredRoommates) {
    return `Waiting for more students (${totalInterested}/${requiredRoommates} interested).`;
  }

  const otherInterested = Math.max(totalInterested - 1, 0);
  const compatibleCount = Number(matchInfo.compatibleCount) || 0;
  return `${compatibleCount} compatible out of ${otherInterested} other interested students.`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [page, setPage] = useState(0);
  const [showHomesMenu, setShowHomesMenu] = useState(false);
  const homesMenuRef = useRef(null);
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem('house_interests');
    return saved ? JSON.parse(saved) : {};
  });

  const totalPages = Math.ceil(HOUSES.length / PER_PAGE);

  const visibleHouses = useMemo(() => {
    const start = page * PER_PAGE;
    return HOUSES.slice(start, start + PER_PAGE);
  }, [page]);

  const currentAnimal = useMemo(() => {
    const candidate = profile.animalArchetype || assignAnimal(profile);
    return ANIMAL_PROFILES[candidate] ? candidate : "panda";
  }, [profile]);

  const fellowAnimalLabel = useMemo(() => getAnimalLabel(currentAnimal), [currentAnimal]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [propertyRows, interestRows] = await Promise.all([
          listProperties(),
          user?.userId ? getUserPropertyInterests(user.userId) : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        setProperties(propertyRows || []);

        const interestedMap = {};
        for (const item of interestRows || []) {
          if (item?.propertyId) {
            interestedMap[item.propertyId] = true;
          }
        }
        setInterests(interestedMap);

        const interestedPropertyIds = (interestRows || [])
          .map((row) => row?.propertyId)
          .filter(Boolean);

        let nextMatches = {};
        if (user?.userId && interestedPropertyIds.length > 0) {
          const matchEntries = await Promise.all(
            interestedPropertyIds.map(async (propertyId) => {
              try {
                const matchData = await getUserMatchForProperty(user.userId, propertyId);
                return [propertyId, matchData];
              } catch (err) {
                if (err?.code === "SESSION_EXPIRED") {
                  throw err;
                }
                return [propertyId, null];
              }
            })
          );

          nextMatches = Object.fromEntries(
            matchEntries.filter(([, data]) => Boolean(data))
          );
        }

        if (!isMounted) return;
        setMatchByProperty(nextMatches);
      } catch (err) {
        if (!isMounted) return;

        if (err?.code === "SESSION_EXPIRED") {
          signOut("Session expired. Please sign in again.");
          return;
        }

        setError(err?.message || "Failed to load properties.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [signOut, user?.userId]);

  const totalPages = Math.max(1, Math.ceil(properties.length / PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const visibleProperties = useMemo(() => {
    const start = page * PER_PAGE;
    return properties.slice(start, start + PER_PAGE);
  }, [page, properties]);

  async function handleRegisterInterest(property) {
    setActionError("");
    setSubmitting((prev) => ({ ...prev, [property.propertyId]: true }));

    try {
      await registerPropertyInterest(property.propertyId, `${toCurrency(property.rent_per_month)}/month`);
      setInterests((prev) => ({ ...prev, [property.propertyId]: true }));

      if (user?.userId) {
        try {
          const matchData = await getUserMatchForProperty(user.userId, property.propertyId);
          if (matchData) {
            setMatchByProperty((prev) => ({ ...prev, [property.propertyId]: matchData }));
          }
        } catch (matchErr) {
          if (matchErr?.code === "SESSION_EXPIRED") {
            signOut("Session expired. Please sign in again.");
            return;
          }
        }
      }
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        signOut("Session expired. Please sign in again.");
        return;
      }

      setActionError(err?.message || "Unable to register interest.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [property.propertyId]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">SHRMP Listings</p>
            <div ref={homesMenuRef} className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowHomesMenu((open) => !open)}
                className="inline-flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-600 px-5 py-3 text-xl font-bold text-white shadow-md transition hover:bg-emerald-500"
              >
                <span>Student Homes</span>
                <span className={`text-lg transition-transform ${showHomesMenu ? "rotate-180" : ""}`}>▾</span>
              </button>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Click to open views
              </p>

              {showHomesMenu && (
                <div className="absolute left-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => setShowHomesMenu(false)}
                    className="block w-full border-b border-slate-200 bg-emerald-50 px-4 py-2 text-left text-sm font-semibold text-emerald-700"
                  >
                    Student Homes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHomesMenu(false);
                      navigate("/landing/others");
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Other {fellowAnimalLabel}
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-slate-600">Showing 6 houses per page</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/green")}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              🌿 Green Computing
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile/view")}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">Loading properties...</div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {actionError ? (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        {!loading && !error && visibleProperties.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
            No properties are currently available.
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProperties.map((property) => {
            const propertyId = property.propertyId;
            const interested = Boolean(interests[propertyId]);
            const isSubmitting = Boolean(submitting[propertyId]);
            const matchSummary = getMatchSummary(matchByProperty[propertyId]);

            return (
              <article
                key={propertyId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <img
                  src={getImageUrl(property)}
                  alt={`${property.title} cover`}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />

                <div className="space-y-3 p-4">
                  <h2 className="text-lg font-semibold">{property.title}</h2>

                  <div className="text-sm text-slate-700">
                    <p>
                      <span className="font-medium">Rent:</span> {toCurrency(property.rent_per_month)} / month
                    </p>
                    <p>
                      <span className="font-medium">Capacity:</span> {property.required_roommates} roommates
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {property.city}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/properties/${encodeURIComponent(propertyId)}`, {
                        state: { house: property },
                      })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegisterInterest(property)}
                    disabled={interested || isSubmitting}
                    className="mt-1 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {interested
                      ? "Interest Registered"
                      : isSubmitting
                        ? "Registering..."
                        : "Register Interest"}
                  </button>

                  {interested && matchSummary ? (
                    <p className="text-xs text-slate-600">{matchSummary}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
