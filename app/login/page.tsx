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

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
     email,password,
      });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/home");
  }

  return (
    <main style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        Entrar
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Acesse sua conta EscalaMed
      </p>

      <form onSubmit={onLogin} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>E-mail</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="seu@email.com"
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="********"
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #111",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p style={{ marginTop: 16, textAlign: "center", fontSize: 14 }}>
         Ainda não tem conta?{" "}
        <span
        style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
         onClick={() => router.push("/signup")}
         >
          Criar conta
         </span>
          </p>
          <button
        type="button"
        onClick={() => router.push("/contato")}
        style={{
        marginTop: 20,
        padding: 14,
        borderRadius: 10,
        border: "none",
        backgroundColor: "#111111",
        color: "#fff",
        fontWeight: 700,
        width: "100%",
        cursor: "pointer",
        }}
>
       É médico? Solicitar visita do representante
      </button>

        {msg && (
          <div style={{ color: "crimson", fontSize: 14 }}>
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}