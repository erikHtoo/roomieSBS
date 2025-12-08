import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      console.log("Logged in user:", data.user);

      // fetch the JWT access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("User token:", session?.access_token);

      setErrorMsg("");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Login Card */}
      <div className="mx-4 sm:mx-auto sm:max-w-md md:max-w-lg lg:max-w-xl mt-8 sm:mt-20 bg-white shadow-lg rounded-xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
          Welcome to RoomieSBS!
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
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
            Login
          </button>
        </form>

        {errorMsg && (
          <p className="text-sm text-red-500 mt-4 text-center">{errorMsg}</p>
        )}

        {/* Link to register */}
        <p className="text-sm text-gray-600 mt-6 text-center">
          New to RoomieSBS?{" "}
          <Link
            to="/register"
            className="text-rose-500 hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
