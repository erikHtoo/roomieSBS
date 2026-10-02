import { useState } from "react";
import Navbar from "../components/navbar";
import { supabase } from "../supabaseClient";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    setMessage(error ? "We couldn't update your password. Request a new recovery link and try again." : "Your password has been updated.");
    if (!error) {
      setPassword("");
      setConfirmation("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-4 sm:mx-auto sm:max-w-md mt-10 sm:mt-16 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Change password</h1>
        <p className="text-sm text-slate-600 mt-2 mb-7">Choose a unique password with at least 12 characters.</p>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-800">New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" /></label>
          <label className="block text-sm font-medium text-slate-800">Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" /></label>
          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-60">{submitting ? "Updating…" : "Update password"}</button>
        </form>
        {message && <p role="status" className="text-sm text-slate-700 mt-4">{message}</p>}
      </main>
    </div>
  );
}
