"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePremium } from "@/lib/usePremium";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "normal" | "interview_propagandista" | "interview_gd";
type SimulationPhase = 1 | 2 | 3 | 4;

const SUGGESTIONS = [
  { icon: "📊", text: "Analisar Power BI e preparar argumentos", message: "Quero analisar meu Power BI. Vou te mandar o print agora." },
  { icon: "💊", text: "Dicas de abordagem com médicos e drogarias", message: "Me da dicas de abordagem com medicos dificeis e estrategias para drogaria." },
  { icon: "🎯", text: "Como se posicionar em acompanhamentos com GD/GR/GN", message: "Tenho acompanhamento chegando. Como devo me preparar?" },
  { icon: "🗣️", text: "Relacionamento com gestores", message: "Como melhorar meu relacionamento com o GD nos acompanhamentos?" },
  { icon: "📸", text: "Manda print do Power BI ou MDTR que eu analiso", message: "Vou mandar um print do meu painel para voce analisar." },
  { icon: "🏃", text: "Simular processo seletivo — propagandista", message: null, targetMode: "interview_propagandista" as Mode },
];

const PROPAGANDISTA_OPTIONS = [
  { label: "Iniciar processo completo do zero", msg: "Quero iniciar o processo seletivo completo do zero.", phase: 1 as SimulationPhase },
  { label: "Treinar Fase 1 — Primeiro encontro com GD", msg: "Quero treinar a Fase 1 — primeiro encontro com o GD.", phase: 1 as SimulationPhase },
  { label: "Treinar Fase 2 — Convicção e pressão", msg: "Quero treinar a Fase 2 — convicção e pressão psicológica.", phase: 2 as SimulationPhase },
  { label: "Treinar Fase 3 — Análise de mercado e propaganda", msg: "Quero treinar a Fase 3 — análise de mercado e propaganda no iPad.", phase: 3 as SimulationPhase },
  { label: "Treinar Fase 4 — Entrevista final com GR", msg: "Quero treinar a Fase 4 — entrevista final com o GR.", phase: 4 as SimulationPhase },
];

const GD_OPTIONS = [
  { label: "Iniciar processo completo para GD", msg: "Quero iniciar o processo seletivo completo para GD." },
  { label: "Treinar apresentação e motivação", msg: "Quero treinar minha apresentação pessoal e motivação para ser GD." },
  { label: "Treinar perguntas de liderança e gestão", msg: "Quero treinar as perguntas de liderança e gestão para GD." },
  { label: "Treinar pressão sobre mudança de cidade", msg: "Quero treinar como responder sobre mudança de cidade para GD." },
  { label: "Treinar etapa final com GN", msg: "Quero treinar a etapa final com o Gerente Nacional." },
];

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const [mode, setMode] = useState<Mode>("normal");
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>(1);
  const [isListening, setIsListening] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, [input]);

  const isPremium = usePremium();
  if (isPremium === null) return null;

  function getSimulationRole(phase: SimulationPhase): string {
    return phase === 4 ? "GR" : "GD";
  }

  function resetChat() {
    setMessages([]);
    setInput("");
    setImage(null);
    setSimulationPhase(1);
  }

  function activateMode(newMode: Mode) {
    setMode(newMode);
    setShowModeMenu(false);
    resetChat();
  }

  function handleSuggestionClick(s: (typeof SUGGESTIONS)[0]) {
    if (!s.message && s.targetMode) { activateMode(s.targetMode); return; }
    if (s.message) sendMessageText(s.message);
  }

  function detectPhaseAdvance(content: string, currentPhase: SimulationPhase) {
    const lower = content.toLowerCase();
    const patterns = ["avanca", "fase 2", "fase 3", "fase 4", "proxima fase"];
    if (patterns.some((p) => lower.includes(p)) && currentPhase < 4) {
      setSimulationPhase((prev) => (prev < 4 ? ((prev + 1) as SimulationPhase) : prev));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMediaType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => setImage((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  }

  function handleVoiceInput() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Use o Chrome para reconhecimento de voz."); return; }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop(); recognitionRef.current = null; setIsListening(false); return;
    }
    const r = new SR();
    r.lang = "pt-BR"; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false;
    recognitionRef.current = r;
    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput((prev) => prev ? prev + " " + t : t); };
    r.start();
  }

  async function sendMessageText(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    await streamResponse(newMessages);
  }

  async function sendMessage() {
    if ((!input.trim() && !image) || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(newMessages);
    setInput("");
    await streamResponse(newMessages, image || undefined);
  }

  async function streamResponse(newMessages: Message[], imageData?: string) {
    try {
      const apiMessages = newMessages.map((m, idx) => {
        if (idx === newMessages.length - 1 && imageData) {
          return {
            role: m.role,
            content: [
              { type: "image", source: { type: "base64", media_type: imageMediaType, data: imageData } },
              { type: "text", text: m.content || "Analise essa imagem." },
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, mode, simulationRole: getSimulationRole(simulationPhase), simulationPhase }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error("Sem resposta");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let fullContent = "";

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
            if (parsed?.type === "content_block_delta" && parsed?.delta?.type === "text_delta") {
              const delta: string = parsed.delta.text ?? "";
              if (delta) {
                fullContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + delta };
                  return updated;
                });
              }
            }
          } catch { }
        }
      }

      if (mode === "interview_propagandista") detectPhaseAdvance(fullContent, simulationPhase);
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Erro ao conectar. Tente novamente." };
          return updated;
        }
        return [...prev, { role: "assistant", content: "Erro ao conectar. Tente novamente." }];
      });
    } finally {
      setLoading(false);
    }
  }

  const isInterview = mode !== "normal";
  const isGD = mode === "interview_gd";
  const isProp = mode === "interview_propagandista";

  const accentColor = isGD ? "#818CF8" : isProp ? "#FBBF24" : "#4ADE80";
  const cardBg = isGD ? "rgba(129,140,248,0.07)" : isProp ? "rgba(251,191,36,0.07)" : "rgba(26,107,74,0.10)";
  const cardBorder = isGD ? "1px solid rgba(129,140,248,0.25)" : isProp ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(26,107,74,0.25)";
  const btnGrad = isGD ? "linear-gradient(135deg, #4338ca, #3730a3)" : isProp ? "linear-gradient(135deg, #92400e, #78350f)" : "linear-gradient(135deg, #1A6B4A, #145c3e)";
  const badgeColor = isGD ? "#818CF8" : "#FBBF24";
  const badgeBg = isGD ? "rgba(129,140,248,0.15)" : "rgba(251,191,36,0.15)";
  const badgeBorder = isGD ? "1px solid rgba(129,140,248,0.35)" : "1px solid rgba(251,191,36,0.35)";

  return (
    <main style={{ height: "100dvh", background: "#0A0F0D", fontFamily: "'DM Sans', sans-serif", color: "#F5F3EE", display: "flex", flexDirection: "column", maxWidth: 720, margin: "0 auto", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, background: "#0A0F0D", flexShrink: 0 }}>
        <button type="button" onClick={() => router.push("/home")} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "#8A9BB0", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
          Voltar
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#F5F3EE" }}>EscalaIA</span>
            {isInterview && (
              <span style={{ fontSize: 10, fontWeight: 700, background: badgeBg, border: badgeBorder, color: badgeColor, padding: "2px 8px", borderRadius: 20 }}>
                {isGD ? "PROCESSO GD" : `FASE ${simulationPhase} ${getSimulationRole(simulationPhase)}`}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#8A9BB0" }}>
            {isGD ? "Simulador de promoção para GD" : isProp ? "Simulador de processo seletivo" : "Assistente do propagandista médico"}
          </p>
        </div>

        {/* Botão com menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button type="button" onClick={() => isInterview ? activateMode("normal") : setShowModeMenu((v) => !v)} style={{ background: isInterview ? badgeBg : "rgba(255,255,255,0.07)", border: isInterview ? badgeBorder : "1px solid rgba(255,255,255,0.10)", color: isInterview ? badgeColor : "#8A9BB0", padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            {isInterview ? "Sair" : "Processo Seletivo"}
          </button>
          {showModeMenu && !isInterview && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#141A17", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: 8, zIndex: 100, minWidth: 230, display: "flex", flexDirection: "column", gap: 6 }}>
              <button type="button" onClick={() => activateMode("interview_propagandista")} style={{ fontSize: 12, color: "#FBBF24", padding: "10px 12px", background: "rgba(251,191,36,0.08)", borderRadius: 8, border: "1px solid rgba(251,191,36,0.20)", textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                Processo para Propagandista
              </button>
              <button type="button" onClick={() => activateMode("interview_gd")} style={{ fontSize: 12, color: "#818CF8", padding: "10px 12px", background: "rgba(129,140,248,0.08)", borderRadius: 8, border: "1px solid rgba(129,140,248,0.20)", textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                Processo para GD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" }}>

        {/* Tela inicial normal */}
        {messages.length === 0 && !isInterview && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: accentColor }}>Fala rep! Sou a EscalaIA.</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#8A9BB0", lineHeight: 1.65 }}>To aqui pra te ajudar no dia a dia — Power BI, acompanhamento com GD, médico difícil, processo seletivo. So chamar.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s.text} type="button" onClick={() => handleSuggestionClick(s)} style={{ fontSize: 12, color: "#8A9BB0", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.08)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.20)"; e.currentTarget.style.color = "#C8D8C0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#8A9BB0"; }}>
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tela inicial propagandista */}
        {messages.length === 0 && isProp && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: accentColor }}>Simulador — Propagandista</p>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#8A9BB0", lineHeight: 1.6 }}>4 fases reais da industria farmaceutica. Conduzo como entrevistador de verdade — com pressão, perguntas difíceis e veredito em cada fase.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
              {["Fase 1 GD", "Fase 2 GD", "Fase 3 GD", "Fase 4 GR"].map((f, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: i === 0 ? "rgba(251,191,36,0.20)" : "rgba(255,255,255,0.05)", border: i === 0 ? "1px solid rgba(251,191,36,0.40)" : "1px solid rgba(255,255,255,0.08)", color: i === 0 ? "#FBBF24" : "#8A9BB0" }}>{f}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {PROPAGANDISTA_OPTIONS.map((item) => (
                <button key={item.label} type="button" onClick={() => { setSimulationPhase(item.phase); sendMessageText(item.msg); }} style={{ fontSize: 12, color: "#8A9BB0", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(251,191,36,0.08)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.20)"; e.currentTarget.style.color = "#FBBF24"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#8A9BB0"; }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tela inicial GD */}
        {messages.length === 0 && isGD && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: accentColor }}>Simulador — Promoção para GD</p>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#8A9BB0", lineHeight: 1.6 }}>Processo conduzido por GRs com validação final pelo GN. Pressão real, perguntas difíceis, foco em liderança, mudança de cidade e gestão de equipe.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
              {["Entrevistas com GRs", "Validação com GN"].map((f, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: i === 0 ? "rgba(129,140,248,0.20)" : "rgba(255,255,255,0.05)", border: i === 0 ? "1px solid rgba(129,140,248,0.40)" : "1px solid rgba(255,255,255,0.08)", color: i === 0 ? "#818CF8" : "#8A9BB0" }}>{f}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {GD_OPTIONS.map((item) => (
                <button key={item.label} type="button" onClick={() => sendMessageText(item.msg)} style={{ fontSize: 12, color: "#8A9BB0", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(129,140,248,0.08)"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.20)"; e.currentTarget.style.color = "#818CF8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#8A9BB0"; }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens */}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "11px 15px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? btnGrad : "rgba(255,255,255,0.05)", border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)", fontSize: 13, lineHeight: 1.65, color: m.role === "user" ? "#fff" : "#D4D8E0", whiteSpace: "pre-wrap" }}>
              {m.content}
              {m.role === "assistant" && loading && i === messages.length - 1 && (
                <span style={{ display: "inline-block", width: 2, height: 14, background: "#4ADE80", marginLeft: 2, animation: "blink 1s step-end infinite" }} />
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "11px 15px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#8A9BB0" }}>
              {isGD ? "Avaliando perfil..." : isProp ? "Avaliando..." : "Analisando..."}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0A0F0D", flexShrink: 0 }}>
        {image && (
          <div style={{ marginBottom: 8, padding: "7px 12px", background: "rgba(26,107,74,0.10)", border: "1px solid rgba(26,107,74,0.25)", borderRadius: 8, fontSize: 12, color: "#4ADE80", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Imagem anexada</span>
            <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 14 }}>X</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {!isInterview && (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} id="imageUpload" />
              <label htmlFor="imageUpload" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 18 }}>📸</label>
            </>
          )}
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isGD ? "Sua resposta para o GR..." : isProp ? "Sua resposta para o GD..." : "Pergunta, dúvida ou Power BI — pode mandar..."}
            rows={1} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "#F5F3EE", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }} />
          <button type="button" onClick={handleVoiceInput} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)", background: isListening ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.07)", color: isListening ? "#EF4444" : "#8A9BB0", fontSize: 16, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isListening ? "0 0 12px rgba(239,68,68,0.30)" : "none", transition: "all 0.2s" }}>
            {isListening ? "⏹" : "🎙️"}
          </button>
          <button type="button" onClick={sendMessage} disabled={loading || (!input.trim() && !image)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: loading || (!input.trim() && !image) ? "rgba(255,255,255,0.07)" : btnGrad, color: "#fff", fontSize: 16, cursor: loading || (!input.trim() && !image) ? "not-allowed" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ➤
          </button>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </main>
  );
}