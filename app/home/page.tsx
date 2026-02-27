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



// ===== MOCK (depois trocamos por Supabase) =====
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
  const [uf, setUf] = useState<typeof UFS[number]>(UFS[0]);
  const cities = useMemo(() => CITIES_BY_UF[uf as keyof typeof CITIES_BY_UF] ?? [],[uf]);
  const [city, setCity] = useState(cities[0] ?? "");
  const [weekday, setWeekday] = useState<Weekday>("Terça");
  const [period, setPeriod] = useState<Period>("Manhã");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visitRequestsCount, setVisitRequestsCount] = useState(0);

  // reusable button styles (matches styles used in /my page)
  const btnStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    cursor: "pointer",
  };

  const deleteBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "#b91c1c",
    color: "white",
    marginTop: 8,
  };

  async function handleDelete(doctorId: string) {
    const ok = window.confirm("Deseja excluir este médico da sua lista?");
    if (!ok) return;

    // obter usuário autenticado (padrão usado em outras páginas)
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    // deletar apenas a relação do usuário com o médico
    const { error } = await supabase
      .from("user_doctors")
      .delete()
      .eq("user_id", user.id)
      .eq("doctor_id", doctorId);

    if (error) {
      console.error("erro ao remover relação user_doctors:", error);
      alert("Erro ao excluir.");
      return;
    }

    // atualiza estado local para remover o cartão imediatamente
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
    // 1) Buscar disponibilidades (dia + período)
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

const doctorIds = availability?.map((a) => a.doctor_id) ?? [];


if (doctorIds.length === 0) {
  setDoctors([]);
  setLoading(false);
  return;
}

// 2) Buscar médicos da cidade/UF filtrados pelos IDs
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

// dedupe por id
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
  
  const menuItemStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid #eee",
  textDecoration: "none",
  color: "#111827",
  fontWeight: 600,
};

  return (
  <main className="p-6 max-w-[920px] mx-auto">
    {/* MENU (drawer) */}
{menuOpen && (
  <div
    onClick={() => setMenuOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      zIndex: 50,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 300,
        maxWidth: "85vw",
        height: "100%",
        background: "#fff",
        padding: 16,
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Menu</div>
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          style={{
            height: 36,
            width: 36,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: 1, background: "#eee", margin: "6px 0" }} />

      <a style={menuItemStyle}>
  Médicos cadastrados ({doctors.length})
</a>

<a style={menuItemStyle}>
  Buscar médico
</a>

<a style={menuItemStyle}>
  Médico solicitou visita
</a>

<a style={menuItemStyle}>
  Plano Premium
</a>

<hr style={{ height: 1, background: "#eee", margin: "6px 0" }} />

<a style={menuItemStyle}>
  Minha conta
</a>

<a style={menuItemStyle}>
  Suporte / Feedback
</a>

<hr style={{ height: 1, background: "#eee", margin: "6px 0" }} />

      <div style={{ flex: 1 }} />

      <a href="/login" style={{ ...menuItemStyle, color: "#b91c1c" }}>Sair</a>
    </div>
  </div>
)}

{/* estilos simples do item */}
{/*
  NÃO mover isso de lugar. Fica dentro do componente.
*/}

  {/* TOP BAR */}
<div className="mb-6 flex items-center justify-between">
  {/* Menu */}
  <button
    type="button"
    aria-label="Abrir menu"
    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900"
    onClick={() => setMenuOpen(true)}
  >
    ☰
  </button>

  {/* Título central */}
  <div className="text-2xl font-bold text-gray-900">
    EscalaMed
  </div>

  {/* Novo médico */}
  <a
    href="/admin"
    aria-label="Novo cadastro"
    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900"
  >
    +
  </a>
</div>

<p className="mb-6 text-gray-600">
  Médicos disponíveis por região e período
</p>
  
      {/* FILTROS */}
<div
  style={{
    display: "grid",
    gap: 16,
    marginTop: 16,
  }}
>

  {/* LINHA 1 */}
<div
  style={{
    display: "grid",
    gap: 16,
    padding: 20,
    border: "1px solid #eee",
    borderRadius: 16,
    background: "#fff",
  }}
>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <label
      style={{
        display: "grid",
        gap: 6,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <span style={{ fontSize: 12, color: "#666" }}>UF</span>
      <select
        value={uf}
        onChange={(e) => onChangeUF(e.target.value as typeof UFS[number])}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          outline: "none",
        }}
      >
        {UFS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </label>

    <label
      style={{
        display: "grid",
        gap: 6,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <span style={{ fontSize: 12, color: "#666" }}>Cidade</span>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          outline: "none",
        }}
      >
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  </div>
</div>

{/* LINHA 2 */}
<div
  style={{
    display: "grid",
    gap: 16,
    padding: 20,
    border: "1px solid #eee",
    borderRadius: 16,
    background: "#fff",
  }}
>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
    <label
      style={{
        display: "grid",
        gap: 6,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <span style={{ fontSize: 12, color: "#666" }}>Dia da semana</span>
      <select
        value={weekday}
        onChange={(e) => setWeekday(e.target.value as Weekday)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          outline: "none",
        }}
      >
        {WEEKDAYS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </label>

    <label
      style={{
        display: "grid",
        gap: 6,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <span style={{ fontSize: 12, color: "#666" }}>Período</span>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          outline: "none",
        }}
      >
        <option value="Manhã">Manhã</option>
        <option value="Tarde">Tarde</option>
      </select>
    </label>
  </div>
</div>
   </div>
      {/* RESULTADO */}
      <div style={{marginTop: 18,border: "1px solid #ccc",borderRadius: 8,padding: "12px 16px",background: "#fff", }}
>     • {title}
</div>

      <section style={{ marginTop: 12 }}>
        {doctors.length === 0 ? (
          <div
            style={{
              padding: 12,
              border: "1px solid #ffd7d7",
              background: "#fff5f5",
              borderRadius: 10,
            }}
          >
            Nenhum médico encontrado para esse filtro.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {doctors.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: 14,
                  border: "1px solid #e6e6e6",
                  borderRadius: 12,
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ fontSize: 16 }}>{d.name}</strong>

                  <div style={{ fontSize: 12, color: "#666" }}>
                    {d.specialty} · {d.phone}
                  </div>

                  <div style={{ fontSize: 12, color: "#666" }}>
                    {d.clinic} — {d.address}
                  </div>

                  <div style={{ fontSize: 12, color: "#888" }}>
                    {uf} · {city} · {weekday} · {period}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

      <footer style={{ marginTop: 28, fontSize: 12, color: "#888" }}>
        *Dados vindos do Supabase.
      </footer>
    </main>
  );
}
