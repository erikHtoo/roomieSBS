import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import { supabase } from "../supabaseClient";
import { isAllowedSchoolEmail, schoolEmailHint } from "../utils/schoolEmail";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isAllowedSchoolEmail(cleanEmail)) {
      setMessage(schoolEmailHint);
      return;
    }
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/change-password`,
    });
    setSubmitting(false);
    setMessage("If an account exists for that email, a recovery link is on its way.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-4 sm:mx-auto sm:max-w-md mt-10 sm:mt-16 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Reset your password</h1>
        <p className="text-sm text-slate-600 mt-2 mb-7">We'll send a recovery link to your email.</p>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
          </label>
          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-60">{submitting ? "Sending…" : "Send recovery link"}</button>
        </form>
        {message && <p role="status" className="text-sm text-slate-700 mt-4">{message}</p>}
        <Link to="/login" className="inline-block mt-7 text-sm text-rose-700 hover:underline">Back to sign in</Link>
      </main>
    </div>
  );
}
