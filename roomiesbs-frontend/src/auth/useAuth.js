import { useContext } from "react";
import { AuthContext } from "./authProvider.js";

// simple hook wrapper
export function useAuth() {
  return useContext(AuthContext);
}
