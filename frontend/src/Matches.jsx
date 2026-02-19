// frontend/src/pages/Matches.jsx
import { Link } from "react-router-dom";

export default function Matches() {
  const houses = [
    { id: 1, name: "House 1", address: "Address placeholder" },
    { id: 2, name: "House 2", address: "Address placeholder" },
    { id: 3, name: "House 3", address: "Address placeholder" },
    { id: 4, name: "House 4", address: "Address placeholder" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Your Houses & Matches
        </h1>

        <p className="text-gray-300 mb-6">
          This page shows a summary of all houses and matches.
          (Placeholder UI for now)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {houses.map((house) => (
            <div
              key={house.id}
              className="rounded-xl bg-white/5 border border-white/10 p-5"
            >
              <div className="text-lg font-semibold">
                {house.name}
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {house.address}
              </div>

              <div className="mt-4">
                <button
                  className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400"
                  onClick={() => alert("Match details placeholder")}
                >
                  View match
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="text-indigo-400 hover:underline text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
