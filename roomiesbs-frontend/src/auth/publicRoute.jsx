import { useAuth } from "./useAuth";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const { user } = useAuth();

  // If logged in, redirect to homepage
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}