import React from "react";
import Login from "../components/Login.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate, useLocation, Link } from "react-router-dom";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (username, password) => {
    await login(username, password);
    navigate(from, { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <Login onLogin={handleLogin} />
      <div className="mt-4 text-sm text-center">
        Don't have an account?{' '}
        <Link to="/signup" className="text-main underline">Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;
