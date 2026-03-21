"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { setMsg(error.message); return; }
    router.push("/home");
  }

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#FFFFFF",
    color: "#0D1117",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#4A5568",
    textTransform: "uppercase" as const,
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#FFFFFF",
        border: "1px solid rgba(13,17,23,0.10)",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
        display: "grid",
        gap: 14,
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: "#0D1117",
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 4,
        }}>
          <span style={{
            width: 8, height: 8,
            background: "#1A6B4A",
            borderRadius: "50%",
            display: "inline-block",
          }}/>
          EscalaMed
        </div>

        <div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#0D1117",
          }}>Entrar</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            Acesse sua conta EscalaMed
          </p>
        </div>

        <form onSubmit={onLogin} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>E-mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="seu@email.com"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
  <span style={labelStyle}>Senha</span>
  <div style={{ position: "relative" }}>
    <input
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      type={showPassword ? "text" : "password"}
      placeholder="••••••••"
      required
      style={{ ...inputStyle, paddingRight: 40 }}
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)",
        background: "none", border: "none",
        cursor: "pointer", fontSize: 16,
        color: "#8A9BB0", padding: 0,
      }}
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
</label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 16px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#8A9BB0" : "#1A6B4A",
              color: "white",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {/* Esqueci minha senha */}
          <button
            type="button"
            onClick={async () => {
              if (!email) {
                setMsg("Digite seu e-mail acima primeiro.");
                return;
              }
              setLoading(true);
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "https://escalamed.app.br/reset-password",
              });
              setLoading(false);
              if (error) {
                setMsg("Erro ao enviar e-mail. Tente novamente.");
              } else {
                setMsg("✅ E-mail de recuperação enviado! Verifique sua caixa de entrada.");
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#8A9BB0",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "right" as const,
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Esqueci minha senha
          </button>

          {msg && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#FFF0EE",
              border: "1.5px solid rgba(192,57,43,0.20)",
              color: "#C0392B",
              fontSize: 13,
              fontWeight: 600,
            }}>{msg}</div>
          )}
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#8A9BB0", margin: 0 }}>
          Ainda não tem conta?{" "}
          <span
            style={{ color: "#1A6B4A", cursor: "pointer", fontWeight: 700 }}
            onClick={() => router.push("/signup")}
          >Criar conta</span>
        </p>

        {/* Divisor */}
        <div style={{ height: 1, background: "rgba(13,17,23,0.07)" }} />

       {/* Botão médico */}
<div style={{ display: "flex", gap: 8, width: "100%" }}>
  <button
    type="button"
    onClick={() => router.push("/visit-request")}
    style={{
      flex: 1,
      padding: "13px 16px",
      borderRadius: 10,
      border: "1.5px solid rgba(13,17,23,0.12)",
      background: "#0D1117",
      color: "white",
      fontFamily: "'Syne', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.04em",
      cursor: "pointer",
    }}
  >
    É médico? Solicitar visita
  </button>

  <button
    type="button"
    onClick={() => {
      const url = "https://escalamed.app.br/visit-request";
      if (navigator.share) {
        navigator.share({ title: "Solicitar visita", url });
      } else {
        navigator.clipboard.writeText(url);
        alert("Link copiado!");
      }
    }}
    style={{
      padding: "13px 16px",
      borderRadius: 10,
      border: "1.5px solid rgba(13,17,23,0.12)",
      background: "#0D1117",
      color: "white",
      cursor: "pointer",
      fontSize: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    title="Compartilhar link"
  >
    🔗
  </button>
</div>

      </div>
    </main>
  );
}