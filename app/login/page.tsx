"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: "📋",
      tag: null,
      title: "Rotina de visitação organizada",
      desc: "Cadastre médicos por cidade, UF, dia e período. Filtre disponíveis com 1 toque e nunca mais perca uma visita por falta de organização.",
    },
    {
      icon: "📥",
      tag: null,
      title: "Importação via Excel",
      desc: "Já tem uma base de médicos? Importe tudo de uma vez pelo Excel. Zero retrabalho, zero digitação manual.",
    },
    {
      icon: "🔍",
      tag: "PREMIUM",
      title: "Diretório unificado de médicos",
      desc: "Acesse todos os médicos cadastrados na base EscalaMed. Encontre, audite e importe para sua escala com 1 clique — sem digitar nada.",
    },
    {
      icon: "🔔",
      tag: "NOVO",
      title: "Aviso de duplicidade de cadastro",
      desc: "Se um médico do seu painel for cadastrado em outra UF, você recebe um alerta imediato. E se você tentar cadastrar um médico já registrado em outra UF, o sistema avisa antes.",
    },
    {
      icon: "👥",
      tag: "PREMIUM",
      title: "Grupos colaborativos",
      desc: "Crie um grupo fechado com sua equipe. Cada membro visualiza os médicos da base dos outros — sem precisar perguntar, sem perder tempo.",
    },
    {
      icon: "✉️",
      tag: "PREMIUM",
      title: "Médico solicita visita",
      desc: "Médicos podem solicitar sua visita diretamente pelo app. Você recebe nome, CRM, clínica, cidade e os melhores dias para ir.",
    },
  ];

  const stats = [
    { value: "240+", label: "Médicos no diretório" },
    { value: "27", label: "Estados cobertos" },
    { value: "100%", label: "Web + Mobile" },
  ];

  return (
    <main style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#07100D",
      color: "#F0EDE6",
      overflowX: "hidden",
    }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(7,16,13,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(26,107,74,0.15)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em",
        }}>
          <span style={{ color: "#F0EDE6" }}>Escala</span>
          <span style={{ color: "#1A6B4A" }}>Med</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" onClick={() => router.push("/login")} style={{
            padding: "8px 18px", borderRadius: 8,
            border: "1.5px solid rgba(240,237,230,0.20)",
            background: "transparent", color: "#F0EDE6",
            fontFamily: "'Syne', sans-serif", fontSize: 12,
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
          }}>Entrar</button>
          <button type="button" onClick={() => router.push("/signup")} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "#1A6B4A", color: "white",
            fontFamily: "'Syne', sans-serif", fontSize: 12,
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
            boxShadow: "0 0 20px rgba(26,107,74,0.40)",
          }}>Criar conta</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "100px 24px 60px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "20%", left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(26,107,74,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(26,107,74,0.15)",
          border: "1px solid rgba(26,107,74,0.35)",
          borderRadius: 100, padding: "6px 16px",
          fontSize: 11, fontWeight: 700, color: "#4ADE80",
          letterSpacing: "0.12em", marginBottom: 28,
          textTransform: "uppercase" as const,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4ADE80", boxShadow: "0 0 8px #4ADE80",
            display: "inline-block",
          }} />
          Para propagandistas médicos
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(36px, 8vw, 72px)",
          lineHeight: 1.05, letterSpacing: "-0.03em",
          margin: "0 0 24px", maxWidth: 800,
        }}>
          Sua escala{" "}
          <span style={{ color: "#1A6B4A", textShadow: "0 0 40px rgba(26,107,74,0.5)" }}>
            mais inteligente
          </span>
          {" "}e segura
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2.5vw, 18px)",
          color: "rgba(240,237,230,0.60)", maxWidth: 520,
          lineHeight: 1.7, margin: "0 0 44px",
        }}>
          Tudo que um propagandista precisa para não perder visita,
          não repetir médico e fechar mais resultados.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
          <button type="button" onClick={() => router.push("/signup")} style={{
            padding: "16px 32px", borderRadius: 12,
            border: "none", background: "#1A6B4A", color: "white",
            fontFamily: "'Syne', sans-serif", fontSize: 14,
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
            boxShadow: "0 4px 32px rgba(26,107,74,0.50)",
          }}>Criar conta grátis →</button>
          <button type="button" onClick={() => router.push("/login")} style={{
            padding: "16px 32px", borderRadius: 12,
            border: "1.5px solid rgba(240,237,230,0.15)",
            background: "rgba(240,237,230,0.05)", color: "#F0EDE6",
            fontFamily: "'Syne', sans-serif", fontSize: 14,
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
          }}>Já tenho conta</button>
        </div>

        <div style={{
          display: "flex", gap: 48, marginTop: 72,
          flexWrap: "wrap" as const, justifyContent: "center",
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" as const }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 32, color: "#4ADE80", letterSpacing: "-0.02em",
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.50)", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section style={{ padding: "80px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 56 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            color: "#4ADE80", textTransform: "uppercase" as const, marginBottom: 12,
          }}>Funcionalidades</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(26px, 5vw, 40px)",
            letterSpacing: "-0.02em", margin: 0, color: "#F0EDE6",
          }}>Tudo no mesmo lugar</h2>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(26,107,74,0.20)",
              borderLeft: "3px solid #1A6B4A",
              borderRadius: 16, padding: "20px 22px",
              display: "flex", gap: 18, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(26,107,74,0.15)",
                border: "1px solid rgba(26,107,74,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginBottom: 6, flexWrap: "wrap" as const,
                }}>
                  <span style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, fontSize: 15, color: "#F0EDE6",
                  }}>{f.title}</span>
                  {f.tag && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
                      padding: "3px 8px", borderRadius: 100,
                      background: f.tag === "PREMIUM"
                        ? "rgba(212,130,10,0.20)" : "rgba(26,107,74,0.25)",
                      color: f.tag === "PREMIUM" ? "#F59E0B" : "#4ADE80",
                      border: f.tag === "PREMIUM"
                        ? "1px solid rgba(212,130,10,0.30)"
                        : "1px solid rgba(74,222,128,0.30)",
                    }}>{f.tag}</span>
                  )}
                </div>
                <p style={{
                  fontSize: 13, color: "rgba(240,237,230,0.55)",
                  lineHeight: 1.65, margin: 0,
                }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        padding: "80px 24px 100px",
        textAlign: "center" as const, position: "relative",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(circle, rgba(26,107,74,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          maxWidth: 560, margin: "0 auto",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(26,107,74,0.25)",
          borderRadius: 24, padding: "48px 32px", position: "relative",
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(24px, 4vw, 36px)",
            letterSpacing: "-0.02em", margin: "0 0 16px", color: "#F0EDE6",
          }}>
            Comece agora,{" "}
            <span style={{ color: "#4ADE80" }}>gratuitamente</span>
          </h2>
          <p style={{
            fontSize: 14, color: "rgba(240,237,230,0.55)",
            lineHeight: 1.65, margin: "0 0 36px",
          }}>
            Crie sua conta e organize sua escala hoje mesmo.<br />
            Plano Premium disponível por apenas{" "}
            <strong style={{ color: "#F0EDE6" }}>R$29/mês</strong>.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <button type="button" onClick={() => router.push("/signup")} style={{
              padding: "16px", borderRadius: 12,
              border: "none", background: "#1A6B4A", color: "white",
              fontFamily: "'Syne', sans-serif", fontSize: 14,
              fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
              boxShadow: "0 4px 32px rgba(26,107,74,0.40)",
            }}>Criar conta grátis →</button>
            <button type="button" onClick={() => router.push("/visit-request")} style={{
              padding: "14px", borderRadius: 12,
              border: "1.5px solid rgba(240,237,230,0.12)",
              background: "rgba(240,237,230,0.04)", color: "rgba(240,237,230,0.70)",
              fontFamily: "'Syne', sans-serif", fontSize: 13,
              fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
            }}>É médico? Solicitar visita do representante</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(240,237,230,0.06)",
        padding: "24px", textAlign: "center" as const,
        fontSize: 12, color: "rgba(240,237,230,0.30)",
      }}>
        © {new Date().getFullYear()} EscalaMed · contato@escalamed.app.br
      </footer>
    </main>
  );
}