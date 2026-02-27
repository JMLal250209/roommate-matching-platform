import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "./context/ProfileContext.jsx";
import {
  ANIMAL_PROFILES,
  assignAnimal,
  getAnimalLabel,
} from "./utils/animalArchetypes.js";

const HOUSES = [
  {
    id: 1,
    title: "Riverside Commons",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    rent: "$980 / month",
    people: "3 people",
    location: "Dublin 4",
  },
  {
    id: 2,
    title: "Maple Street Loft",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,150 / month",
    people: "2 people",
    location: "Dublin 2",
  },
  {
    id: 3,
    title: "Willow Court",
    image:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    rent: "$870 / month",
    people: "4 people",
    location: "Ranelagh",
  },
  {
    id: 4,
    title: "Canal Side House",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,050 / month",
    people: "3 people",
    location: "Portobello",
  },
  {
    id: 5,
    title: "Oakview Residence",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    rent: "$930 / month",
    people: "2 people",
    location: "Drumcondra",
  },
  {
    id: 6,
    title: "Ivy Lane",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,220 / month",
    people: "4 people",
    location: "Smithfield",
  },
  {
    id: 7,
    title: "Cityview Terrace",
    image:
      "https://images.unsplash.com/photo-1600566752227-8f8f0a7be1a7?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,080 / month",
    people: "3 people",
    location: "Ballsbridge",
  },
  {
    id: 8,
    title: "Harbor Point",
    image:
      "https://images.unsplash.com/photo-1560185009-5bf9f2849488?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,300 / month",
    people: "2 people",
    location: "Docklands",
  },
  {
    id: 9,
    title: "Elm Green",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    rent: "$910 / month",
    people: "4 people",
    location: "Phibsborough",
  },
  {
    id: 10,
    title: "Seabreeze House",
    image:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
    rent: "$1,180 / month",
    people: "3 people",
    location: "Clontarf",
  },
];

const PER_PAGE = 6;

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
    localStorage.setItem('house_interests', JSON.stringify(interests));
  }, [interests]);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!showHomesMenu) return;
      if (homesMenuRef.current && !homesMenuRef.current.contains(event.target)) {
        setShowHomesMenu(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [showHomesMenu]);

  const handleRegisterInterest = (houseId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking button
    setInterests((prev) => ({ ...prev, [houseId]: !prev[houseId] }));
  };

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

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleHouses.map((house) => {
            const interested = Boolean(interests[house.id]);

            return (
              <article
                key={house.id}
                onClick={() => navigate('/house1/details', { state: { house } })}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer"
              >
                <img
                  src={house.image}
                  alt={`${house.title} cover`}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />

                <div className="space-y-3 p-4">
                  <h2 className="text-lg font-semibold">{house.title}</h2>

                  <div className="text-sm text-slate-700">
                    <p>
                      <span className="font-medium">Rent:</span> {house.rent}
                    </p>
                    <p>
                      <span className="font-medium">Capacity:</span> {house.people}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {house.location}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRegisterInterest(house.id, e)}
                    className={`mt-1 w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      interested
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {interested ? "Interest Registered ✓" : "Register Interest"}
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
