"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TIPOS = [
  { icon: "🐛", label: "Reportar bug" },
  { icon: "💡", label: "Sugestão" },
  { icon: "❓", label: "Dúvida" },
  { icon: "💬", label: "Outro" },
];

export default function SuportePage() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!tipo) { setError("Selecione o tipo de mensagem."); return; }
    if (msg.trim().length < 10) { setError("Escreva pelo menos 10 caracteres."); return; }

    setSending(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    const email = user?.email ?? "anônimo";
    const name = user?.user_metadata?.name ?? "";

    // Salva no Supabase
    await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      user_email: email,
      user_name: name,
      tipo,
      mensagem: msg.trim(),
    });

    // Abre email como fallback
    const subject = encodeURIComponent(`[EscalaMed] ${tipo} - ${email}`);
    const body = encodeURIComponent(`De: ${name} (${email})\nTipo: ${tipo}\n\n${msg.trim()}`);
    window.open(`mailto:contato@escalamed.app.br?subject=${subject}&body=${body}`);

    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <main style={{
        minHeight: "100vh", background: "#F5F3EE",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: 40,
          maxWidth: 420, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(13,17,23,0.10)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117", marginBottom: 8,
          }}>Mensagem enviada!</div>
          <div style={{ fontSize: 14, color: "#8A9BB0", marginBottom: 28 }}>
            Obrigado pelo seu feedback.<br/>
            Respondemos em até 24h no seu e-mail.
          </div>
          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{
              background: "#1A6B4A", color: "white",
              padding: "12px 28px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "'Syne', sans-serif",
              fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >Voltar ao início</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh", background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 600, margin: "0 auto", padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>Suporte & Feedback</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            Fale com a equipe EscalaMed
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/home")}
          style={{
            background: "rgba(13,17,23,0.06)", color: "#0D1117",
            padding: "8px 14px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 12,
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
          }}
        >Voltar</button>
      </div>

      {/* Card principal */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: 24,
        boxShadow: "0 4px 24px rgba(13,17,23,0.08)",
        border: "1px solid rgba(13,17,23,0.06)",
        display: "grid", gap: 20,
      }}>

        {/* Tipo */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase" as const, color: "#8A9BB0", marginBottom: 10,
          }}>Tipo de mensagem</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TIPOS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setTipo(t.label)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: tipo === t.label
                    ? "2px solid #1A6B4A"
                    : "1.5px solid rgba(13,17,23,0.10)",
                  background: tipo === t.label
                    ? "rgba(26,107,74,0.08)"
                    : "#F5F3EE",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12, fontWeight: 700,
                  color: tipo === t.label ? "#1A6B4A" : "#4A5568",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase" as const, color: "#8A9BB0", marginBottom: 10,
          }}>Sua mensagem</div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Descreva sua dúvida, sugestão ou problema com o máximo de detalhes possível..."
            rows={7}
            style={{
              width: "100%", padding: "14px",
              borderRadius: 12,
              border: "1.5px solid rgba(13,17,23,0.10)",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              background: "#F5F3EE", color: "#0D1117",
              outline: "none", resize: "vertical" as const,
              lineHeight: 1.6, boxSizing: "border-box" as const,
            }}
          />
          <div style={{
            textAlign: "right" as const, fontSize: 11,
            color: msg.length > 10 ? "#1A6B4A" : "#8A9BB0",
            marginTop: 4,
          }}>{msg.length} caracteres</div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "#FFF0EE", border: "1.5px solid rgba(192,57,43,0.20)",
            color: "#C0392B", fontWeight: 600, fontSize: 13,
          }}>{error}</div>
        )}

        {/* Botão */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          style={{
            padding: "14px",
            background: sending ? "#8A9BB0" : "#1A6B4A",
            color: "white", borderRadius: 12, border: "none",
            cursor: sending ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif", fontSize: 14,
            fontWeight: 700, letterSpacing: "0.06em",
            boxShadow: sending ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >{sending ? "Enviando..." : "Enviar mensagem →"}</button>

        {/* Rodapé */}
        <div style={{
          textAlign: "center" as const, fontSize: 12, color: "#8A9BB0",
          borderTop: "1px solid rgba(13,17,23,0.06)", paddingTop: 16,
        }}>
          Ou envie direto para{" "}
          <a href="mailto:contato@escalamed.app.br" style={{ color: "#1A6B4A", fontWeight: 700 }}>
            contato@escalamed.app.br
          </a>
        </div>
      </div>
    </main>
  );
}