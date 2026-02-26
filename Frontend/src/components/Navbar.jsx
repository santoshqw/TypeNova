import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Zap, Users, User } from "lucide-react";

const Logo = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 select-none"
    aria-label="Go to home"
  >
    <Zap className="h-6 w-6 text-main sm:h-7 sm:w-7" fill="currentColor" />
    <span className="text-xl font-bold tracking-tight text-text sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
      type<span className="text-main">nova</span>
    </span>
  </button>
);

const NavLink = ({ to, icon, label, active, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`nav-link ${active ? "active" : ""}`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const Navbar = ({ rightContent, onLogoClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e) => {
    if (location.pathname === "/" && onLogoClick) {
      // Always call with no arguments to avoid passing event
      onLogoClick();
    } else {
      navigate("/");
    }
  };

  return (
    <header className="mx-auto flex w-full items-center justify-between px-8 pt-6 pb-2 sm:px-16 sm:pt-8 lg:px-24 xl:px-32">
      <Logo onClick={handleLogoClick} />

      <nav className="flex items-center gap-1">
        {rightContent}
        <NavLink
          to="/multiplayer"
          icon={<Users className="h-4 w-4" />}
          label="multi"
          active={location.pathname === "/multiplayer"}
        />
        <NavLink
          to="/profile"
          icon={<User className="h-4 w-4" />}
          label="profile"
          active={location.pathname === "/profile"}
        />
      </nav>
    </header>
  );
};

export default Navbar;
