"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UFS } from "@/data/cities";

const LABS = [
  "ABBOTT",
  "ABBVIE",
  "ACHE",
  "ACTAVIS",
  "ADIUM",
  "ALLERGAN",
  "ALMIRALL",
  "AMGEN",
  "ASTELLAS",
  "ASTRAZENECA",
  "BAYER",
  "BIOGEN",
  "BIOLAB",
  "BIOMM",
  "BRACE PHARMA",
  "BRISTOL MYERS SQUIBB",
  "CIMED",
  "CRISTÁLIA",
  "DAICHII SANKYO",
  "ELI LILLY",
  "EMS",
  "EUROFARMA",
  "FERRING",
  "GEOLAB",
  "GERMED",
  "GILEAD",
  "GSK",
  "HYPERA PHARMA",
  "IPSEN",
  "JANSSEN",
  "JOHNSON & JOHNSON",
  "LEGRAND",
  "LEO PHARMA",
  "LIBBS",
  "LUNDBECK",
  "MEDLEY",
  "MERCK / MSD",
  "MOMENTA",
  "MULTILAB FARMA",
  "MUNDIPHARMA",
  "MYLAN",
  "NOVA QUÍMICA",
  "NOVAMED",
  "NOVARTIS",
  "NOVO NORDISK",
  "ORGANON",
  "OTSUKA",
  "PFIZER",
  "PHARLAB",
  "PIERRE FABRE",
  "PRATI-DONADUZZI",
  "PROCTER & GAMBLE",
  "RECKITT",
  "ROCHE",
  "SANDOZ",
  "SANOFI",
  "SERVIER",
  "SHERING-PLOUGH",
  "SIGMA PHARMA",
  "SUPERA",
  "TAKEDA",
  "TEUTO",
  "TORRENT",
  "UCB",
  "UNIÃO QUÍMICA",
  "VERTEX",
  "VIATRIS",
  "OUTRO",
] as const;

function onlyDigits(s: string) { return (s || "").replace(/\D/g, ""); }

function formatPhoneBR(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  const dd = d.slice(0, 2);
  const a = d.slice(2, 7);
  const b = d.slice(7, 11);
  if (d.length <= 2) return dd ? `(${dd}` : "";
  if (d.length <= 7) return `(${dd}) ${a}`;
  return `(${dd}) ${a}-${b}`;
}

export default function AccountPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [state, setState] = useState("");
  const [lab, setLab] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error"|"warning"|null>(null);

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

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) { router.push("/login"); return; }

      const meta = user.user_metadata || {};
      setEmail(user.email || "");
      setName(meta.name || "");
      setPhone(meta.phone || "");
      setAddress(meta.address || "");
      setBirthday(meta.birthday || "");
      setState(meta.state || "");
      setLab(meta.lab || "");
      setLoading(false);
    }
    load();
  }, []);

  async function onSave() {
    setMsg(""); setMsgType(null);
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        name: name.trim().toUpperCase(),
        phone: formatPhoneBR(phone),
        address: address.trim().toUpperCase(),
        birthday,
        state,
        lab,
      },
    });

    setSaving(false);

    if (error) {
      setMsg("Erro ao salvar. Tente novamente.");
      setMsgType("error");
      return;
    }

    setMsg("Dados atualizados com sucesso ✅");
    setMsgType("success");
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#F5F3EE",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8A9BB0",
      }}>Carregando...</div>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      padding: 24,
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
          }}>Minha Conta</h2>
          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{
              backgroundColor: "#1A6B4A", color: "white",
              padding: "8px 16px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 12,
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              letterSpacing: "0.06em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#155c3e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1A6B4A"; }}
          >Voltar</button>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(26,107,74,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
            color: "#1A6B4A", flexShrink: 0,
          }}>
            {(name || "?")[0]}
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1117" }}>
              {name || "—"}
            </div>
            <div style={{ fontSize: 12, color: "#8A9BB0" }}>{email}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(13,17,23,0.07)" }} />

        {/* Dados pessoais */}
        <div style={sectionStyle}>Dados pessoais</div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="Nome completo"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>E-mail</span>
          <input
            value={email}
            disabled
            style={{ ...inputStyle, background: "#F5F3EE", color: "#8A9BB0", cursor: "not-allowed" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Celular</span>
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            placeholder="(00) 99999-9999"
            inputMode="numeric"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Aniversário (DD/MM)</span>
          <input
            value={birthday}
            onChange={(e) => {
              let v = e.target.value.replace(/[^\d/]/g, "");
              v = v.replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);
              setBirthday(v);
            }}
            placeholder="DD/MM"
            inputMode="numeric"
            style={inputStyle}
          />
        </label>

        {/* Profissional */}
        <div style={sectionStyle}>Dados profissionais</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Endereço</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value.toUpperCase())}
              placeholder="Rua, número, bairro, cidade"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>UF</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={inputStyle}
            >
              <option value="">—</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Laboratório que atua</span>
          <select value={lab} onChange={(e) => setLab(e.target.value)} style={inputStyle}>
            <option value="">Selecione</option>
            {LABS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>

        {/* Mensagem */}
        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: msgType === "success" ? "rgba(26,107,74,0.10)" : "#FFF0EE",
            color: msgType === "success" ? "#1A6B4A" : "#C0392B",
            fontWeight: 600, fontSize: 13,
            border: `1.5px solid ${msgType === "success" ? "rgba(26,107,74,0.20)" : "rgba(192,57,43,0.20)"}`,
          }}>{msg}</div>
        )}

        {/* Botão salvar */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "14px 16px",
            background: saving ? "#8A9BB0" : "#1A6B4A",
            color: "white", borderRadius: 10, border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif", fontSize: 13,
            fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, width: "100%",
            boxShadow: saving ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>

        <div style={{ height: 1, background: "rgba(13,17,23,0.07)" }} />
      {/* Cancelar assinatura */}
        <button
          type="button"
          onClick={async () => {
            const confirmed = window.confirm(
              "Tem certeza que deseja cancelar sua assinatura Premium? Você perderá acesso às funcionalidades exclusivas."
            );
            if (!confirmed) return;

            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            const { error } = await supabase
              .from("profiles")
              .update({ is_premium: false, plan: null })
              .eq("user_id", user.id);

            if (error) {
              alert("Erro ao cancelar. Entre em contato com o suporte.");
            } else {
              alert("Assinatura cancelada. Seu acesso Premium foi removido.");
              router.refresh();
            }
          }}
          style={{
            padding: "12px 16px", background: "transparent",
            color: "#C0392B", borderRadius: 10,
            border: "1.5px solid rgba(192,57,43,0.20)",
            cursor: "pointer", fontFamily: "'Syne', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            width: "100%",
          }}
        >
          Cancelar assinatura Premium
        </button>

        {/* Sair */}
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          style={{
            padding: "12px 16px", background: "transparent",
            color: "#C0392B", borderRadius: 10,
            border: "1.5px solid rgba(192,57,43,0.20)",
            cursor: "pointer", fontFamily: "'Syne', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            width: "100%",
          }}
        >
          Sair da conta
        </button>

      </div>
    </main>
  );
}