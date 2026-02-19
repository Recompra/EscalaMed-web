"use client";
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uf, setUf] = useState<typeof UFS[number]>(UFS[0]);
  const cities = useMemo(() => CITIES_BY_UF[uf as keyof typeof CITIES_BY_UF] ?? [],[uf]);
  const [city, setCity] = useState(cities[0] ?? "");
  const [weekday, setWeekday] = useState<Weekday>("Terça");
  const [period, setPeriod] = useState<Period>("Manhã");
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
  <main className="p-6 max-w-[920px] mx-auto">

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
    padding: 16,
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fff"
  }}
>

  {/* LINHA 1 */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
    
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#666" }}>UF</span>
      <select value={uf} onChange={(e) => onChangeUF(e.target.value as (typeof UFS)[number])}>
        {UFS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </label>

    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#666" }}>Cidade</span>
      <select value={city} onChange={(e) => setCity(e.target.value)}>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </label>

  </div>

  {/* LINHA 2 */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#666" }}>Dia da semana</span>
      <select
        value={weekday}
        onChange={(e) => setWeekday(e.target.value as Weekday)}
>
       {WEEKDAYS.map((d) => (
       <option key={d} value={d}>
       {d}
       </option>
      ))}
      </select>
    </label>

    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#666" }}>Período</span>
      <select value={period}
      onChange={(e) => setPeriod(e.target.value as Period)}
      >
        <option value="Manhã">Manhã</option>
        <option value="Tarde">Tarde</option> 

      </select>
    </label>

  </div>
  </div>
      {/* RESULTADO */}
      <h2 style={{ marginTop: 18 }}>{title}</h2>

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

                <button
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                  }}
                >
                  Ver detalhes
                </button>
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
