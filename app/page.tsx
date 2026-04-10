"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const ESCALA_SEQUENCES = [
  {
    uf: "SP", cidade: "Campinas", dia: "Terca", periodo: "Manha",
    medicos: [
      { nome: "RODRIGO ALVES MONTEIRO", esp: "CARDIOLOGISTA", tel: "19991234567", clinica: "CLINICA CARDIO VIDA - CENTRO" },
      { nome: "FERNANDA COSTA LIMA", esp: "ENDOCRINOLOGISTA", tel: "19987654321", clinica: "INSTITUTO METABOLICO - CAMBUI" },
      { nome: "LUCAS PEREIRA SOUZA", esp: "CLINICO GERAL", tel: "19998887766", clinica: "UPA CAMPINAS SUL - VILA UNIAO" },
    ]
  },
  {
    uf: "SP", cidade: "Santos", dia: "Quarta", periodo: "Tarde",
    medicos: [
      { nome: "ANA BEATRIZ RAMOS", esp: "NEUROLOGISTA", tel: "13991112233", clinica: "NEUROMED SANTOS - GONZAGA" },
      { nome: "CARLOS EDUARDO FARIA", esp: "ORTOPEDISTA", tel: "13987776655", clinica: "CLINICA ORTOVIDA - JOSE MENINO" },
      { nome: "PATRICIA NUNES BARROS", esp: "DERMATOLOGISTA", tel: "13994445566", clinica: "DERMA CLINICA - BOQUEIRAO" },
    ]
  },
];

function EscalaMockup() {
  const [seq, setSeq] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleDocs, setVisibleDocs] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = ESCALA_SEQUENCES[seq];

  useEffect(() => {
    const steps: [number, () => void][] = [
      [600, () => setStep(1)],
      [900, () => setStep(2)],
      [700, () => setStep(3)],
      [700, () => setStep(4)],
      [600, () => { setStep(5); setVisibleDocs([]); }],
      [400, () => setVisibleDocs([0])],
      [350, () => setVisibleDocs([0, 1])],
      [350, () => setVisibleDocs([0, 1, 2])],
      [2800, () => {
        setStep(0);
        setVisibleDocs([]);
        setTimeout(() => setSeq(p => (p + 1) % ESCALA_SEQUENCES.length), 300);
      }],
    ];
    let idx = 0;
    function run() {
      if (idx >= steps.length) return;
      const [delay, fn] = steps[idx++];
      timerRef.current = setTimeout(() => { fn(); run(); }, delay);
    }
    run();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [seq]);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, height: "100%", display: "flex", flexDirection: "column", background: "#F5F3EE" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px 2px", fontSize: 10, fontWeight: 700, color: "#0D1117" }}>
        <span>09:12</span><span>Escala Med</span>
      </div>
      <div style={{ padding: "6px 12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(13,17,23,0.06)" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          <span style={{ color: "#0D1117" }}>Escala</span><span style={{ color: "#1A6B4A" }}>Med</span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A6B4A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>+</div>
      </div>
      <div style={{ margin: "8px 10px 4px", background: "linear-gradient(90deg, #1A6B4A, #22c55e)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 11, color: "#fff", letterSpacing: "0.05em" }}>USE ESSA FERRAMENTA GRATIS</span>
      </div>
      <div style={{ padding: "6px 10px 0", fontSize: 11, color: "#1A6B4A", fontWeight: 600 }}>Medicos disponiveis por regiao e periodo</div>
      <div style={{ padding: "6px 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "UF", val: step >= 1 ? s.uf : "" },
          { label: "CIDADE", val: step >= 2 ? s.cidade : "" },
          { label: "DIA DA SEMANA", val: step >= 3 ? s.dia : "" },
          { label: "PERIODO", val: step >= 4 ? s.periodo : "" },
        ].map(f => (
          <div key={f.label} style={{ background: "#fff", border: "1px solid rgba(13,17,23,0.10)", borderRadius: 8, padding: "5px 8px" }}>
            <div style={{ fontSize: 8, color: "#8A9BB0", letterSpacing: "0.08em", marginBottom: 2 }}>{f.label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 11, color: f.val ? "#0D1117" : "#ccc", minHeight: 16, transition: "color 0.3s" }}>
              <span>{f.val || "-"}</span><span style={{ fontSize: 9, color: "#aaa" }}>v</span>
            </div>
          </div>
        ))}
      </div>
      {step >= 4 && (
        <div style={{ margin: "0 10px 4px", background: "#fff", border: "1px solid rgba(13,17,23,0.07)", borderRadius: 7, padding: "5px 10px", fontSize: 10, color: "#8A9BB0" }}>
          {s.uf} - {s.cidade} - {s.dia} - {s.periodo}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {step === 5 && s.medicos.map((m, i) => (
          <div key={m.nome} style={{
            background: "#fff", border: "1px solid rgba(13,17,23,0.07)",
            borderLeft: "3px solid #1A6B4A", borderRadius: 10, padding: "10px",
            opacity: visibleDocs.includes(i) ? 1 : 0,
            transform: visibleDocs.includes(i) ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 10, color: "#0D1117", marginBottom: 2 }}>{m.nome}</div>
                <div style={{ fontSize: 9, color: "#1A6B4A", marginBottom: 1 }}>{m.esp} - {m.tel}</div>
                <div style={{ fontSize: 9, color: "#8A9BB0", marginBottom: 5 }}>{m.clinica}</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[s.uf, s.cidade, s.dia, s.periodo].map(t => (
                    <span key={t} style={{ fontSize: 8, background: "rgba(26,107,74,0.08)", border: "1px solid rgba(26,107,74,0.15)", color: "#1A6B4A", borderRadius: 4, padding: "1px 5px" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(13,17,23,0.15)", background: "#fff", cursor: "pointer", fontWeight: 700 }}>Editar</button>
                <button style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AI_CHAT = [
  { role: "ia", text: "Fala rep! Sou a EscalaIA. To aqui pra te ajudar no dia a dia - Power BI, acompanhamento com GD, medico dificil, processo seletivo. So chamar." },
  { role: "user", text: "Quero iniciar o processo seletivo completo para GD." },
  { role: "ia", text: "Avaliando perfil..." },
  { role: "ia", text: "Perfeito. Vou conduzir como GR da sua regiao. Pressao real, perguntas dificeis. Pronto?\n\nMe conta: ha quanto tempo voce esta na empresa e qual foi seu ultimo resultado de market share?" },
  { role: "user", text: "3 anos. Market share subiu 4pp no ultimo ciclo." },
  { role: "ia", text: "Bom numero. Agora a pergunta dificil:\n\nSe eu te promover pra GD, voce tera que mudar de cidade. Como sua familia esta preparada pra isso e como voce vai manter a performance durante a transicao?" },
];

function EscalaIAMockup() {
  const [screen, setScreen] = useState<"home" | "menu" | "gd" | "chat">("home");
  const [visibleMsgs, setVisibleMsgs] = useState<number[]>([]);
  const [typingIdx, setTypingIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    const cycle = ++cycleRef.current;
    const sequence: [number, () => void][] = [
      [1200, () => setScreen("menu")],
      [900, () => setScreen("gd")],
      [800, () => setScreen("chat")],
      [500, () => setVisibleMsgs([0])],
      [1400, () => setVisibleMsgs([0, 1])],
      [600, () => setTypingIdx(2)],
      [900, () => { setTypingIdx(null); setVisibleMsgs([0, 1, 2]); }],
      [700, () => setVisibleMsgs([0, 1, 2, 3])],
      [1600, () => setVisibleMsgs([0, 1, 2, 3, 4])],
      [700, () => setTypingIdx(5)],
      [1200, () => { setTypingIdx(null); setVisibleMsgs([0, 1, 2, 3, 4, 5]); }],
      [3000, () => {
        if (cycle !== cycleRef.current) return;
        setScreen("home");
        setVisibleMsgs([]);
        setTypingIdx(null);
      }],
    ];
    let idx = 0;
    function run() {
      if (idx >= sequence.length) return;
      const [delay, fn] = sequence[idx++];
      timerRef.current = setTimeout(() => { if (cycle === cycleRef.current) { fn(); run(); } }, delay);
    }
    run();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [screen === "home" && visibleMsgs.length === 0 ? 1 : 0]);

  const HOME_OPTIONS = [
    { icon: "📊", text: "Analisar Power BI e preparar argumentos" },
    { icon: "💊", text: "Dicas de abordagem com medicos e drogarias" },
    { icon: "🎯", text: "Como se posicionar em acompanhamentos com GD/GR/GN" },
    { icon: "🗣️", text: "Relacionamento com gestores" },
    { icon: "📸", text: "Manda print do Power BI ou MDTR que eu analiso" },
    { icon: "🏆", text: "Simular processo seletivo - propagandista" },
  ];

  const GD_OPTIONS = [
    "Iniciar processo completo para GD",
    "Treinar apresentacao e motivacao",
    "Treinar perguntas de lideranca e gestao",
    "Treinar pressao sobre mudanca de cidade",
    "Treinar etapa final com GN",
  ];

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, height: "100%", display: "flex", flexDirection: "column", background: "#0D1117", color: "#F0EDE6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px 2px", fontSize: 10, fontWeight: 700 }}>
        <span>09:21</span><span>EscalaIA</span>
      </div>
      <div style={{ padding: "5px 12px 7px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#F0EDE6", cursor: "pointer" }}>Voltar</button>
        <div style={{ flex: 1, textAlign: "center" as const }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
            <span style={{ fontWeight: 800, fontSize: 13, color: "#4ADE80" }}>EscalaIA</span>
            {(screen === "gd" || screen === "chat") && (
              <span style={{ fontSize: 8, background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8", padding: "1px 6px", borderRadius: 100, fontWeight: 700 }}>PROCESSO GD</span>
            )}
          </div>
          <div style={{ fontSize: 9, color: "rgba(240,237,230,0.45)" }}>
            {(screen === "gd" || screen === "chat") ? "Simulador de promocao para GD" : "Assistente do propagandista medico"}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#F0EDE6", cursor: "pointer" }}>
            Processo Seletivo
          </button>
          {screen === "menu" && (
            <div style={{ position: "absolute", right: 0, top: "110%", zIndex: 10, minWidth: 160, background: "#1a1a2e", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: "#FBBF24", background: "rgba(251,191,36,0.12)" }}>Processo para Propagandista</div>
              <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: "#818cf8", background: "rgba(99,102,241,0.10)" }}>Processo para GD</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(screen === "home" || screen === "menu") && (
          <>
            <div style={{ background: "rgba(26,107,74,0.15)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "12px" }}>
              <div style={{ color: "#4ADE80", fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Fala rep! Sou a EscalaIA.</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,230,0.7)", lineHeight: 1.6 }}>To aqui pra te ajudar no dia a dia - Power BI, acompanhamento com GD, medico dificil, processo seletivo. So chamar.</div>
            </div>
            {HOME_OPTIONS.map((o, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "rgba(240,237,230,0.80)", display: "flex", gap: 7, alignItems: "center" }}>
                <span>{o.icon}</span><span>{o.text}</span>
              </div>
            ))}
          </>
        )}

        {screen === "gd" && (
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "14px 12px" }}>
            <div style={{ color: "#818cf8", fontWeight: 800, fontSize: 12, marginBottom: 5 }}>Simulador - Promocao para GD</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.55)", lineHeight: 1.6, marginBottom: 10 }}>Processo conduzido por GRs com validacao final pelo GN. Pressao real, perguntas dificeis, foco em lideranca, mudanca de cidade e gestao de equipe.</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 9, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8", padding: "3px 8px", borderRadius: 100, fontWeight: 700 }}>Entrevistas com GRs</span>
              <span style={{ fontSize: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,237,230,0.6)", padding: "3px 8px", borderRadius: 100, fontWeight: 700 }}>Validacao com GN</span>
            </div>
            {GD_OPTIONS.map((o, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "8px 10px", fontSize: 10, color: "rgba(240,237,230,0.70)", marginBottom: i < GD_OPTIONS.length - 1 ? 4 : 0 }}>{o}</div>
            ))}
          </div>
        )}

        {screen === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {AI_CHAT.map((msg, i) => {
              if (!visibleMsgs.includes(i)) return null;
              const isUser = msg.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "82%",
                    background: isUser ? "#5046e5" : "rgba(255,255,255,0.07)",
                    border: isUser ? "none" : "1px solid rgba(255,255,255,0.10)",
                    borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                    padding: "9px 11px", fontSize: 10.5, lineHeight: 1.6,
                    color: isUser ? "#fff" : "rgba(240,237,230,0.85)",
                    whiteSpace: "pre-wrap",
                  }}>{msg.text}</div>
                </div>
              );
            })}
            {typingIdx !== null && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px 12px 12px 3px", padding: "9px 14px", fontSize: 12, color: "rgba(240,237,230,0.6)" }}>...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "6px 10px 8px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "6px 12px", fontSize: 10, color: "rgba(240,237,230,0.35)" }}>
          {(screen === "gd" || screen === "chat") ? "Sua resposta para o GR..." : "Pergunta, duvida ou Power BI..."}
        </div>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1A6B4A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>▶</div>
      </div>
    </div>
  );
}

function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", color: "#4ADE80", textTransform: "uppercase" as const, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 100, padding: "4px 14px" }}>{label}</div>
      )}
      <div style={{ width: 220, height: 440, background: "#000", borderRadius: 36, border: "6px solid #1a1a1a", boxShadow: "0 0 0 1px #333, 0 24px 60px rgba(0,0,0,0.45)", overflow: "hidden", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 70, height: 18, background: "#000", borderRadius: "0 0 14px 14px", zIndex: 10 }} />
        <div style={{ height: "100%", overflowY: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: "📋", tag: null, title: "Rotina de visitacao organizada", desc: "Cadastre medicos por cidade, UF, dia e periodo. Filtros disponiveis com 1 toque. Ideal para quem atende varias regioes e cidades." },
    { icon: "📥", tag: null, title: "Importacao via Excel", desc: "Ja tem uma base de medicos? Importe tudo de uma vez pelo Excel. Zero retrabalho, zero digitacao manual." },
    { icon: "🔍", tag: null, title: "Diretorio unificado de medicos", desc: "Acesse todos os medicos cadastrados na base EscalaMed. Encontre e importe para sua escala com 1 clique." },
    { icon: "🔔", tag: null, title: "Aviso de duplicidade de cadastro", desc: "Monitoramos nome e telefone de cada medico da sua base. Se outro propagandista cadastrar o mesmo medico em outra UF - o sistema avisa na hora." },
    { icon: "👥", tag: null, title: "Grupos colaborativos", desc: "Crie um grupo fechado com sua equipe. Cada membro visualiza os medicos da base dos outros." },
    { icon: "✉️", tag: null, title: "Medico solicita visita", desc: "Medicos podem solicitar sua visita diretamente pelo app. Voce recebe nome, CRM, clinica, telefone, cidade e os melhores dias para ir." },
  ];

  const aiFeatures = [
    { icon: "🏆", title: "Processo Seletivo GD - Treine", desc: "Simule um processo seletivo real. Feedback apos cada resposta. Prepare-se de verdade antes da entrevista.", highlight: true, badge: "Avance na carreira", badgeColor: "#FBBF24" },
    { icon: "🎯", title: "Processo Seletivo - Propagandista (Neofito)", desc: "Quer entrar na industria farmaceutica mas nao sabe por onde comecar? Simule o processo seletivo completo.", highlight: true, badge: "Para quem quer entrar", badgeColor: "#4ADE80" },
    { icon: "📊", title: "Analise de Power BI e CRM", desc: "Manda o print do painel. A IA identifica o que esta subindo, o que esta caindo e monta argumento pronto para sua reuniao.", highlight: false },
    { icon: "🎭", title: "Simulador de Acompanhamento", desc: "Treine antes do acompanhamento real. A IA age como Gerente medico e da feedback honesto sobre sua postura.", highlight: false },
    { icon: "💊", title: "Dicas Clinicas e de Produto", desc: "Mecanismo de acao, classe terapeutica, diferenciais, concorrentes e objecoes medicas - tudo com linguagem pratica de rep.", highlight: false },
    { icon: "🗣️", title: "Estrategia com Medicos e Drogarias", desc: "Como abordar medico dificil, como trabalhar CAT 1 e CAT 2, como convencer drogaria no pre-pedido.", highlight: false },
    { icon: "📍", title: "Memoria de Territorio", desc: "Conta seu setor uma vez. A IA lembra dos seus medicos parceiros, dificeis, bricks fortes e fracos.", highlight: false },
  ];

  return (
    <main style={{ fontFamily: "DM Sans, sans-serif", background: "#F5F3EE", color: "#0D1117", overflowX: "hidden" }}>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(245,243,238,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(26,107,74,0.12)" : "none", transition: "all 0.3s" }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>
          <span style={{ color: scrolled ? "#0D1117" : "#F0EDE6" }}>Escala</span>
          <span style={{ color: "#1A6B4A" }}>Med</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid rgba(13,17,23,0.15)", background: "transparent", color: scrolled ? "#0D1117" : "#F0EDE6", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Entrar</a>
          <button type="button" onClick={() => router.push("/signup")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1A6B4A", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(26,107,74,0.30)" }}>Criar conta gratis</button>
        </div>
      </nav>

      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden", background: "#0D1117" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 600, height: 500, background: "radial-gradient(circle, rgba(26,107,74,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(26,107,74,0.15)", border: "1px solid rgba(26,107,74,0.35)", borderRadius: 100, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", marginBottom: 28, textTransform: "uppercase" as const }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80", display: "inline-block" }} />
          Para propagandistas medicos
        </div>

        <h1 style={{ fontWeight: 800, fontSize: "clamp(36px, 8vw, 72px)", lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 24px", maxWidth: 800, color: "#F0EDE6" }}>
          Sua escala <span style={{ color: "#1A6B4A", textShadow: "0 0 40px rgba(26,107,74,0.5)" }}>mais inteligente</span> e segura
        </h1>

        <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "rgba(240,237,230,0.60)", maxWidth: 520, lineHeight: 1.7, margin: "0 0 36px" }}>
          Crie sua conta e experimente GRATUITAMENTE a IA que vai impulsinar sua aprovação e acelerar sua promoção"
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center", marginBottom: 56 }}>
          <button type="button" onClick={() => router.push("/signup")} style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1A6B4A, #22c55e)", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 32px rgba(26,107,74,0.40)" }}>
            Criar conta gratis
          </button>
          <a href="/login" style={{ padding: "14px 28px", borderRadius: 12, border: "1.5px solid rgba(240,237,230,0.20)", color: "rgba(240,237,230,0.75)", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Ja tenho conta
          </a>
        </div>

        <div style={{ display: "flex", gap: 48, flexWrap: "wrap" as const, justifyContent: "center", marginBottom: 64 }}>
          {[{ value: "20000+", label: "Medicos no diretorio" }, { value: "27", label: "Estados cobertos" }, { value: "Gratis", label: "Para comecar" }].map(s => (
            <div key={s.label} style={{ textAlign: "center" as const }}>
              <div style={{ fontWeight: 800, fontSize: 32, color: "#4ADE80", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.50)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <PhoneFrame label="Veja como funciona - e gratis">
          <EscalaMockup />
        </PhoneFrame>
      </section>

      <section style={{ padding: "80px 24px 40px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "#4ADE80", textTransform: "uppercase" as const, marginBottom: 12 }}>Inteligencia Artificial</div>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 5vw, 40px)", letterSpacing: "-0.02em", margin: "0 0 12px", color: "#0D1117" }}>Conheca a EscalaIA</h2>
          <p style={{ fontSize: 14, color: "#8A9BB0", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>A unica IA treinada para o universo do propagandista medico farmaceutico brasileiro.</p>
        </div>

        <div style={{ background: "linear-gradient(135deg, #0A1F14 0%, #0D2B1A 60%, #0F3320 100%)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "28px 24px", boxShadow: "0 8px 40px rgba(26,107,74,0.20)", position: "relative", overflow: "hidden", marginBottom: 12 }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(74,222,128,0.07)", pointerEvents: "none" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.30)", borderRadius: 100, padding: "4px 14px", fontSize: 10, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.12em", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80", display: "inline-block" }} />
            INTELIGENCIA ARTIFICIAL EXCLUSIVA
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
            {aiFeatures.map((f) => (
              <div key={f.title} style={{ background: f.highlight ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.04)", border: f.highlight ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: f.highlight ? "rgba(251,191,36,0.15)" : "rgba(74,222,128,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as const }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: f.highlight ? "#FBBF24" : "#F5F3EE" }}>{f.title}</span>
                    {f.badge && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: f.badgeColor === "#4ADE80" ? "rgba(74,222,128,0.20)" : "rgba(251,191,36,0.20)", border: f.badgeColor === "#4ADE80" ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(251,191,36,0.35)", color: f.badgeColor, padding: "2px 8px", borderRadius: 100, letterSpacing: "0.10em" }}>{f.badge}</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <PhoneFrame label="EscalaIA em acao">
              <EscalaIAMockup />
            </PhoneFrame>
          </div>

          <button type="button" onClick={() => router.push("/signup")} style={{ width: "100%", padding: "14px 24px", background: "linear-gradient(135deg, #1A6B4A, #4ADE80)", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", color: "#0A0F0D", cursor: "pointer", boxShadow: "0 8px 32px rgba(74,222,128,0.30)" }}>
            CRIAR CONTA E EXPERIMENTAR A ESCALAIA
          </button>
          <p style={{ textAlign: "center" as const, margin: "10px 0 0", fontSize: 11, color: "rgba(74,222,128,0.55)" }}>Cadastro gratuito - sem cartao de credito</p>
        </div>
      </section>

      <section style={{ padding: "40px 24px 80px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "#1A6B4A", textTransform: "uppercase" as const, marginBottom: 12 }}>Funcionalidades</div>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 5vw, 40px)", letterSpacing: "-0.02em", margin: 0, color: "#0D1117" }}>Tudo no mesmo lugar</h2>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "#FFFFFF", border: "1px solid rgba(13,17,23,0.07)", borderLeft: "3px solid #1A6B4A", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 18, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(13,17,23,0.06)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "rgba(26,107,74,0.10)", border: "1px solid rgba(26,107,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" as const }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0D1117" }}>{f.title}</span>
                  {f.tag && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100, background: "rgba(212,130,10,0.12)", color: "#D4820A", border: "1px solid rgba(212,130,10,0.25)" }}>{f.tag}</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#8A9BB0", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "20px 24px 60px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid rgba(13,17,23,0.07)", borderRadius: 20, padding: "36px 28px", textAlign: "center" as const, boxShadow: "0 1px 4px rgba(13,17,23,0.06)" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 32px)", letterSpacing: "-0.02em", margin: "0 0 12px", color: "#0D1117" }}>
            Comece agora, <span style={{ color: "#1A6B4A" }}>gratuitamente</span>
          </h2>
          <p style={{ fontSize: 14, color: "#8A9BB0", lineHeight: 1.65, margin: "0 0 24px" }}>
            Crie sua conta e organize sua escala hoje mesmo. Plano Premium disponivel por apenas <strong style={{ color: "#0D1117" }}>R$29,90/mes</strong>. Cancele quando quiser.
          </p>
          <button type="button" onClick={() => router.push("/signup")} style={{ width: "100%", padding: "14px 24px", background: "linear-gradient(135deg, #1A6B4A, #22c55e)", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, color: "white", cursor: "pointer", boxShadow: "0 8px 32px rgba(26,107,74,0.30)" }}>
            Criar conta gratis agora
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#8A9BB0" }}>Sem cartao de credito - cancele quando quiser</p>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(13,17,23,0.08)", padding: "24px", textAlign: "center" as const, fontSize: 12, color: "rgba(13,17,23,0.35)" }}>
        {new Date().getFullYear()} EscalaMed - contato@escalamed.app.br
      </footer>
    </main>
  );
}