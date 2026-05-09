import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/LoadingState";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Restoring session" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
