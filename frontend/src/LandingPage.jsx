import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import {
  getUserPropertyInterests,
  listProperties,
  registerPropertyInterest,
} from "./lib/propertiesApi";

const PER_PAGE = 6;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=1200&q=80";

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
  const firstImage = Array.isArray(property?.image_urls) ? property.image_urls[0] : "";
  if (typeof firstImage === "string" && /^https?:\/\//.test(firstImage)) {
    return firstImage;
  }
  return FALLBACK_IMAGE;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [interests, setInterests] = useState({});
  const [submitting, setSubmitting] = useState({});

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
            <h1 className="text-3xl font-bold">Student Homes</h1>
            <p className="mt-1 text-slate-600">Showing up to 6 houses per page</p>
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
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
