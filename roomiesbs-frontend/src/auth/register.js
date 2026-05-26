import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        setErrorMsg("This email is already registered.");
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    setSuccessMsg("Check your email to confirm your account!");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="mx-4 sm:mx-auto sm:max-w-md md:max-w-lg lg:max-w-xl mt-8 sm:mt-20 bg-white shadow-lg rounded-xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
          Register
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-2 rounded-lg font-semibold hover:bg-rose-600 transition"
          >
            Register
          </button>
        </form>

        {errorMsg && (
          <p className="text-sm text-red-500 mt-4 text-center">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-sm text-green-600 mt-4 text-center">
            {successMsg}
          </p>
        )}

        {/* Link to login */}
        <p className="text-sm text-gray-600 mt-6 text-center">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-rose-500 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
