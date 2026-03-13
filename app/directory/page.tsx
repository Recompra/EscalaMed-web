"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient";

type Row = {
  doctor_key: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  clinic: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
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
  const [qUf, setQUf] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filtersOk = (
    qName.trim().length >= 2 ||
    qSpec.trim().length >= 2 ||
    qCrm.trim().length >= 1 ||
    qUf.trim().length >= 2
  );

  async function runSearch() {
    setMsg("");
    if (!filtersOk) { setRows([]); return; }
    setLoading(true);

    let query = supabase
      .from("doctors_directory")
      .select("doctor_key,name,specialty,phone,clinic,address,city,uf");

    if (qName.trim().length >= 2) query = query.ilike("name", `%${qName.trim()}%`);
    if (qSpec.trim().length >= 2) query = query.ilike("specialty", `%${qSpec.trim()}%`);
    if (qCrm.trim().length >= 1) query = query.eq("crm", qCrm.trim());
    if (qUf.trim().length >= 2) query = query.eq("uf", qUf.trim().toUpperCase());

    const { data, error } = await query.limit(50);
    setLoading(false);

    if (error) {
      console.log(error);
      setMsg((error as any)?.message ?? "Erro ao buscar no diretório.");
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
    if (!user) { setMsg("Usuário não autenticado."); return; }

    const { error } = await supabase
      .from("user_doctors")
      .upsert([{ user_id: user.id, doctor_id: doctorId }], { onConflict: "user_id,doctor_id" });

    if (error) {
      if ((error as any).code === "23505") { setMsg("Médico já está na sua lista."); return; }
      console.log("ERRO AO INSERIR:", error);
      setMsg((error as any).message ?? "Erro ao adicionar.");
      return;
    }
    setMsg("Adicionado à sua escala ✅");
  }

  useEffect(() => {
    const t = setTimeout(() => runSearch(), 350);
    return () => clearTimeout(t);
  }, [qName, qSpec, qCrm, qUf]);

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    color: "#0D1117",
    outline: "none",
    width: "100%",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: 24,
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#1A6B4A",
          margin: 0,
        }}>Buscar Médico</h2>
        <p style={{ marginTop: 4, fontSize: 13, color: "#8A9BB0" }}>Diretório</p>
      </div>

      {/* Filtros */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 16 }}>
        <select
          value={qUf}
          onChange={(e) => setQUf(e.target.value)}
          style={{ ...inputStyle, color: qUf ? "#0D1117" : "#8A9BB0" }}
        >
          <option value="">UF</option>
          {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </select>

        <input
          placeholder="CRM"
          value={qCrm}
          onChange={(e) => setQCrm(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          inputMode="numeric"
          style={inputStyle}
        />

        <input
          placeholder="NOME"
          value={qName}
          onChange={(e) => setQName(e.target.value.toUpperCase())}
          style={inputStyle}
        />

        <select
          value={qSpec}
          onChange={(e) => setQSpec(e.target.value)}
          style={{ ...inputStyle, color: qSpec ? "#0D1117" : "#8A9BB0" }}
        >
          <option value="">Especialidade</option>
          <option value="CLÍNICO GERAL">CLÍNICO GERAL</option>
          <option value="GINECOLOGISTA">GINECOLOGISTA</option>
          <option value="PEDIATRA">PEDIATRA</option>
          <option value="CARDIOLOGISTA">CARDIOLOGISTA</option>
          <option value="DERMATOLOGISTA">DERMATOLOGISTA</option>
          <option value="ORTOPEDISTA">ORTOPEDISTA</option>
          <option value="UROLOGISTA">UROLOGISTA</option>
          <option value="ENDOCRINOLOGISTA">ENDOCRINOLOGISTA</option>
          <option value="PSIQUIATRA">PSIQUIATRA</option>
          <option value="NEUROLOGISTA">NEUROLOGISTA</option>
          <option value="OFTALMOLOGISTA">OFTALMOLOGISTA</option>
          <option value="OTORRINOLARINGOLOGISTA">OTORRINOLARINGOLOGISTA</option>
          <option value="GASTROENTEROLOGISTA">GASTROENTEROLOGISTA</option>
          <option value="MASTOLOGISTA">MASTOLOGISTA</option>
          <option value="ONCOLOGISTA">ONCOLOGISTA</option>
          <option value="CIRURGIÃO GERAL">CIRURGIÃO GERAL</option>
          <option value="ANESTESIOLOGISTA">ANESTESIOLOGISTA</option>
          <option value="OBSTETRA">OBSTETRA</option>
          <option value="NUTROLOGO">NUTROLOGO</option>
          <option value="NEFROLOGISTA">NEFROLOGISTA</option>
          <option value="PNEUMOLOGISTA">PNEUMOLOGISTA</option>
          <option value="REUMATOLOGISTA">REUMATOLOGISTA</option>
          <option value="HEMATOLOGISTA">HEMATOLOGISTA</option>
          <option value="INFECTOLOGISTA">INFECTOLOGISTA</option>
          <option value="OUTRAS">OUTRAS</option>
        </select>
      </div>

      {/* Botão + Mensagem */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <button
          type="button"
          onClick={runSearch}
          disabled={loading}
          style={{
            padding: "11px 20px",
            borderRadius: 10,
            border: "none",
            background: "#1A6B4A",
            color: "white",
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >
          {loading ? "Buscando..." : "Pesquisar"}
        </button>

        {msg && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: msg.includes("✅") ? "rgba(26,107,74,0.10)" : "#FFF3DC",
            border: `1.5px solid ${msg.includes("✅") ? "rgba(26,107,74,0.20)" : "rgba(212,130,10,0.25)"}`,
            color: msg.includes("✅") ? "#1A6B4A" : "#7A4A00",
            fontSize: 13,
            fontWeight: 600,
          }}>{msg}</div>
        )}
      </div>

      {/* Resultados */}
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((r) => (
          <div
            key={r.doctor_key}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName !== "BUTTON") {
                router.push(`/doctor/${r.doctor_key}`);
              }
            }}
            style={{
              border: "1px solid rgba(13,17,23,0.08)",
              borderLeft: "3px solid #1A6B4A",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
              transition: "box-shadow 150ms ease, transform 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(13,17,23,0.06)";
              e.currentTarget.style.transform = "translateY(0px)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/doctor/${r.doctor_key}`; }}
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#0D1117",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >{r.name}</div>

                <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                  {r.specialty} · {r.phone}
                </div>

                <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                  {r.clinic ? `${r.clinic} · ` : ""}{r.address}
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  {[r.city, r.uf].filter(Boolean).map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600,
                      padding: "3px 8px", borderRadius: 100,
                      background: "#F5F3EE", color: "#4A5568",
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const ok = window.confirm("Deseja adicionar este médico à sua escala?");
                  if (!ok) return;
                  addToMyList(r.doctor_key);
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(26,107,74,0.30)",
                  background: "rgba(26,107,74,0.08)",
                  color: "#1A6B4A",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  alignSelf: "flex-start",
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>
        ))}

        {!loading && filtersOk && rows.length === 0 && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FFF3DC",
            border: "1.5px solid rgba(212,130,10,0.25)",
            fontSize: 13,
            color: "#7A4A00",
          }}>Nenhum médico encontrado.</div>
        )}
      </div>
    </main>
  );
}