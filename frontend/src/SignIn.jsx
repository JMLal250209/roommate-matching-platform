<<<<<<< HEAD
import { useState } from "react";
import { Amplify } from "aws-amplify";
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

/*
  Configure Amplify with your Cognito details
*/
Amplify.configure({
  Auth: {
    Cognito: {
      region: "eu-west-1",
      userPoolId: "eu-west-1_VD22hpVPA",
      userPoolClientId: "6blkd9ld1fb05ulmj8p8s5g9tb",
    },
  },
});

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /*
    Handles login:
    1. Sign in with Cognito
    2. Get JWT token
    3. Send token to backend
  */
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // If a user is already signed in, sign them out first
    await signOut();

    // Sign in with Cognito
    await signIn({
      username: email,
      password: password,
    });

    // Get JWT token
    const session = await fetchAuthSession();
    const idToken = session.tokens.idToken.toString();

    localStorage.setItem("id_token", idToken);

    // Call backend
    const response = await fetch("http://localhost:5000/api/me/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    alert("Login successful!");

  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed.");
  }
};

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      {/* Left side: Sign-in form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-indigo-400 mb-6">
              SHRMP
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              Sign in to your account
            </h2>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-500 py-2 font-semibold hover:bg-indigo-400"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>

      {/* Right side: Welcome message */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-800 items-center justify-center px-12">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">
            Welcome back 👋
          </h1>
          <p className="text-gray-300 leading-relaxed">
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
=======
export default function SignIn({ onSignIn }) {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (onSignIn) {
      onSignIn();
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-indigo-400 mb-6">SHRMP</div>

            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-200">Email address</label>
              <input
                type="email"
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-200">Password</label>
                <span className="text-sm text-indigo-400 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-1 outline-white/10 focus:outline-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-500 py-2 font-semibold hover:bg-indigo-400"
            >
              Sign in
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center rounded-md bg-white/5 py-2 hover:bg-white/10">
                Google
              </button>
              <button className="flex items-center justify-center rounded-md bg-white/5 py-2 hover:bg-white/10">
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gray-800 items-center justify-center px-12">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Welcome back</h1>
          <p className="text-gray-300 leading-relaxed">
            SHRMP is a student housing and roommate matching platform designed to help students
            find both accommodation and compatible roommates.
            <br />
            <br />
            By using intelligent matching based on lifestyle preferences, academic schedules,
            and personal interests, SHRMP makes shared living simpler, smarter, and more
            comfortable.
          </p>
        </div>
      </div>
    </div>
  );
}
>>>>>>> origin/main
