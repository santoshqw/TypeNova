import React from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { FilePlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminNavLink = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.username !== "admin") return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/admin/add-text")}
      className={`nav-link ${location.pathname === "/admin/add-text" ? "active" : ""}`}
      title="Add Text"
    >
      <FilePlus className="h-4 w-4" />
      <span className="hidden sm:inline">add text</span>
    </button>
  );
};

export default AdminNavLink;
