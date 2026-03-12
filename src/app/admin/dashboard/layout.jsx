"use client";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }) {
  const [auth, setAuth] = useState("loading");
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("voku_admin_key");
    if (saved) {
      validate(saved);
    } else {
      setAuth("prompt");
    }
  }, []);

  async function validate(k) {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k }),
      });
      const { valid } = await res.json();
      if (valid) {
        localStorage.setItem("voku_admin_key", k);
        setAuth("ok");
        setError(false);
      } else {
        localStorage.removeItem("voku_admin_key");
        setAuth("prompt");
        setError(true);
      }
    } catch {
      setAuth("prompt");
      setError(true);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    setError(false);
    validate(key.trim());
  }

  if (auth === "loading") {
    return (
      <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#999999", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>LOADING...</div>
      </div>
    );
  }

  if (auth === "prompt") {
    return (
      <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: 320 }}>
          <span style={{ background: "#AAFF00", color: "#111111", fontWeight: 900, fontSize: 16, padding: "4px 12px", letterSpacing: "0.05em" }}>VOKU</span>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999999", letterSpacing: "0.15em" }}>ADMIN ACCESS</div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Chave de acesso"
            autoFocus
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              border: error ? "2px solid #CC0000" : "2px solid #E5E5E5",
              borderRadius: 6,
              outline: "none",
              textAlign: "center",
              letterSpacing: "0.15em",
              color: "#111111",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: "#CC0000", fontWeight: 700, letterSpacing: "0.05em" }}>Chave incorreta</div>
          )}
          <button type="submit" style={{
            width: "100%",
            padding: "14px",
            background: "#111111",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
