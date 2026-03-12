"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "diegomguerra@me.com",
  "dmarcondesguerra@gmail.com",
];

export default function AdminLayout({ children }) {
  const [auth, setAuth] = useState("loading");

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (data?.user && ADMIN_EMAILS.includes(data.user.email)) {
        setAuth("ok");
      } else {
        setAuth("denied");
      }
    });
  }, []);

  if (auth === "loading") {
    return (
      <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#999999", letterSpacing: "0.1em", fontFamily: "'Inter', sans-serif" }}>LOADING...</div>
      </div>
    );
  }

  if (auth === "denied") {
    return (
      <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: 14, color: "#CC0000", fontWeight: 900, letterSpacing: "0.1em" }}>ACCESS DENIED</div>
        <div style={{ fontSize: 12, color: "#999999" }}>Admin authentication required.</div>
        <a href="/cliente" style={{ fontSize: 12, color: "#111111", fontWeight: 700, textDecoration: "none", borderBottom: "2px solid #AAFF00", paddingBottom: 2, marginTop: 8 }}>Login →</a>
      </div>
    );
  }

  return <>{children}</>;
}
