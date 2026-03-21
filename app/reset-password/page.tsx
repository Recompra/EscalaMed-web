"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (password.length < 6) {
      setMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMsg("Erro ao redefinir senha. Tente novamente.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main style={{
        minHeight: "100vh", background: "#F5F3EE",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
      }}>
        <div style={{
          width: "100%", maxWidth: 420,
          background: "#FFFFFF",
          border: "1px solid rgba(13,17,23,0.10)",
          borderRadius: 16, padding: 28,
          boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
          display: "grid", gap: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>Senha redefinida!</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#8A9BB0", lineHeight: 1.6 }}>
            Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              padding: "13px 16px", borderRadius: 10,
              border: "none", background: "#1A6B4A",
              color: "white", fontFamily: "'Syne', sans-serif",
              fontSize: 13, fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer",
              textTransform: "uppercase" as const,
            }}
          >
            Ir para o login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh", background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#FFFFFF",
        border: "1px solid rgba(13,17,23,0.10)",
        borderRadius: 16, padding: 28,
        boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
        display: "grid", gap: 14,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 20, color: "#0D1117",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{
            width: 8, height: 8, background: "#1A6B4A",
            borderRadius: "50%", display: "inline-block",
          }}/>
          EscalaMed
        </div>

        <div>
          <h1 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>Nova senha</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" as const }}>
              Nova senha
            </span>
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

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" as const }}>
              Confirmar senha
            </span>
            <div style={{ position: "relative" }}>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: 16,
                  color: "#8A9BB0", padding: 0,
                }}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 16px", borderRadius: 10,
              border: "none",
              background: loading ? "#8A9BB0" : "#1A6B4A",
              color: "white", fontFamily: "'Syne', sans-serif",
              fontSize: 13, fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#FFF0EE",
              border: "1.5px solid rgba(192,57,43,0.20)",
              color: "#C0392B", fontSize: 13, fontWeight: 600,
            }}>{msg}</div>
          )}
        </form>
      </div>
    </main>
  );
}