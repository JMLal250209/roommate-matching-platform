// frontend/src/Register.jsx

import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // UI only: don't store anything yet, just go to profile creation
    navigate("/create-profile");
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <div className="flex w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              SHRMP
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-slate-600">
              Register with your email so you can save preferences and matches.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                required
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                type="password"
                required
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500"
            >
              Register
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="font-medium text-emerald-700 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

