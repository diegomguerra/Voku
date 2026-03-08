"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  sand: "#FAF8F3",
  white: "#FFFFFF",
  ink: "#111111",
  inkSub: "#3D3D3D",
  inkMid: "#6B6B6B",
  inkFaint: "#A0A0A0",
  lime: "#C8F135",
  border: "#E8E5DE",
  borderMd: "#D1CCBF",
  teal: "#0D7A6E",
};

export default function ClienteLogin() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const sb = supabase();
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/cliente/pedidos";
      } else {
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void
  ) => (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: T.inkSub,
          marginBottom: 7,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box" as const,
          background: T.sand,
          border: `1.5px solid ${T.borderMd}`,
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 14,
          color: T.ink,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          outline: "none",
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        background: T.sand,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundImage:
          "radial-gradient(circle at 70% 20%, #e9f59e33 0%, transparent 60%)",
      }}
    >
      <div
        style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: "48px 44px",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-block",
              background: T.ink,
              color: T.lime,
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 28,
              padding: "6px 20px",
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            Voku
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: T.ink,
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </div>
          <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.5 }}>
            {mode === "login"
              ? "Acesse seus pedidos e faça downloads"
              : "Comece a receber seus projetos em 24h"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" &&
            field("Nome completo", "text", "Diego Guerra", name, setName)}
          {field("E-mail", "email", "diego@email.com", email, setEmail)}
          {field("Senha", "password", "••••••••", password, setPassword)}

          {mode === "login" && (
            <div
              style={{ textAlign: "right", marginTop: -10, marginBottom: 20 }}
            >
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: T.teal,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #BBF7D0",
                color: "#166534",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: T.ink,
              color: T.lime,
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              marginTop: mode === "login" ? 0 : 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
              ? "Entrar →"
              : "Criar conta →"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 12, color: T.inkFaint }}>ou</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: T.inkMid }}>
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          </span>
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: T.teal,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {mode === "login" ? "Criar agora" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
