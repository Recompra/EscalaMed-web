"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UFS, CITIES_BY_UF } from "@/data/cities";
import { useRouter } from "next/navigation";

const SPECIALTIES = [
  "CLÍNICO GERAL","GINECOLOGISTA","PEDIATRA","CARDIOLOGISTA",
  "DERMATOLOGISTA","ORTOPEDISTA","UROLOGISTA","ENDOCRINOLOGISTA",
  "PSIQUIATRA","NEUROLOGISTA","OFTALMOLOGISTA","OTORRINOLARINGOLOGISTA",
  "GASTROENTEROLOGISTA","MASTOLOGISTA","ONCOLOGISTA","CIRURGIÃO GERAL",
  "ANESTESIOLOGISTA","OBSTETRA","NUTROLOGO","NEFROLOGISTA",
  "PNEUMOLOGISTA","REUMATOLOGISTA","HEMATOLOGISTA","INFECTOLOGISTA","OUTRAS",
] as const;

const SLOTS = [
  "Segunda Manhã","Segunda Tarde",
  "Terça Manhã","Terça Tarde",
  "Quarta Manhã","Quarta Tarde",
  "Quinta Manhã","Quinta Tarde",
  "Sexta Manhã","Sexta Tarde",
];

function onlyDigits(v: string) { return v.replace(/\D/g, ""); }

function formatPhoneBR(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function VisitRequestPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmUf, setCrmUf] = useState("DF");
  const [phone, setPhone] = useState("");
  const [uf, setUf] = useState<typeof UFS[number]>(UFS[0]);
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [slotsSelected, setSlotsSelected] = useState<string[]>([]);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error"|"warning"|null>(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#FFFFFF",
    color: "#0D1117",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#4A5568",
    textTransform: "uppercase" as const,
  };

  const sectionStyle = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#8A9BB0",
    marginTop: 8,
    marginBottom: 4,
  };

  async function onSubmit() {
    setMsg(""); setMsgType(null);

    if (!name || !crm || !phone || !uf || !city || !specialty || !clinic) {
      setMsg("Preencha todos os campos obrigatórios.");
      setMsgType("warning");
      return;
    }

    if (slotsSelected.length === 0) {
      setMsg("Selecione pelo menos 1 dia de atendimento.");
      setMsgType("warning");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("visit_requests").insert({
      name: name.trim().toUpperCase(),
      crm: crm.trim(),
      crm_uf: crmUf,
      phone: onlyDigits(phone),
      uf,
      city: city.trim().toUpperCase(),
      specialty: specialty.toUpperCase(),
      clinic: clinic.trim().toUpperCase(),
      slots: slotsSelected,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setMsg("Erro ao enviar. Tente novamente.");
      setMsgType("error");
      return;
    }

    setMsg("Solicitação enviada com sucesso! Em breve um representante entrará em contato.");
    setMsgType("success");

    setName(""); setCrm(""); setCrmUf("DF"); setPhone("");
    setUf(UFS[0]); setCity(""); setSpecialty(""); setClinic("");
    setSlotsSelected([]);
  }

  const cities = CITIES_BY_UF[uf] ?? [];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        background: "#FFFFFF",
        border: "1px solid rgba(13,17,23,0.10)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
        display: "grid",
        gap: 14,
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#0D1117",
          }}>Solicitar Visita</h2>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              backgroundColor: "#1A6B4A",
              color: "white",
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#155c3e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1A6B4A"; }}
          >Voltar</button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: "#8A9BB0" }}>
          Preencha seus dados e um representante entrará em contato.
        </p>

        {/* Identificação */}
        <div style={sectionStyle}>Identificação</div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Nome completo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="Dr. Nome Completo"
            style={inputStyle}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>CRM</span>
            <input
              value={crm}
              onChange={(e) => setCrm(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="000000"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>UF do CRM</span>
            <select value={crmUf} onChange={(e) => setCrmUf(e.target.value)} style={inputStyle}>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Especialidade</span>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
            <option value="">Selecione</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Telefone</span>
          <input
            value={formatPhoneBR(phone)}
            onChange={(e) => setPhone(onlyDigits(e.target.value))}
            placeholder="(62) 99999-9999"
            style={inputStyle}
          />
        </label>

        {/* Localização */}
        <div style={sectionStyle}>Localização</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Cidade</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              <option value="">Selecione</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>UF</span>
            <select
              value={uf}
              onChange={(e) => { setUf(e.target.value as typeof UFS[number]); setCity(""); }}
              style={inputStyle}
            >
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Clínica / Hospital</span>
          <input
            value={clinic}
            onChange={(e) => setClinic(e.target.value.toUpperCase())}
            placeholder="Nome da clínica"
            style={inputStyle}
          />
        </label>

        {/* Disponibilidade */}
        <div style={sectionStyle}>Disponibilidade</div>

        <div style={{ display: "grid", gap: 6, position: "relative" }}>
          <span style={labelStyle}>Dias de atendimento</span>
          <button
            type="button"
            onClick={() => setSlotsOpen((v) => !v)}
            style={{
              ...inputStyle,
              textAlign: "left",
              cursor: "pointer",
              color: slotsSelected.length ? "#0D1117" : "#8A9BB0",
            }}
          >
            {slotsSelected.length ? slotsSelected.join(", ") : "SELECIONAR"}
          </button>

          {slotsOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
              background: "white", border: "1.5px solid rgba(13,17,23,0.10)",
              borderRadius: 10, boxShadow: "0 8px 24px rgba(13,17,23,0.12)",
              zIndex: 30, padding: 12, display: "grid", gap: 8,
            }}>
              {SLOTS.map((s) => (
                <label key={s} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={slotsSelected.includes(s)}
                    onChange={() => setSlotsSelected((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                    )}
                    style={{ accentColor: "#1A6B4A", width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: "#0D1117" }}>{s}</span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setSlotsOpen(false)}
                style={{
                  ...inputStyle, marginTop: 4, background: "#1A6B4A", color: "white",
                  border: "none", cursor: "pointer", fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 12, letterSpacing: "0.06em",
                }}
              >OK</button>
            </div>
          )}
        </div>

        {/* Mensagem */}
        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: msgType === "success" ? "rgba(26,107,74,0.10)" : msgType === "warning" ? "#FFF3DC" : "#FFF0EE",
            color: msgType === "success" ? "#1A6B4A" : msgType === "warning" ? "#7A4A00" : "#C0392B",
            fontWeight: 600, fontSize: 13,
            border: `1.5px solid ${msgType === "success" ? "rgba(26,107,74,0.20)" : msgType === "warning" ? "rgba(212,130,10,0.25)" : "rgba(192,57,43,0.20)"}`,
          }}>
            {msg}
          </div>
        )}

        {/* Botão */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          style={{
            padding: "14px 16px",
            background: loading ? "#8A9BB0" : "#1A6B4A",
            color: "white",
            borderRadius: 10,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            width: "100%",
            boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </button>

      </div>
    </main>
  );
}