import React, { useState } from "react";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-xs bg-[#23272f] border border-main/20 p-6 rounded-xl shadow-lg"
    >
      <h2 className="text-xl font-bold text-main mb-2 text-center">Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="bg-[#181b20] border border-main/10 text-text p-2 rounded focus:border-main outline-none transition"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="bg-[#181b20] border border-main/10 text-text p-2 rounded focus:border-main outline-none transition"
        required
      />
      {error && <div className="text-error text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="bg-main/90 hover:bg-main text-white py-2 rounded font-semibold transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

export default Login;
