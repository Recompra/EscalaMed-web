"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UFS } from "@/data/cities";

const LABS = [
  "ABBOTT","ABBVIE","ACHE","ACTAVIS","AMGEN","ASTRAZENECA","BAYER",
  "BIOLAB","BRACE PHARMA","BRISTOL MYERS SQUIBB","CIMED","EMS","EUROFARMA",
  "GEOLAB","GERMED","GSK","HYPERA PHARMA","JOHNSON & JOHNSON","LEGRAND",
  "MERCK / MSD","MOMENTA","MULTILAB FARMA","NOVA QUÍMICA","NOVAMED",
  "NOVARTIS","NOVO NORDISK","OUTRO","PFIZER","ROCHE","SANOFI","SUPERA",
  "TEUTO","UNIÃO QUÍMICA",
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

function normalizeUpper(s: string) { return (s || "").toUpperCase(); }

function isBirthdayDDMM(s: string) {
  return /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/.test(s);
}

export default function Page() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [state, setState] = useState<(typeof UFS)[number] | "">("");
  const [lab, setLab] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [msgType, setMsgType] = useState<"success"|"error"|"warning"|null>(null);
  const phoneDigits = useMemo(() => onlyDigits(phone), [phone]);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setMsgType(null);

    if (!name.trim()) { setMsg("Informe o NOME."); setMsgType("warning"); return; }
    if (phoneDigits.length !== 11) { setMsg("CELULAR deve ter 11 dígitos."); setMsgType("warning"); return; }
    if (!email.trim()) { setMsg("Informe o E-MAIL."); setMsgType("warning"); return; }
    if (!address.trim()) { setMsg("Informe o ENDEREÇO."); setMsgType("warning"); return; }
    if (!isBirthdayDDMM(birthday)) { setMsg("ANIVERSÁRIO deve ser DD/MM."); setMsgType("warning"); return; }
    if (!lab) { setMsg("Informe o LABORATÓRIO."); setMsgType("warning"); return; }
    if (password.length !== 8) { setMsg("SENHA deve ter exatamente 8 caracteres."); setMsgType("warning"); return; }

    setLoading(true);

    try {
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/login` : undefined;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name: normalizeUpper(name),
            phone: formatPhoneBR(phone),
            address: normalizeUpper(address),
            birthday, lab, state,
          },
        },
      });

      if (error) {
        setMsg(`Erro: ${error.message}`);
        setMsgType("error");
        return;
      }

      setMsg("Conta criada! Verifique seu e-mail para confirmar. ✅");
      setMsgType("success");
      setName(""); setPhone(""); setEmail(""); setAddress("");
      setBirthday(""); setLab(""); setPassword("");

    } catch (err: any) {
      setMsg(`Erro: ${err?.message || String(err)}`);
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "32px 24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#FFFFFF",
        border: "1px solid rgba(13,17,23,0.10)",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
        display: "grid",
        gap: 14,
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: 20,
          color: "#0D1117",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{
            width: 8, height: 8, background: "#1A6B4A",
            borderRadius: "50%", display: "inline-block",
          }}/>
          EscalaMed
        </div>

        <div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>Criar conta</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            Cadastre-se para começar
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>

          {/* Dados pessoais */}
          <div style={sectionStyle}>Dados pessoais</div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Digite o nome completo"
              autoComplete="name"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Celular</span>
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              placeholder="(00) 99999-9999"
              inputMode="numeric"
              autoComplete="tel"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>E-mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              type="email"
              autoComplete="email"
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

          {/* Dados profissionais */}
          <div style={sectionStyle}>Dados profissionais</div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 100px", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Endereço</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value.toUpperCase())}
                placeholder="Rua, número, bairro, cidade"
                autoComplete="street-address"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>UF</span>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as (typeof UFS)[number] | "")}
                style={inputStyle}
              >
                <option value="" disabled>—</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Laboratório que atua</span>
            <select
              value={lab}
              onChange={(e) => setLab(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione</option>
              {LABS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>

          {/* Segurança */}
          <div style={sectionStyle}>Segurança</div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Senha (8 caracteres)</span>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 14,
                }}
              >{showPassword ? "🙈" : "👁️"}</button>
            </div>
          </label>

          {/* Mensagem */}
          {msg && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: msgType === "success" ? "rgba(26,107,74,0.10)" : msgType === "warning" ? "#FFF3DC" : "#FFF0EE",
              color: msgType === "success" ? "#1A6B4A" : msgType === "warning" ? "#7A4A00" : "#C0392B",
              fontWeight: 600, fontSize: 13,
              border: `1.5px solid ${msgType === "success" ? "rgba(26,107,74,0.20)" : msgType === "warning" ? "rgba(212,130,10,0.25)" : "rgba(192,57,43,0.20)"}`,
            }}>{msg}</div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 16px",
              background: loading ? "#8A9BB0" : "#1A6B4A",
              color: "white", borderRadius: 10, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Syne', sans-serif", fontSize: 13,
              fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <a
            href="/login"
            style={{
              textAlign: "center", fontSize: 13,
              color: "#8A9BB0", textDecoration: "none",
            }}
          >
            Já tem conta?{" "}
            <span style={{ color: "#1A6B4A", fontWeight: 700 }}>Entrar</span>
          </a>

        </form>
      </div>
    </main>
  );
}