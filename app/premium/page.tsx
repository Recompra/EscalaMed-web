"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PremiumPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0A0F0D",
      fontFamily: "'DM Sans', sans-serif",
      color: "#F5F3EE",
      overflowX: "hidden",
    }}>

      {/* Hero */}
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "56px 24px 40px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "all 0.6s ease",
      }}>
        <button
          type="button"
          onClick={() => router.push("/home")}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#8A9BB0",
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 40,
            display: "block",
          }}
        >← Voltar</button>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(26,107,74,0.18)",
          border: "1px solid rgba(26,107,74,0.35)",
          borderRadius: 100,
          padding: "5px 14px",
          fontSize: 11,
          fontWeight: 700,
          color: "#4ADE80",
          letterSpacing: "0.10em",
          marginBottom: 24,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4ADE80",
            boxShadow: "0 0 8px #4ADE80",
            display: "inline-block",
          }}/>
          PARA PROPAGANDISTAS MÉDICOS
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(28px, 6vw, 42px)",
          lineHeight: 1.15,
          margin: "0 0 20px",
          color: "#F5F3EE",
        }}>
          Sua escala mais<br/>
          <span style={{
            background: "linear-gradient(90deg, #1A6B4A, #4ADE80)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>inteligente e segura</span>
        </h1>

        <p style={{
          fontSize: 15,
          color: "#8A9BB0",
          lineHeight: 1.7,
          margin: "0 0 40px",
          maxWidth: 520,
        }}>
          Tudo que um propagandista precisa para não perder visita,
          não repetir médico e fechar mais resultados.
        </p>

        {/* Preço */}
        <div style={{
          background: "rgba(26,107,74,0.10)",
          border: "1.5px solid rgba(26,107,74,0.30)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 40,
          display: "inline-block",
          minWidth: 260,
        }}>
          <div style={{ fontSize: 12, color: "#4ADE80", fontWeight: 700, letterSpacing: "0.10em", marginBottom: 8 }}>
            ACESSO COMPLETO
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: "#F5F3EE", lineHeight: 1 }}>
              R$&nbsp;29
            </span>
            <span style={{ fontSize: 14, color: "#8A9BB0", paddingBottom: 6 }}>/mês</span>
          </div>
          <div style={{ fontSize: 12, color: "#8A9BB0" }}>Cancele quando quiser. Sem fidelidade.</div>
        </div>
      </section>

      {/* Benefícios */}
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 24px 48px",
        display: "grid",
        gap: 14,
        opacity: visible ? 1 : 0,
        transition: "all 0.7s ease 0.15s",
      }}>
        {[
          {
            icon: "📋",
            title: "Rotina de visitação organizada",
            desc: "Cadastre médicos por cidade, UF, dia e período. Filtros disponíveis com 1 toque. Ideal para quem atende varias regiões e cidades.",
          },
          {
            icon: "📥",
            title: "Importação via Excel",
            desc: "Já tem uma base de médicos? Importe tudo de uma vez pelo Excel. Zero retrabalho, zero digitação manual.",
          },
          {
            icon: "🔍",
            title: "Diretório unificado de médicos",
            desc: "Acesse todos os médicos cadastrados na base EscalaMed. Encontre e importe para sua escala com 1 clique — sem digitar nada. Ideal para encontrar aquele médico auditado que não está cadastrado.",
            badge: "PREMIUM",
          },
          {
            icon: "🔔",
            title: "Aviso de duplicidade de cadastro",
            desc: "Monitoramos nome e telefone de cada médico da sua base. Se outro propagandista cadastrar o mesmo médico em outra UF — o sistema avisa na hora. Mantenha esses campos atualizados e tenha mais segurança na sua escala.",
            badge: "PREMIUM",
          },
          {
            icon: "👥",
            title: "Grupos colaborativos",
            desc: "Crie um grupo fechado com sua equipe. Cada membro visualiza os médicos da base dos outros — sem precisar perguntar, sem perder tempo.",
            badge: "PREMIUM",
          },
          {
            icon: "📨",
            title: "Médico solicita visita",
            desc: "Médicos podem solicitar sua visita diretamente pelo app. Você recebe nome, CRM, clínica, telefone, cidade e os melhores dias para ir.",
            badge: "PREMIUM",
          },
        ].map((b, i) => (
          <div
            key={b.title}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: "3px solid #1A6B4A",
              borderRadius: 14,
              padding: "20px 22px",
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-12px)",
              transition: `all 0.5s ease ${0.2 + i * 0.08}s`,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(26,107,74,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{b.icon}</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 14,
                  color: "#F5F3EE",
                }}>{b.title}</span>
                {b.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    padding: "2px 8px", borderRadius: 100,
                    background: "rgba(212,130,10,0.20)",
                    color: "#D4820A",
                    border: "1px solid rgba(212,130,10,0.30)",
                    letterSpacing: "0.10em",
                  }}>{b.badge}</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#8A9BB0", lineHeight: 1.65 }}>
                {b.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Social proof — ✅ atualizado para 4000+ */}
      <section style={{
        maxWidth: 720, margin: "0 auto", padding: "0 24px 48px",
        opacity: visible ? 1 : 0, transition: "all 0.7s ease 0.5s",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "20px 22px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          textAlign: "center",
        }}>
          {[
            { n: "4000+", label: "Médicos no diretório" },
            { n: "27", label: "Estados cobertos" },
            { n: "100%", label: "Web + Mobile" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: 22,
                color: "#4ADE80",
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
          onClick={() => alert("Em breve: integração com pagamento.")}
          style={{
            padding: "16px 24px",
            background: "linear-gradient(135deg, #1A6B4A, #145c3e)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(26,107,74,0.45)",
            width: "100%",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,107,74,0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,107,74,0.45)";
          }}
        >
          ASSINAR AGORA — R$ 29/mês
        </button>

        <button
          type="button"
          onClick={() => alert("Em breve: trial gratuito.")}
          style={{
            padding: "14px 24px",
            background: "transparent",
            color: "#8A9BB0",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Testar grátis por 7 dias
        </button>

        <p style={{ textAlign: "center", fontSize: 11, color: "#4A5568", margin: 0 }}>
          Pagamento seguro · Cancele quando quiser · Sem taxa de adesão
        </p>
      </section>

    </main>
  );
}