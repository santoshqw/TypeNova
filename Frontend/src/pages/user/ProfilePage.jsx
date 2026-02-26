import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  User,
  Trophy,
  Target,
  Flame,
  Keyboard,
  BarChart3,
  LogOut,
  AlertCircle,
} from "lucide-react";
import Leaderboard from "../../components/Leaderboard";

const API_BASE = import.meta.env.VITE_API_URL || "";

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, color = "text-main" }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg bg-sub-alt px-5 py-4">
    {Icon && <Icon className={`h-5 w-5 ${color}`} />}
    <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    <p className="text-[11px] uppercase tracking-widest text-sub">{label}</p>
  </div>
);

/* ── Auth form ── */
const AuthForm = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await signup(form.username, form.fullName, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md bg-bg px-3 py-2 text-sm text-text placeholder-sub outline-none border border-surface focus:border-main transition-colors";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={() => { setMode("login"); setError(""); }}
          className={`text-sm font-medium transition-colors ${mode === "login" ? "text-main" : "text-sub hover:text-text"}`}
        >
          Log in
        </button>
        <span className="text-sub">|</span>
        <button
          onClick={() => { setMode("signup"); setError(""); }}
          className={`text-sm font-medium transition-colors ${mode === "signup" ? "text-main" : "text-sub hover:text-text"}`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className={inputClass}
          required
        />
        {mode === "signup" && (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              required
            />
          </>
        )}
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputClass}
          required
          minLength={6}
        />

        {error && (
          <div className="flex items-center gap-2 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-main px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
};

/* ── Profile page ── */
const ProfilePage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/stats`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setStats(data.stats);
        }
      } catch {
        // ignore
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-sub">Loading…</span>
        </div>
      </Layout>
    );
  }

  /* Guest view */
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-1 flex-col items-center justify-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sub-alt">
            <User className="h-10 w-10 text-sub" />
          </div>
          <h2 className="mb-1 text-xl font-bold text-text">Welcome</h2>
          <p className="mb-8 text-sm text-sub">Sign in to save and track your typing stats</p>
          <AuthForm />
        </div>
      </Layout>
    );
  }

  /* Logged-in view */
  const s = stats || {};

  return (
    <Layout>
      <div className="flex flex-1 flex-col items-center justify-center animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-sub-alt">
            <User className="h-10 w-10 text-main" />
          </div>
          <h2 className="text-xl font-bold text-text">{user.username}</h2>
          <p className="text-sm text-sub">{user.fullName}</p>
        </div>

        {statsLoading ? (
          <span className="text-sub">Loading stats…</span>
        ) : (
          <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={BarChart3} label="Tests" value={s.totalTests ?? 0} />
            <StatCard icon={Keyboard} label="Avg WPM" value={s.averageWPM ?? 0} />
            <StatCard icon={Trophy} label="Best WPM" value={s.bestWPM ?? 0} color="text-main" />
            <StatCard icon={Target} label="Accuracy" value={`${s.accuracy ?? 0}%`} />
            <StatCard icon={Flame} label="Streak" value={s.currentStreak ?? 0} color="text-error" />
            <StatCard icon={Flame} label="Best Streak" value={s.longestStreak ?? 0} />
          </div>
        )}

        <div className="mt-12 w-full max-w-2xl mx-auto">
          <Leaderboard />
        </div>

        <button
          onClick={logout}
          className="mt-8 flex items-center gap-2 rounded-md px-4 py-2 text-sm text-sub transition-colors hover:text-error"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </Layout>
  );
};

export default ProfilePage;