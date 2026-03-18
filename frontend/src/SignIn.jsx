import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { consumeAuthMessage } from "./lib/session";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedMessage = consumeAuthMessage();
    if (storedMessage) {
      setNotice(storedMessage);
      return;
    }

    if (location.state?.registered) {
      setNotice("Registration successful. Please sign in.");
    }
  }, [location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      await signIn({ email: email.trim(), password });
      const destination = location.state?.from?.pathname || "/create-profile";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-emerald-600 mb-6">SHRMP</div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {notice ? (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 block w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              First time? Register here!
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-emerald-50 items-center justify-center px-12">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-emerald-700">Welcome back</h1>
          <p className="text-slate-600 leading-relaxed">
            SHRMP is a student housing and roommate matching platform designed to help students
            find both accommodation and compatible roommates.
          </p>
        </div>
      </div>
    </div>
  );
}
