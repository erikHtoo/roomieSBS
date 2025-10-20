import { useContext } from "react";
import { AuthContext } from "./authProvider.js";

export function useAuth() {
  return useContext(AuthContext);
}
