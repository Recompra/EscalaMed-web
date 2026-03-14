"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMediaType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  }

  async function sendMessage() {
    if (!input.trim() && !image) return;
    setLoading(true);

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const apiMessages = newMessages.map((m, idx) => {
        if (idx === newMessages.length - 1 && image) {
          return {
            role: m.role,
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: imageMediaType, data: image },
              },
              { type: "text", text: m.content || "Analise essa imagem e me dê insights para minha reunião." },
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Erro ao obter resposta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro ao conectar com a IA. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0A0F0D",
      fontFamily: "'DM Sans', sans-serif",
      color: "#F5F3EE",
      display: "flex",
      flexDirection: "column",
      maxWidth: 720,
      margin: "0 auto",
    }}>

      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        background: "#0A0F0D",
        zIndex: 10,
      }}>
        <button type="button" onClick={() => router.push("/home")} style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#8A9BB0",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>← Voltar</button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ADE80", boxShadow: "0 0 8px #4ADE80",
            }}/>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: 16, color: "#F5F3EE",
            }}>EscalaIA</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#8A9BB0" }}>
            Assistente do propagandista médico
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {messages.length === 0 && (
          <div style={{
            background: "rgba(26,107,74,0.10)",
            border: "1px solid rgba(26,107,74,0.25)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#4ADE80" }}>
              👋 Fala rep! Sou a EscalaIA.
            </p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8A9BB0", lineHeight: 1.65 }}>
              Tô aqui pra te ajudar no dia a dia — de Power BI a acompanhamento com o GD, de abordagem em drogaria a como não entrar em pânico antes de uma reunião com o GR. 😄
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "📊 Analisar seu Power BI e preparar argumentos para reunião",
                "💊 Dicas de abordagem com médicos e drogarias",
                "🎯 Como se posicionar em acompanhamentos com GD/GR/GN",
                "🗣️ Quebra gelo e relacionamento com gestores",
                "📸 Manda o print do Veeva ou Power BI que eu analiso",
              ].map((tip) => (
                <div key={tip} style={{
                  fontSize: 12, color: "#8A9BB0",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>{tip}</div>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "12px 16px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user"
                ? "linear-gradient(135deg, #1A6B4A, #145c3e)"
                : "rgba(255,255,255,0.05)",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              fontSize: 13, lineHeight: 1.65,
              color: m.role === "user" ? "#fff" : "#D4D8E0",
              whiteSpace: "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px",
              borderRadius: "14px 14px 14px 4px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 13, color: "#8A9BB0",
            }}>Analisando... ⏳</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px 32px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "#0A0F0D",
      }}>
        {image && (
          <div style={{
            marginBottom: 10, padding: "8px 12px",
            background: "rgba(26,107,74,0.10)",
            border: "1px solid rgba(26,107,74,0.25)",
            borderRadius: 8, fontSize: 12, color: "#4ADE80",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>📸 Imagem anexada — pronta para análise</span>
            <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }}
              style={{ background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleImageUpload} style={{ display: "none" }} id="imageUpload" />
          <label htmlFor="imageUpload" style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, fontSize: 18,
          }}>📸</label>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Pergunta, desabafo ou Power BI — pode mandar..."
            rows={1}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "#F5F3EE", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none", resize: "none", lineHeight: 1.5,
            }}
          />

          <button type="button" onClick={sendMessage}
            disabled={loading || (!input.trim() && !image)}
            style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: loading || (!input.trim() && !image)
                ? "rgba(255,255,255,0.07)"
                : "linear-gradient(135deg, #1A6B4A, #145c3e)",
              color: "#fff", fontSize: 16,
              cursor: loading || (!input.trim() && !image) ? "not-allowed" : "pointer",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,74,0.40)",
            }}>➤</button>
        </div>
      </div>
    </main>
  );
}