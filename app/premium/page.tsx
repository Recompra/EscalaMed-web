"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PremiumPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{
      minHeight: "100vh", background: "#0A0F0D",
      fontFamily: "'DM Sans', sans-serif",
      color: "#F5F3EE", overflowX: "hidden",
    }}>

      {/* Hero */}
      <section style={{
        maxWidth: 720, margin: "0 auto",
        padding: "56px 24px 40px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "all 0.6s ease",
      }}>
        <button type="button" onClick={() => router.push("/home")} style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#8A9BB0", padding: "7px 14px", borderRadius: 8,
          fontSize: 12, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 40, display: "block",
        }}>← Voltar</button>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(26,107,74,0.18)",
          border: "1px solid rgba(26,107,74,0.35)",
          borderRadius: 100, padding: "5px 14px",
          fontSize: 11, fontWeight: 700, color: "#4ADE80",
          letterSpacing: "0.10em", marginBottom: 24,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4ADE80", boxShadow: "0 0 8px #4ADE80",
            display: "inline-block",
          }}/>
          PARA PROPAGANDISTAS MÉDICOS
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(28px, 6vw, 42px)", lineHeight: 1.15,
          margin: "0 0 20px", color: "#F5F3EE",
        }}>
          Sua escala mais<br/>
          <span style={{
            background: "linear-gradient(90deg, #1A6B4A, #4ADE80)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>inteligente e segura</span>
        </h1>

        <p style={{
          fontSize: 15, color: "#8A9BB0", lineHeight: 1.7,
          margin: "0 0 8px", maxWidth: 520,
        }}>
          Tudo que um propagandista precisa para ter os melhores resultados
        </p>
      </section>

      {/* DESTAQUE ESCALAIA */}
      <section style={{
        maxWidth: 720, margin: "0 auto", padding: "0 24px 32px",
        opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.10s",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #0A1F14 0%, #0D2B1A 60%, #0F3320 100%)",
          border: "1px solid rgba(74,222,128,0.30)",
          borderRadius: 20, padding: "28px 24px",
          boxShadow: "0 8px 40px rgba(26,107,74,0.25)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "rgba(74,222,128,0.07)", pointerEvents: "none",
          }} />

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.30)",
            borderRadius: 100, padding: "4px 14px",
            fontSize: 10, fontWeight: 800, color: "#4ADE80",
            letterSpacing: "0.12em", marginBottom: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4ADE80", boxShadow: "0 0 8px #4ADE80",
              display: "inline-block",
            }}/>
            INTELIGÊNCIA ARTIFICIAL EXCLUSIVA
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "rgba(74,222,128,0.15)",
              border: "1px solid rgba(74,222,128,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>🤖</div>
            <div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 22, color: "#4ADE80", margin: "0 0 8px",
              }}>EscalaIA</h2>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                A única IA treinada especificamente para o universo do propagandista médico farmacêutico brasileiro. Não é um chatbot genérico — é um colega experiente que entende sua rotina, seus medos e seus objetivos.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              {
                icon: "🏆",
                title: "Processo Seletivo GD — Treine",
                desc: "Simule um processo seletivo real. Feedback após cada resposta. Prepare-se de verdade antes da entrevista.",
                highlight: true,
                badge: "Avance na carreira",
              },
              {
                icon: "🎯",
                title: "Simulador de Processo Seletivo — Propagandista (Neófito)",
                desc: "Quer entrar na indústria farmacêutica mas não sabe por onde começar? Simule o processo seletivo completo para a vaga de propagandista. A IA te guia por cada etapa, avalia seu perfil e te prepara para a entrevista real.",
                highlight: true,
                badge: "Para quem quer entrar",
                badgeColor: "#4ADE80",
              },
              {
                icon: "📊",
                title: "Análise de Power BI e CRM",
                desc: "Manda o print do painel. A IA identifica o que está subindo, o que está caindo, onde está a oportunidade e monta argumento pronto para sua reunião.",
              },
              {
                icon: "🎭",
                title: "Simulador de Acompanhamento",
                desc: "Treine antes do acompanhamento real. A IA age como Gerente ou médico — faz perguntas difíceis e dá feedback honesto sobre sua postura, fala e estratégia.",
              },
              {
                icon: "💊",
                title: "Dicas Clínicas e de Produto",
                desc: "Mecanismo de ação, classe terapêutica, diferenciais, concorrentes e objeções médicas — tudo com linguagem prática de rep, sem juridiquês e sem enrolação.",
              },
              {
                icon: "🗣️",
                title: "Estratégia com Médicos e Drogarias",
                desc: "Como abordar médico difícil, como trabalhar CAT 1 e CAT 2, como convencer drogaria no pré-pedido. A IA conhece a dinâmica real do mercado.",
              },
              {
                icon: "📍",
                title: "Memória de Território",
                desc: "Conta seu setor uma vez. A IA lembra dos seus médicos parceiros, difíceis, bricks fortes e fracos — e continua o papo como alguém que acompanha seu território.",
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: f.highlight ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.04)",
                border: f.highlight ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "16px 18px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: f.highlight ? "rgba(251,191,36,0.15)" : "rgba(74,222,128,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as const }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                      color: f.highlight ? "#FBBF24" : "#F5F3EE",
                    }}>{f.title}</span>
                    {f.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 800,
                        background: f.badgeColor ? "rgba(74,222,128,0.20)" : "rgba(251,191,36,0.20)",
                        border: f.badgeColor ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(251,191,36,0.35)",
                        color: f.badgeColor ?? "#FBBF24",
                        padding: "2px 8px", borderRadius: 100, letterSpacing: "0.10em",
                      }}>{f.badge}</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section style={{
        maxWidth: 720, margin: "0 auto", padding: "0 24px 48px",
        display: "grid", gap: 14,
        opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.15s",
      }}>
        {[
          { icon: "📋", title: "Rotina de visitação organizada", desc: "Cadastre médicos por cidade, UF, dia e período. Filtros disponíveis com 1 toque. Ideal para quem atende várias regiões e cidades." },
          { icon: "📥", title: "Importação via Excel", desc: "Já tem uma base de médicos? Importe tudo de uma vez pelo Excel. Zero retrabalho, zero digitação manual." },
          { icon: "🔍", title: "Diretório unificado de médicos", desc: "Acesse todos os médicos cadastrados na base EscalaMed. Encontre e importe para sua escala com 1 clique — sem digitar nada."},
          { icon: "🔔", title: "Aviso de duplicidade de cadastro", desc: "Monitoramos nome e telefone de cada médico da sua base. Se outro propagandista cadastrar o mesmo médico em outra UF — o sistema avisa na hora."},
          { icon: "👥", title: "Grupos colaborativos", desc: "Crie um grupo fechado com sua equipe. Cada membro visualiza os médicos da base dos outros — sem precisar perguntar, sem perder tempo."},
          { icon: "📨", title: "Médico solicita visita", desc: "Médicos podem solicitar sua visita diretamente pelo app. Você recebe nome, CRM, clínica, telefone, cidade e os melhores dias para ir."},
        ].map((b, i) => (
          <div key={b.title} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid #1A6B4A",
            borderRadius: 14, padding: "20px 22px",
            display: "flex", gap: 18, alignItems: "flex-start",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-12px)",
            transition: `all 0.5s ease ${0.2 + i * 0.08}s`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(26,107,74,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{b.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: 14, color: "#F5F3EE",
                }}>{b.title}</span>
               
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#8A9BB0", lineHeight: 1.65 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Social proof */}
      <section style={{
        maxWidth: 720, margin: "0 auto", padding: "0 24px 48px",
        opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.5s",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "20px 22px",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12, textAlign: "center",
        }}>
          {[
            { n: "20000+", label: "Médicos no diretório" },
            { n: "27", label: "Estados cobertos" },
            { n: "100%", label: "Web + Mobile" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 22, color: "#4ADE80",
              }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "#8A9BB0", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: 720, margin: "0 auto", padding: "0 24px 64px",
        display: "grid", gap: 12,
        opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.6s",
      }}>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #1A6B4A, #4ADE80)",
            color: "#0A0F0D", border: "none", borderRadius: 12,
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 15, letterSpacing: "0.08em",
            cursor: "pointer", width: "100%",
            boxShadow: "0 8px 32px rgba(74,222,128,0.30)",
          }}
        >
          ⭐ ASSINAR AGORA
        </button>

        <p style={{ textAlign: "center", fontSize: 11, color: "#4A5568", marginTop: 4 }}>
          Pagamento seguro · Cancele quando quiser · Sem taxa de adesão
        </p>
      </section>

      {/* Modal de planos */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 100, display: "flex",
            alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0D1A12",
              border: "1px solid rgba(74,222,128,0.20)",
              borderRadius: "20px 20px 0 0",
              padding: "32px 24px 48px",
              width: "100%", maxWidth: 720,
              display: "grid", gap: 12,
            }}
          >
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: 18, color: "#F5F3EE", marginBottom: 8,
              textAlign: "center",
            }}>Escolha seu plano</div>

            {[
              { plan: "mensal", label: "MENSAL", price: "R$ 29,90", sub: "por mês", highlight: false },
              { plan: "semestral", label: "SEMESTRAL", price: "R$ 131,90", sub: "equivale a R$ 21,98/mês", highlight: true, badge: "MELHOR CUSTO" },
              { plan: "anual", label: "ANUAL", price: "R$ 239,90", sub: "equivale a R$ 19,99/mês", highlight: false, badge: "MELHOR OFERTA" },
            ].map((p) => (
              <button
                key={p.plan}
                type="button"
                onClick={async () => {
                  setModalOpen(false);
                  const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: p.plan }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data?.init_point) {
                    alert("Erro ao criar checkout");
                    return;
                  }
                  window.open(data.init_point, "_blank");
                }}
                style={{
                  padding: "18px 20px",
                  background: p.highlight ? "rgba(74,222,128,0.10)" : "rgba(255,255,255,0.04)",
                  border: p.highlight ? "1.5px solid rgba(74,222,128,0.40)" : "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14, cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: p.highlight ? "#4ADE80" : "#8A9BB0",
                      letterSpacing: "0.10em",
                    }}>{p.label}</span>
                    {p.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 100,
                        background: "rgba(74,222,128,0.15)", color: "#4ADE80",
                        border: "1px solid rgba(74,222,128,0.30)", letterSpacing: "0.10em",
                      }}>{p.badge}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A9BB0" }}>{p.sub}</div>
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: 18, color: "#F5F3EE",
                }}>{p.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}