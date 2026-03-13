"use client";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UFS, CITIES_BY_UF } from "@/data/cities";

console.log(
  "ENV TEST:",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12)
);
type Weekday =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta";

type Period = "Manhã" | "Tarde";

const WEEKDAYS: Weekday[] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
];

type Doctor = {
  id: string;
  name: string;
  clinic: string | null;
  address: string | null;
  phone: string | null;
  specialty: string | null;
};

export default function Page() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uf, setUf] = useState<typeof UFS[number]>(() => {
  if (typeof window === "undefined") return UFS[0];
  return (localStorage.getItem("filter_uf") as typeof UFS[number]) || UFS[0];
});
const cities = useMemo(() => CITIES_BY_UF[uf as keyof typeof CITIES_BY_UF] ?? [], [uf]);
const [city, setCity] = useState(() => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("filter_city") || "";
});
const [weekday, setWeekday] = useState<Weekday>(() => {
  if (typeof window === "undefined") return "Terça";
  return (localStorage.getItem("filter_weekday") as Weekday) || "Terça";
});
const [period, setPeriod] = useState<Period>(() => {
  if (typeof window === "undefined") return "Manhã";
  return (localStorage.getItem("filter_period") as Period) || "Manhã";
});
  const [menuOpen, setMenuOpen] = useState(false);
  const [visitRequestsCount, setVisitRequestsCount] = useState(0);

  useEffect(() => {
  localStorage.setItem("filter_uf", uf);
  localStorage.setItem("filter_city", city);
  localStorage.setItem("filter_weekday", weekday);
  localStorage.setItem("filter_period", period);
}, [uf, city, weekday, period]);

  // ── ALTERADO: estilos visuais ──
  const btnStyle: React.CSSProperties = {
    width: "100%",
    height: 36,
    padding: "0 14px",
    borderRadius: 8,
    border: "1.5px solid rgba(13,17,23,0.12)",
    cursor: "pointer",
    background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: "#0D1117",
  };

  const deleteBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "#FFF0EE",
    border: "1.5px solid rgba(192,57,43,0.20)",
    color: "#C0392B",
    marginTop: 6,
  };

  const selectStyle: React.CSSProperties = {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    color: "#0D1117",
    width: "100%",
  };

  const filterLabelStyle: React.CSSProperties = {
    display: "grid",
    gap: 6,
    padding: 12,
    border: "1px solid rgba(13,17,23,0.08)",
    borderRadius: 12,
    background: "#fff",
  };

  const filterSpanStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#8A9BB0",
  };

  const menuItemStyle: React.CSSProperties = {
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid rgba(13,17,23,0.08)",
    textDecoration: "none",
    color: "#0D1117",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  };

  async function handleDelete(doctorId: string) {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    const { data, error } = await supabase
    .from("user_doctors")
    .delete()
    .eq("doctor_id", doctorId)
    .eq("user_id", user.id)
    .select();
    console.log("DELETE user_doctors:", { data, error });

    if (error) {
      console.error("erro ao remover relação user_doctors:", error);
      alert("Erro ao excluir.");
      return;
    }

    setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
  }

useEffect(() => {
  setLoading(true);
  setErrorMsg("");
  const weekdayMap: Record<string, number> = {
  "Segunda": 1,
  "Terça": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
};
  const weekdayNumber = weekdayMap[weekday];
  const periodDb = period === "Manhã" ? "morning" : "afternoon";
  if (!uf || !city || !weekdayNumber || !periodDb) {
  setDoctors([]);
  setLoading(false);
  return;
}
const weekdayLabel = weekday;
  const run = async () => {
    setErrorMsg("");
const { data: authData, error: authError } = await supabase.auth.getUser();
const user = authData?.user;

if (authError || !user) {
  setDoctors([]);
  setLoading(false);
  setErrorMsg("Usuário não autenticado");
  return;
}

const { data: myLinks, error: myError } = await supabase
  .from("user_doctors")
  .select("doctor_id")
  .eq("user_id", user.id)
  .limit(2000);

if (myError) {
  console.log("MY LIST ERROR:", myError);
  setDoctors([]);
  setLoading(false);
  return;
}

const myDoctorIds = (myLinks ?? []).map((x: any) => x.doctor_id);

const { data: availability, error: availError } = await supabase
  .from("doctor_availability")
  .select("doctor_id")
  .ilike("slot", `%${weekdayLabel} ${period}%`)
  .limit(50);

if (availError) {
  console.log("AVAIL ERROR:", availError);
  setDoctors([]);
  setLoading(false);
  return;
}

const availabilityIds = availability?.map((a) => a.doctor_id) ?? [];
const doctorIds = availabilityIds;

if (doctorIds.length === 0) {
  setDoctors([]);
  setLoading(false);
  return;
}

const { data, error } = await supabase
  .from("doctors")
  .select("*")
  .eq("state", uf)
  .eq("city", city)
  .in("id", doctorIds)
  .order("created_at", { ascending: false });

   if (error) {
  console.log("SUPABASE ERROR:", error);
  setDoctors([]);
  setErrorMsg("Erro ao buscar médicos");
  setLoading(false);
  return;
}

 const rows = data ?? [];

const unique = Array.from(
  new Map(rows.map((d: any) => [d.id, d])).values()
);

setDoctors(unique);
setLoading(false);
  };

  run();
}, [uf, city, weekday, period]);

  const onChangeUF = (nextUf: typeof UFS[number]) => {
    setUf(nextUf);
    const nextCities = CITIES_BY_UF[nextUf] ?? [];
    setCity(nextCities[0] ?? "");
  };

  const title = useMemo(
    () => `${uf} · ${city} · ${weekday} · ${period}`,
    [uf, city, weekday, period]
  );

  return (
    // ── ALTERADO: background e fonte ──
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
      maxWidth: 920,
      margin: "0 auto",
    }}>

      {/* MENU DRAWER */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,17,23,0.45)",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 300,
              maxWidth: "85vw",
              height: "100%",
              // ── ALTERADO: menu escuro ──
              background: "#0D1117",
              padding: 16,
              boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* Header do menu */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#fff",
                }}>
                  Escala<span style={{ color: "#2A8F62" }}>Med</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>
                  propagandista
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                style={{
                  height: 30, width: 30,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >✕</button>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />

            {/* Itens do menu */}
            {[
              { href: "/medicos", icon: "👥", label: "Médicos cadastrados", badge: String(doctors.length) },
              { href: "/import",  icon: "⬆️", label: "Importar escala (Excel)" },
              { href: "/groups", icon: "👥", label: "Grupos", badge: "PREMIUM" },
              { href: "/directory", icon: "🔍", label: "Buscar médico (diretório)", badge: "PREMIUM" },
              { href: "/visit-request/requests", icon: "✉️", label: "Médico solicitou visita", badge: "PREMIUM" },
              { href: "/premium", icon: "⭐", label: "Plano Premium" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  padding: "12px 12px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, flexShrink: 0,
                }}>{item.icon}</div>
                <span style={{
                  flex: 1,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 13, fontWeight: 600,
                  color: "rgba(255,255,255,0.88)",
                }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: item.badge === "PAGO" ? "rgba(212,130,10,0.25)" : "#1A6B4A",
                    color: item.badge === "PAGO" ? "#D4820A" : "#fff",
                    fontSize: 10, fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    padding: "2px 8px", borderRadius: 100,
                  }}>{item.badge}</span>
                )}
              </a>
            ))}

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />

            {[
           { href: "/account", icon: "⚙️", label: "Minha conta" },
           { href: "/suporte", icon: "💬", label: "Suporte / Feedback" },
           ].map((item) => (
            
              <a key={item.label} href={item.href} style={{
                padding: "12px 12px", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 12,
                textDecoration: "none", cursor: "pointer",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15,
                }}>{item.icon}</div>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 13, fontWeight: 600,
                  color: "rgba(255,255,255,0.88)",
                }}>{item.label}</span>
              </a>
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />

            <a href="/login" style={{
              padding: "12px 12px", borderRadius: 10,
              display: "flex", alignItems: "center", gap: 12,
              textDecoration: "none", cursor: "pointer",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(192,57,43,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15,
              }}>🚪</div>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, fontWeight: 600, color: "#E57367",
              }}>Sair</span>
            </a>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
      }}>
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(true)}
          style={{
            height: 38, width: 38,
            borderRadius: 10,
            border: "1.5px solid rgba(13,17,23,0.10)",
            background: "#fff",
            cursor: "pointer",
            fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 3px rgba(13,17,23,0.06)",
          }}
        >☰</button>

        {/* ── ALTERADO: título com fonte Syne ── */}
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: "#0D1117",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{
            width: 8, height: 8,
            background: "#1A6B4A",
            borderRadius: "50%",
            display: "inline-block",
          }} />
          EscalaMed
        </div>

        <a
          href="/admin"
          aria-label="Novo cadastro"
          style={{
            height: 38, width: 38,
            borderRadius: "50%",
            border: "none",
            background: "#1A6B4A",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(26,107,74,0.35)",
          }}
        >+</a>
      </div>

      {/* SUBTÍTULO */}
      <p style={{
        marginBottom: 20,
        fontSize: 13,
        color: "#8A9BB0",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Médicos disponíveis por região e período
      </p>

      {/* FILTROS */}
      <div style={{ display: "grid", gap: 12, marginTop: 8 }}>

        {/* Linha 1: UF + Cidade */}
        <div style={{
          display: "grid",
          gap: 12,
          padding: 16,
          border: "1px solid rgba(13,17,23,0.08)",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(13,17,23,0.05)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={filterLabelStyle}>
              <span style={filterSpanStyle}>UF</span>
              <select
                value={uf}
                onChange={(e) => onChangeUF(e.target.value as typeof UFS[number])}
                style={selectStyle}
              >
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>

            <label style={filterLabelStyle}>
              <span style={filterSpanStyle}>Cidade</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={selectStyle}
              >
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Linha 2: Dia + Período */}
        <div style={{
          display: "grid",
          gap: 12,
          padding: 16,
          border: "1px solid rgba(13,17,23,0.08)",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(13,17,23,0.05)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={filterLabelStyle}>
              <span style={filterSpanStyle}>Dia da semana</span>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value as Weekday)}
                style={selectStyle}
              >
                {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>

            <label style={filterLabelStyle}>
              <span style={filterSpanStyle}>Período</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                style={selectStyle}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* RESULTADO ATIVO */}
      <div style={{
        marginTop: 16,
        border: "1px solid rgba(13,17,23,0.08)",
        borderRadius: 10,
        padding: "11px 16px",
        background: "#fff",
        fontSize: 13,
        color: "#4A5568",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        • {title}
      </div>

      {/* CARDS */}
      <section style={{ marginTop: 12 }}>
        {doctors.length === 0 ? (
          <div style={{
            padding: "14px 16px",
            border: "1.5px solid rgba(212,130,10,0.25)",
            background: "#FFF3DC",
            borderRadius: 12,
            fontSize: 13,
            color: "#7A4A00",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Nenhum médico encontrado para esse filtro.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {doctors.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: 16,
                  // ── ALTERADO: card com borda esquerda verde ──
                  border: "1px solid rgba(13,17,23,0.08)",
                  borderRadius: 14,
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
                  borderLeft: "3px solid #1A6B4A",
                }}
              >
                <div style={{ display: "grid", gap: 5 }}>
                  {/* ── ALTERADO: nome com Syne ── */}
                  <strong style={{
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    color: "#0D1117",
                  }}>{d.name}</strong>

                  <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                    {d.specialty} · {d.phone}
                  </div>

                  <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                    {d.clinic} — {d.address}
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {[uf, city, weekday, period].map((tag) => (
                      <span key={tag} style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "3px 8px", borderRadius: 100,
                        background: "#F5F3EE", color: "#4A5568",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => router.push(`/admin?id=${d.id}`)}
                    style={btnStyle}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    style={deleteBtnStyle}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 28, fontSize: 11, color: "#8A9BB0" }}>
        *Dados vindos do Supabase.
      </footer>
    </main>
  );
}