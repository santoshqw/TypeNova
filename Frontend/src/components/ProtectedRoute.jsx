import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="text-center mt-10 text-sub">Checking authentication...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && user.username !== "admin") {
    return <div className="text-center mt-10 text-error">Access denied. Admins only.</div>;
  }
  return children;
}

export default ProtectedRoute;
