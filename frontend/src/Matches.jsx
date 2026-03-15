// frontend/src/Matches.jsx
import { Link } from "react-router-dom";

export default function Matches() {
  const match = {
    title: "House 2 Match!",
    house: {
      address: "123 Example Street, Dublin 2",
      rent: "€1,850 / month",
      rooms: 3,
    },
    flatmates: ["Alicia", "Patricia", "Emma"],
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-4xl rounded-[32px] border border-gray-300 p-10">
        <div className="rounded-[24px] border border-gray-300 p-10">
          <h1 className="text-4xl font-extrabold mb-8">{match.title}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* House */}
            <div>
              <div className="font-semibold mb-3">House:</div>
              <div className="rounded-2xl border border-gray-300 p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="text-lg font-medium">{match.house.address}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Rent</div>
                  <div className="text-lg font-medium">{match.house.rent}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Number of rooms</div>
                  <div className="text-lg font-medium">{match.house.rooms}</div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium hover:bg-gray-100"
                  onClick={() => alert("Match details placeholder")}
                >
                  View details
                </button>

                <Link
                  to="/"
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium hover:bg-gray-100"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* Flatmates */}
            <div>
              <div className="font-semibold mb-3">Your flatmates</div>
              <div className="rounded-2xl border border-gray-300 p-6 space-y-4">
                {match.flatmates.map((name) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="text-lg font-medium">{name}</div>
                    <button
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
                      onClick={() => alert(`View profile for ${name} (placeholder)`)}
                    >
                      View profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 如果你不想要注释，就别放这一行 */}
          {/* <div className="mt-8 text-sm text-gray-500">Placeholder UI (wireframe-style). Data will be wired later.</div> */}
        </div>
      </div>
    </div>
  );
}