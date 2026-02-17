// frontend/src/SignIn.jsx

import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    // For now, just redirect to create profile page
    // Later you can add real authentication here
    navigate("/create-profile");
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* Left: sign-in form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="flex flex-col items-center">
            {/* Temporary text logo */}
            <div className="text-3xl font-bold text-emerald-600 mb-6">
              SHRMP
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              Sign in to your account
            </h2>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <span className="text-sm text-emerald-600 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500"
            >
              Sign in
            </button>
          </form>

          {/* First-time registration link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              First time? Register here!
            </button>
          </div>

          {/* Third-party login (UI only) */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center rounded-md border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                Google
              </button>
              <button className="flex items-center justify-center rounded-md border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: marketing copy */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-50 items-center justify-center px-12">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-emerald-700">
            Welcome back 👋
          </h1>
          <p className="text-slate-600 leading-relaxed">
            SHRMP is a student housing and roommate matching platform designed
            to help students find both accommodation and compatible roommates.
            <br /><br />
            By using intelligent matching based on lifestyle preferences,
            academic schedules, and personal interests, SHRMP makes shared
            living simpler, smarter, and more comfortable.
          </p>
        </div>
      </div>
    </div>
  );
}
