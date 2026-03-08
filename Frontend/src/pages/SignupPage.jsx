import React from "react";
import Signup from "../components/Signup.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate, Link } from "react-router-dom";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (username, fullName, email, password) => {
    await signup(username, fullName, email, password);
    navigate("/profile", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <Signup onSignup={handleSignup} />
      <div className="mt-4 text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-main underline">Log in</Link>
      </div>
    </div>
  );
};

export default SignupPage;
