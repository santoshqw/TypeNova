import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminAddText = () => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [number, setNumber] = useState(false);
  const [punctuation, setPunctuation] = useState(false);
  const [symbol, setSymbol] = useState(false);

  // Auto-detect features in text
  const detectFeatures = (input) => {
    const hasNumber = /[0-9]/.test(input);
    const hasPunctuation = /[.,;:!?"'\-()\[\]{}]/.test(input);
    const hasSymbol = /[~`@#$%^&*_+=|\\<>/]/.test(input);
    setNumber(hasNumber);
    setPunctuation(hasPunctuation);
    setSymbol(hasSymbol);
  };
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || user.username !== "admin") {
    return <div className="text-center mt-10 text-error">Access denied. Admins only.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/typing-text/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          textInfo: { number, punctuation, symbol },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Text added successfully!");
        setText("");
        setNumber(false);
        setPunctuation(false);
        setSymbol(false);
      } else {
        setMessage(data.message || "Failed to add text");
      }
    } catch (err) {
    // ...existing code...
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-sub-alt rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-main">Add Typing Text (Admin)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="input-field min-h-[120px]"
          placeholder="Enter typing text (800-1500 chars)"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            detectFeatures(e.target.value);
          }}
          minLength={800}
          maxLength={1500}
          required
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={number} onChange={() => setNumber((v) => !v)} />
            Number
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={punctuation} onChange={() => setPunctuation((v) => !v)} />
            Punctuation
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={symbol} onChange={() => setSymbol((v) => !v)} />
            Symbol
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Text"}
        </button>
        {message && <div className="text-center text-main mt-2">{message}</div>}
      </form>
    </div>
  );
};

export default AdminAddText;
