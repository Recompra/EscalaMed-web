"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  clinic: string | null;
  address: string;
  city: string;
  uf: string;

  crm: string | null;
  crm_uf: string | null;
};
const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export default function PremiumPage() {
  const [qName, setQName] = useState("");
  const [qSpec, setQSpec] = useState("");
  const [qCrm, setQCrm] = useState("");
  const [qCrmUf, setQCrmUf] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const filtersOk = (
  qName.trim().length >= 2 ||
  qSpec.trim().length >= 2 ||
  qCrm.trim().length >= 1 ||
  qCrmUf.trim().length >= 2
);
  async function runSearch() {

    setMsg("");
    if (!filtersOk) {
      setRows([]);
      return;
    }

    setLoading(true);

    let query = supabase
  .from("doctors")
  .select("*");

if (qName.trim().length >= 2) {
  query = query.ilike("name", `%${qName.trim()}%`);
}

if (qSpec.trim().length >= 2) {
  query = query.ilike("specialty", `%${qSpec.trim()}%`);
}

if (qCrm.trim().length >= 1) {
  query = query.eq("crm", qCrm.trim());
}

if (qCrmUf.trim().length >= 2) {
  query = query.eq("crm_uf", qCrmUf.trim().toUpperCase());
}

const { data, error } = await query.limit(50);

    setLoading(false);

    if (error) {
      console.log(error);
      setMsg("Erro ao buscar no diretório.");
      setRows([]);
      return;
    }
    console.log("primeiro item:", data?.[0]);
    
    setRows((data as Row[]) ?? []);
  }

  async function addToMyList(doctorId: string) {
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setMsg("Usuário não autenticado.");
      return;
    }

    const { error } = await supabase
      .from("user_doctors")
      .insert([{ user_id: user.id, doctor_id: doctorId }]);

   if (error) {
  if ((error as any).code === "23505") {
    setMsg("Médico já está na sua lista.");
    return;
  }
  console.log("ERRO AO INSERIR:", error);
  setMsg((error as any).message ?? "Erro ao adicionar.");
  return;
}

    setMsg("Adicionado à sua escala ✅");
  }

  useEffect(() => {
  // busca automática "leve" quando filtros mudarem
  const t = setTimeout(() => runSearch(), 350);
  return () => clearTimeout(t);
}, [qName, qSpec, qCrm, qCrmUf]); 

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 6 }}>EscalaMed</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Base de Cadastro
      </p>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 0.5fr",
    gap: 10,
    marginTop: 16,
    alignItems: "center",
  }}
>
  <input
    placeholder="NOME"
    value={qName}
    onChange={(e) => setQName(e.target.value.toUpperCase())}
    style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", width: "100%" }}
  />

  <input
    placeholder="CRM"
    value={qCrm}
    onChange={(e) => setQCrm(e.target.value.replace(/\D/g, ""))}
    maxLength={6}
    inputMode="numeric"
    style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", width: "100%" }}
  />

  <select
    value={qCrmUf}
    onChange={(e) => setQCrmUf(e.target.value)}
    style={{
      padding: 10,
      borderRadius: 8,
      border: "1px solid #ddd",
      textTransform: "uppercase",
      width: "100%",
    }}
  >
    <option value="">UF</option>
    {UF_LIST.map((uf) => (
      <option key={uf} value={uf}>
        {uf}
      </option>
    ))}
  </select>
</div>

       <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={runSearch}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "white" }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {msg ? (
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f3f4f6" }}>{msg}</div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        {rows.map((r) => (
  <div
    key={r.id}
    onClick={() => router.push(`/doctor/${r.id}`)}
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 14,
      cursor: "pointer",
      transition: "box-shadow 150ms ease, transform 150ms ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0px)";
    }}
  >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{r.name}</div>
                <div style={{ opacity: 0.85 }}>
                  {r.specialty} • {r.phone}
                </div>
                <div style={{ opacity: 0.85 }}>
                 CRM: {r.crm ?? "-"} / {r.crm_uf ?? "-"}
                 </div>
                <div style={{ opacity: 0.85 }}>
                {r.clinic ? `${r.clinic} • ` : ""}{r.address}
                </div>
                <div style={{ opacity: 0.75 }}>
                  {r.city} / {r.uf}
                </div>
              </div>

              <button
                type="button"
                onClick={() => addToMyList(r.id)}
                style={{ height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid #111", background: "white" }}
              >
                Adicionar à minha escala
              </button>
            </div>
          </div>
        ))}

        {!loading && filtersOk && rows.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Nenhum médico encontrado.</div>
        ) : null}
      </div>
    </main>
  );
}