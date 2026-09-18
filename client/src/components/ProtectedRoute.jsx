import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

// pages inside need a login, after logging in the user comes back to where they were
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="c-message">Loading</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
