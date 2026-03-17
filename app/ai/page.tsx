"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Mode = "normal" | "interview_gd";

const SUGGESTIONS = [
  {
    icon: "📊",
    text: "Analisar seu Power BI e preparar argumentos para reunião",
    message: "Quero analisar meu Power BI. Vou te mandar o print agora.",
  },
  {
    icon: "💊",
    text: "Dicas de abordagem com médicos e drogarias",
    message: "Me dá dicas de abordagem com médicos difíceis e estratégias para drogaria.",
  },
  {
    icon: "🎯",
    text: "Como se posicionar em acompanhamentos com GD/GR/GN",
    message: "Tenho acompanhamento chegando. Como devo me preparar e me posicionar?",
  },
  {
    icon: "🗣️",
    text: "Quebra gelo e relacionamento com gestores",
    message: "Como melhorar meu relacionamento com o GD e criar um bom clima nos acompanhamentos?",
  },
  {
    icon: "📸",
    text: "Manda o print do Sistema, Power BI ou MDTR que eu analiso",
    message: "Vou mandar um print do meu painel para você analisar.",
  },
  {
    icon: "🏆",
    text: "Toque em 'Entrevista GD' para simular o processo seletivo",
    message: "",
  },
];

export default function AIAssistantPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const [mode, setMode] = useState<Mode>("normal");

  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, [input]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMediaType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  }

  function handleModeToggle() {
    setMode((prev) => (prev === "normal" ? "interview_gd" : "normal"));
    setMessages([]);
    setInput("");
    setImage(null);

    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSuggestionClick(suggestion: (typeof SUGGESTIONS)[0]) {
    if (!suggestion.message) return;
    void sendMessageText(suggestion.message);
  }

  async function sendMessageText(text: string) {
    if (!text.trim() || loading) return;

    setLoading(true);

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    await streamResponse(newMessages);
  }

  async function sendMessage() {
    if (loading) return;
    if (!input.trim() && !image) return;

    setLoading(true);

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    await streamResponse(newMessages, image || undefined);
  }

  async function streamResponse(newMessages: Message[], imageData?: string) {
    try {
      const apiMessages = newMessages.map((m, idx) => {
        const isLastMessage = idx === newMessages.length - 1;

        if (isLastMessage && imageData) {
          return {
            role: m.role,
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageMediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text:
                  m.content || "Analise essa imagem e me dê insights para minha reunião.",
              },
            ],
          };
        }

        return {
          role: m.role,
          content: m.content,
        };
      });

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          mode,
          simulationRole: "GR",
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao conectar com a IA. Tente novamente.";

        try {
          const contentType = response.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData?.details || errorData?.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          }
        } catch {
          // mantém a mensagem padrão
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Sem resposta da IA.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6).trim();

          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            const delta =
              parsed?.delta?.text ||
              parsed?.delta?.value ||
              parsed?.content_block?.text ||
              "";

            if (delta) {
              assistantText += delta;

              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: assistantText,
                  };
                }

                return updated;
              });
            }
          } catch {
            // ignora linha parcial ou formato intermediário do stream
          }
        }
      }

      if (!assistantText.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: "Não consegui gerar resposta agora. Tente novamente.",
            };
          }

          return updated;
        });
      }

      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao conectar com a IA. Tente novamente.";

      setMessages((prev) => {
        const updated = [...prev];

        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: message,
          };
          return updated;
        }

        return [...updated, { role: "assistant", content: message }];
      });
    } finally {
      setLoading(false);
    }
  }

  const isInterviewMode = mode === "interview_gd";

  return (
    <main
      style={{
        height: "100dvh",
        background: "#0A0F0D",
        fontFamily: "'DM Sans', sans-serif",
        color: "#F5F3EE",
        display: "flex",
        flexDirection: "column",
        maxWidth: 720,
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#0A0F0D",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/home")}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#8A9BB0",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            flexShrink: 0,
          }}
        >
          ← Voltar
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ADE80",
                boxShadow: "0 0 8px #4ADE80",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#F5F3EE",
              }}
            >
              EscalaIA
            </span>

            {isInterviewMode && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(251,191,36,0.15)",
                  border: "1px solid rgba(251,191,36,0.35)",
                  color: "#FBBF24",
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                ENTREVISTA GD
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: 11, color: "#8A9BB0" }}>
            {isInterviewMode
              ? "Simulando entrevista com GR"
              : "Assistente do propagandista médico"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleModeToggle}
          style={{
            background: isInterviewMode
              ? "rgba(251,191,36,0.15)"
              : "rgba(255,255,255,0.07)",
            border: isInterviewMode
              ? "1px solid rgba(251,191,36,0.35)"
              : "1px solid rgba(255,255,255,0.10)",
            color: isInterviewMode ? "#FBBF24" : "#8A9BB0",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {isInterviewMode ? "✕ Sair" : "🎯 Entrevista GD"}
        </button>
      </div>

      <div
        ref={messagesRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 && !isInterviewMode && (
          <div
            style={{
              background: "rgba(26,107,74,0.10)",
              border: "1px solid rgba(26,107,74,0.25)",
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                fontWeight: 600,
                color: "#4ADE80",
              }}
            >
              👋 Fala rep! Sou a EscalaIA.
            </p>

            <p
              style={{
                margin: "0 0 12px",
                fontSize: 13,
                color: "#8A9BB0",
                lineHeight: 1.65,
              }}
            >
              Tô aqui pra te ajudar no dia a dia — de Power BI a acompanhamento com o GD, de abordagem em drogaria a como não entrar em pânico antes de um acompanhamento com o GR. 😄
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => {
                    if (!s.message) {
                      handleModeToggle();
                    } else {
                      handleSuggestionClick(s);
                    }
                  }}
                  style={{
                    fontSize: 12,
                    color: "#8A9BB0",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.06)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(74,222,128,0.08)";
                    e.currentTarget.style.borderColor = "rgba(74,222,128,0.20)";
                    e.currentTarget.style.color = "#C8D8C0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#8A9BB0";
                  }}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && isInterviewMode && (
          <div
            style={{
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                fontWeight: 600,
                color: "#FBBF24",
              }}
            >
              🎯 Modo Entrevista GD ativado
            </p>

            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                color: "#8A9BB0",
                lineHeight: 1.65,
              }}
            >
              Vou simular uma entrevista real conduzida por um GR para a vaga de Gerente Distrital. Uma pergunta por vez, com feedback após cada resposta.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "▶️ Começar do início", msg: "começar" },
                {
                  label: "🧑‍💼 Treinar apresentação pessoal",
                  msg: "Quero treinar o bloco de apresentação pessoal",
                },
                {
                  label: "📈 Treinar trajetória e resultados",
                  msg: "Quero treinar o bloco de trajetória e resultados",
                },
                {
                  label: "👥 Treinar liderança e gestão",
                  msg: "Quero treinar o bloco de liderança e gestão",
                },
                {
                  label: "🔥 Treinar situações difíceis",
                  msg: "Quero treinar o bloco de conflitos e situações difíceis",
                },
                {
                  label: "🏠 Treinar mudança de cidade",
                  msg: "Quero treinar o bloco de mudança de cidade e disponibilidade",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => void sendMessageText(item.msg)}
                  style={{
                    fontSize: 12,
                    color: "#8A9BB0",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.06)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(251,191,36,0.08)";
                    e.currentTarget.style.borderColor = "rgba(251,191,36,0.20)";
                    e.currentTarget.style.color = "#FBBF24";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#8A9BB0";
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "11px 15px",
                borderRadius:
                  m.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                background:
                  m.role === "user"
                    ? isInterviewMode
                      ? "linear-gradient(135deg, #92400e, #78350f)"
                      : "linear-gradient(135deg, #1A6B4A, #145c3e)"
                    : "rgba(255,255,255,0.05)",
                border:
                  m.role === "user"
                    ? "none"
                    : "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
                lineHeight: 1.65,
                color: m.role === "user" ? "#fff" : "#D4D8E0",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
              {m.role === "assistant" &&
                loading &&
                i === messages.length - 1 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 14,
                      background: "#4ADE80",
                      marginLeft: 2,
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "11px 15px",
                borderRadius: "14px 14px 14px 4px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
                color: "#8A9BB0",
              }}
            >
              {isInterviewMode ? "GR pensando... 🤔" : "Analisando... ⏳"}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "12px 16px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#0A0F0D",
          flexShrink: 0,
        }}
      >
        {image && (
          <div
            style={{
              marginBottom: 8,
              padding: "7px 12px",
              background: "rgba(26,107,74,0.10)",
              border: "1px solid rgba(26,107,74,0.25)",
              borderRadius: 8,
              fontSize: 12,
              color: "#4ADE80",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>📸 Imagem anexada — pronta para análise</span>
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              style={{
                background: "none",
                border: "none",
                color: "#C0392B",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {!isInterviewMode && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: 18,
                }}
              >
                📸
              </label>
            </>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={
              isInterviewMode
                ? "Sua resposta para o GR..."
                : "Pergunta, desabafo ou Power BI — pode mandar..."
            }
            rows={1}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "#F5F3EE",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              resize: "none",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
            }}
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={loading || (!input.trim() && !image)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background:
                loading || (!input.trim() && !image)
                  ? "rgba(255,255,255,0.07)"
                  : isInterviewMode
                  ? "linear-gradient(135deg, #92400e, #78350f)"
                  : "linear-gradient(135deg, #1A6B4A, #145c3e)",
              color: "#fff",
              fontSize: 16,
              cursor:
                loading || (!input.trim() && !image)
                  ? "not-allowed"
                  : "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: loading
                ? "none"
                : isInterviewMode
                ? "0 4px 16px rgba(146,64,14,0.40)"
                : "0 4px 16px rgba(26,107,74,0.40)",
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </main>
  );
}