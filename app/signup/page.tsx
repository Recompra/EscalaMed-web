"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UFS } from "@/data/cities";

const LABS = [
  "ABBOTT",
  "ABBVIE",
  "ACHE",
  "ACTAVIS",
  "AMGEN",
  "ASTRAZENECA",
  "BAYER",
  "BIOLAB",
  "BRACE PHARMA",
  "BRISTOL MYERS SQUIBB",
  "CIMED",
  "EMS",
  "EUROFARMA",
  "GEOLAB",
  "GERMED",
  "GSK",
  "HYPERA PHARMA",
  "JOHNSON & JOHNSON",
  "LEGRAND",
  "MERCK / MSD",
  "MOMENTA",
  "MULTILAB FARMA",
  "NOVA QUÍMICA",
  "NOVAMED",
  "NOVARTIS",
  "NOVO NORDISK",
  "OUTRO",
  "PFIZER",
  "ROCHE",
  "SANOFI",
  "SUPERA",
  "TEUTO",
  "UNIÃO QUÍMICA",
] as const;

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

// Padrão fixo: (00) 99999-1111
function formatPhoneBR(value: string) {
  const d = onlyDigits(value).slice(0, 11); // trava em 11 dígitos
  const dd = d.slice(0, 2);
  const a = d.slice(2, 7);
  const b = d.slice(7, 11);

  if (d.length <= 2) return dd ? `(${dd}` : "";
  if (d.length <= 7) return `(${dd}) ${a}`;
  return `(${dd}) ${a}-${b}`;
}

function normalizeUpper(s: string) {
  return (s || "").toUpperCase();
}

function isBirthdayDDMM(s: string) {
  // DD/MM simples (01-31 / 01-12)
  return /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/.test(s);
}

const inputBase =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-gray-300";
const labelBase = "text-sm font-medium text-gray-700";
const cardBase =
  "mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

export default function Page() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState(""); // DD/MM
  const [state, setState] = useState<(typeof UFS)[number] | "">("");
  const [lab, setLab] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const phoneDigits = useMemo(() => onlyDigits(phone), [phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    // validações rápidas (do jeito que você pediu)
    if (!name.trim()) return setMsg("Informe o NOME.");
    if (phoneDigits.length !== 11) return setMsg("CELULAR deve ter 11 dígitos (DDD + número).");
    if (!email.trim()) return setMsg("Informe o E-MAIL.");
    if (!address.trim()) return setMsg("Informe o ENDEREÇO.");
    if (!isBirthdayDDMM(birthday)) return setMsg("ANIVERSÁRIO deve ser DD/MM.");
    if (!lab) return setMsg("Informe o LABORATÓRIO.");
    if (password.length !== 8) return setMsg("SENHA deve ter exatamente 8 caracteres.");

    setMsg("");

  setLoading(true);

  try {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name: normalizeUpper(name),
          phone: formatPhoneBR(phone),
          address: normalizeUpper(address),
          birthday,
          lab,
          state, // UF (se existir no seu código)
        },
      },
    });

    if (error) {
      setMsg(`ERRO: ${error.message}`);
      return;
    }

    setMsg("CADASTRADO");
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBirthday("");
    setLab("");
    setPassword("");
    // se tiver UF:
    // setState("");

  } catch (err: any) {
    setMsg(`ERRO: ${err?.message || String(err)}`);
  } finally {
    setLoading(false);
  }
  }
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className={cardBase}>
        <h1 className="text-3xl font-bold text-gray-900">EscalaMed</h1>
        <p className="mt-1 text-gray-600">Cadastre-se</p>

        {msg ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
            {msg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <label className={labelBase}>NOME</label>
            <input
              className={inputBase}
              value={(name ?? "").toUpperCase()}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Digite o Nome"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-2">
            <label className={labelBase}>CELULAR</label>
            <input
              className={inputBase}
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              placeholder="(00) 99999-9999"
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>

          <div className="grid gap-2">
            <label className={labelBase}>E-MAIL</label>
            <input
              onChange={(e) => setEmail(e.target.value.toUpperCase())}
              value={(email ?? "").toUpperCase()}
              placeholder="@email.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ENDEREÇO */}
          <div className="grid gap-2">
            <label className={labelBase}>ENDEREÇO</label>
           <input
            className={inputBase}
              value={(address ?? "").toUpperCase()}
              onChange={(e) => setAddress(e.target.value.toUpperCase())}
             placeholder="Rua, número, bairro, cidade"
            autoComplete="street-address"
            />
             </div>

          {/* UF */}
           <div className="grid gap-2">
             <label className={labelBase}>UF</label>
          <select
             className={`${inputBase} uppercase`}
             value={state}
             onChange={(e) => setState(e.target.value as (typeof UFS)[number] | "")}
    >
           <option value="" disabled>
             SELECIONE
            </option>
             {UFS.map((uf) => (
             <option key={uf} value={uf}>
               {uf}
             </option>
               ))}
             </select>
            </div>
         </div>

          <div className="grid gap-2">
            <label className={labelBase}>ANIVERSÁRIO (DD/MM)</label>
            <input
              className={inputBase}
              value={birthday}
              onChange={(e) => {
                // máscara simples DD/MM
                let v = e.target.value.replace(/[^\d/]/g, "");
                v = v.replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);
                setBirthday(v);
              }}
              placeholder="00/00"
              inputMode="numeric"
            />
          </div>

          <div className="grid gap-2">
            <label className={labelBase}>LABORATÓRIO QUE ATUA</label>
            <select
              className={inputBase}
              value={lab}
              onChange={(e) => setLab(e.target.value as any)}
              style={{ textTransform: "uppercase" }}
            >
              {LABS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
  <label className={labelBase}>SENHA (8 CARACTERES)</label>

      <div style={{ position: "relative" }}>
        <input
        className={inputBase}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        maxLength={8}
        autoComplete="new-password"
        placeholder="********"
        />

    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontWeight: 700,
      }}
      aria-label="Mostrar/ocultar senha"
      title="Mostrar/ocultar senha"
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
          </div>
          {msg && (
           <p
          style={{
          marginTop: 12,
          color: msg === "CADASTRADO" ? "green" : "red",
          fontWeight: 700,
          textAlign: "center",
           }}
  >
          {msg}
          </p>
           )}

          <button
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? "CRIANDO..." : "CRIAR CONTA"}
          </button>

          <a
            href="/login"
            className="text-center text-sm font-medium text-gray-700 underline"
          >
            Já tem conta? Entrar
          </a>
        </form>
      </div>
    </main>
  );
}