import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "process.env.REACT_APP_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL || "",
      ),
      "process.env.REACT_APP_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY || "",
      ),
      "process.env.REACT_APP_API_URL": JSON.stringify(
        env.VITE_API_URL || env.REACT_APP_API_URL || "",
      ),
      "process.env.REACT_APP_ALLOWED_EMAIL_DOMAINS": JSON.stringify(
        env.VITE_ALLOWED_EMAIL_DOMAINS ||
          env.REACT_APP_ALLOWED_EMAIL_DOMAINS ||
          "",
      ),
    },
    build: {
      sourcemap: false,
    },
  };
});
