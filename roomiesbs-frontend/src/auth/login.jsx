import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import GoogleAuthButton from "./GoogleAuthButton.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("We couldn't sign you in. Check your email and password.");
    } else {
      navigate("/");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-4 sm:mx-auto sm:max-w-md mt-10 sm:mt-16 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-rose-600">Student access</p>
        <h1 className="text-2xl font-semibold text-slate-950 mt-2 mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600 mb-7">
          Sign in to manage your SBS roommate profile and room posts.
        </p>

        <GoogleAuthButton onError={setErrorMsg} label="Continue with Google" />

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or use email
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600"
            />
          </label>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-rose-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {errorMsg && (
          <p role="alert" className="text-sm text-red-700 mt-4">{errorMsg}</p>
        )}

        <p className="text-sm text-slate-600 mt-7">
          New to UniMates?{" "}
          <Link to="/register" className="text-rose-700 hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
