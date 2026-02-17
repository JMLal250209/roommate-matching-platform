import { useMemo, useState } from "react";

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

export default function LandingPage({ onSelectProperty }) {
  const [page, setPage] = useState(0);
  const [interests, setInterests] = useState({});

  const totalPages = Math.ceil(HOUSES.length / PER_PAGE);

  const visibleHouses = useMemo(() => {
    const start = page * PER_PAGE;
    return HOUSES.slice(start, start + PER_PAGE);
  }, [page]);

  const handleRegisterInterest = (houseId) => {
    setInterests((prev) => ({ ...prev, [houseId]: true }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">SHRMP Listings</p>
            <h1 className="text-3xl font-bold">Student Homes</h1>
            <p className="mt-1 text-slate-600">Showing 6 houses per page</p>
          </div>

          <div className="flex items-center gap-3">
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
                onClick={onSelectProperty}
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
                    onClick={() => handleRegisterInterest(house.id)}
                    disabled={interested}
                    className="mt-1 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {interested ? "Interest Registered" : "Register Interest"}
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
