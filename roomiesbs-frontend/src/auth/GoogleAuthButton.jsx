import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../supabaseClient";
import { schoolEmailDomains } from "../utils/schoolEmail";

export default function GoogleAuthButton({ label = "Continue with Google", onError }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    onError?.("");

    const queryParams = { prompt: "select_account" };
    if (schoolEmailDomains.length === 1) {
      queryParams.hd = schoolEmailDomains[0];
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams,
      },
    });

    if (error) {
      onError?.("Google sign-in is temporarily unavailable. Try email instead.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
    >
      <FcGoogle aria-hidden="true" size={20} />
      {loading ? "Opening Google…" : label}
    </button>
  );
}
