import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import { isAllowedSchoolEmail, schoolEmailHint } from "../utils/schoolEmail";
import GoogleAuthButton from "./GoogleAuthButton.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      setErrorMsg("Enter a name between 2 and 100 characters.");
      return;
    }
    if (!isAllowedSchoolEmail(cleanEmail)) {
      setErrorMsg(schoolEmailHint);
      return;
    }
    if (password.length < 12) {
      setErrorMsg("Use a password with at least 12 characters.");
      return;
    }
    if (!privacyAcknowledged) {
      setErrorMsg("Please confirm that you understand who can see your profile.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } },
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg("We couldn't create your account. Try again or sign in instead.");
      return;
    }
    setSuccessMsg("Check your email to confirm your account.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-4 sm:mx-auto sm:max-w-md mt-10 sm:mt-16 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-rose-600">Student access</p>
        <h1 className="text-2xl font-semibold text-slate-950 mt-2 mb-2">Create your account</h1>
        <p className="text-sm text-slate-600 mb-7">Join the SBS student housing community. {schoolEmailHint}</p>

        <GoogleAuthButton onError={setErrorMsg} label="Sign up with Google" />
        <p className="mt-3 text-xs leading-5 text-slate-500">
          By continuing, you understand that your profile summary may be public; contact details stay behind sign-in.
        </p>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or use email
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
          <label className="block text-sm font-medium text-slate-800">
            Display name
            <input type="text" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Password
            <input type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
            <span className="block mt-1.5 text-xs font-normal text-slate-500">At least 12 characters. A password manager is recommended.</span>
          </label>
          <label className="flex gap-3 text-sm text-slate-600">
            <input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-700 focus:ring-rose-600" />
            <span>I understand that my profile summary may be visible without sign-in; contact details require a verified account.</span>
          </label>
          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-60">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        {errorMsg && <p role="alert" className="text-sm text-red-700 mt-4">{errorMsg}</p>}
        {successMsg && <p role="status" className="text-sm text-emerald-700 mt-4">{successMsg}</p>}
        <p className="text-sm text-slate-600 mt-7">Already registered? <Link to="/login" className="text-rose-700 hover:underline font-medium">Sign in</Link></p>
      </main>
    </div>
  );
}
