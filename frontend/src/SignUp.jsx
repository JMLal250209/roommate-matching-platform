// frontend/src/pages/SignUp.jsx
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Sign up is a placeholder for now.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-6">
      <div className="w-full max-w-md rounded-2xl bg-white/5 p-8 outline outline-1 outline-white/10">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-indigo-400 mb-3">SHRMP</div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-indigo-400 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Full name
            </label>
            <input
              type="text"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              Email address
            </label>
            <input
              type="email"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              type="password"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              Confirm password
            </label>
            <input
              type="password"
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-500 py-2 font-semibold hover:bg-indigo-400"
          >
            Sign up
          </button>

          <button
            type="button"
            onClick={() => alert("Social sign-up placeholder.")}
            className="w-full rounded-md bg-white/5 py-2 font-semibold hover:bg-white/10"
          >
            Continue with Google / GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
