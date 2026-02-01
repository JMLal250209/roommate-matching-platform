import ShrimpLogo from "./assets/shrimp-logo.svg?react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      {/* 左侧：登录表单 */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="flex flex-col items-center">
            <ShrimpLogo className="h-12 w-auto text-indigo-500 mb-6" />
            <h2 className="text-2xl font-bold tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Not a member?{" "}
              <span className="text-indigo-400 cursor-pointer hover:underline">
                Start a 14 day free trial
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6">
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
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-200">
                  Password
                </label>
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
                <span className="bg-gray-900 px-2 text-gray-400">
                  Or continue with
                </span>
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

      {/* 右侧：Welcome Back 介绍 */}
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
