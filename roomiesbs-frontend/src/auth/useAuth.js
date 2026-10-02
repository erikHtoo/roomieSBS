import { useContext } from "react";
import { AuthContext } from "./authProvider.jsx";

export function useAuth() {
  return useContext(AuthContext);
}
