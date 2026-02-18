"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { UFS, CITIES_BY_UF } from "../data/cities";

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
  const run = async () => {
    setErrorMsg("");
    // 1) Buscar disponibilidades (dia + período)
const { data: availability, error: availError } = await supabase
  .from("doctor_availability")
  .select("doctor_id")
  .eq("weekday", weekdayNumber)
  .eq("period", periodDb)
  .limit(50);

if (availError) {
  console.log("AVAIL ERROR:", availError);
  setDoctors([]);
  setLoading(false);
  return;
}

const doctorIds = availability.map(a => a.doctor_id);

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

  <div className="mb-8">
    <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-tight">
      EscalaMed
    </h1>
    <p className="mt-2 text-xl text-gray-600">
      Médicos disponíveis por região e período
    </p>
  </div>
      {/* FILTROS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
          marginTop: 16,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <label style={{ display: "grid", gap: 6, width: 920, margin: "0 auto" }}>
  <span style={{ fontSize: 12, color: "#666" }}>UF</span>

  <select
    value={uf}
    onChange={(e) => onChangeUF(e.target.value as (typeof UFS)[number])}
  >
    {UFS.map((u) => (
      <option key={u} value={u}>
        {u}
      </option>
    ))}
  </select>
</label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Cidade</span>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Dia da semana</span>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Período</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
          </select>
        </label>
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
