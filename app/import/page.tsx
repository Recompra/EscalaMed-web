"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = Record<string, any>;

function normalizeKey(s: string) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " "); // espaços múltiplos
}
// SIGLA -> NOME (você pode ajustar depois se alguma sigla vier diferente)
const SPECIALTY_MAP: Record<string, string> = {
  CLG: "CLÍNICO GERAL",
  GIN: "GINECOLOGISTA",
  GOB: "OBSTETRA",
  PED: "PEDIATRA",
  CARD: "CARDIOLOGISTA",
  DERM: "DERMATOLOGISTA",
  ORTOP: "ORTOPEDISTA",
  URO: "UROLOGISTA",
  ENDO: "ENDOCRINOLOGISTA",
  PSIQ: "PSIQUIATRA",
  NEURO: "NEUROLOGISTA",
  OFT: "OFTALMOLOGISTA",
  ORL: "OTORRINOLARINGOLOGISTA",
  GASTRO: "GASTROENTEROLOGISTA",
  MASTO: "MASTOLOGISTA",
  ONCO: "ONCOLOGISTA",
  CIRG: "CIRURGIÃO GERAL",
  ANEST: "ANESTESIOLOGISTA",
  NUTRO: "NUTRÓLOGO",
  NEFRO: "NEFROLOGISTA",
  PNEUMO: "PNEUMOLOGISTA",
  REUMA: "REUMATOLOGISTA",
  HEMATO: "HEMATOLOGISTA",
  INFEC: "INFECTOLOGISTA",
  OUTRAS: "OUTRAS",
};

function normalizeSpecialty(raw: any) {
  const sigla = String(raw ?? "").trim().toUpperCase();
  if (!sigla) return "";
  return SPECIALTY_MAP[sigla] ?? sigla; // se não achar, salva a sigla mesmo
}

function findSpecialtyKey(rawHeaders: string[]) {
  const candidates = [
    "especialidade",
    "specialty",
    "especialidade eurofarma",
    "especialidade laboratorio",
    "especialidade lab",
    "especialidade medica",
    "especialidade médica",
  ];

  for (const h of rawHeaders) {
    const nh = normalizeKey(h);
    if (candidates.some((c) => nh.includes(normalizeKey(c)))) {
      return h; // retorna o nome ORIGINAL do header
    }
  }

  return null;
}

function findCityUfKey(rawHeaders: string[]) {
  const candidates = [
    "estado",
    "uf cidade",
    "uf da cidade",
    "uf endereco",
    "uf do endereco",
    "estado (uf)",
    "estado/uf",
    "cidade uf",
  ].map(normalizeKey);

  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }

  for (const h of rawHeaders) {
    const nh = normalizeKey(h);
    if (nh.includes("estado")) return h;
  }

  return null;
}

function findNameKey(rawHeaders: string[]) {
  const candidates = [
    "nome",
    "name",
    "nome do medico",
    "nome médico",
    "nome_medico",
    "medico",
    "médico",
    "profissional",
    "nome da conta",
    "conta",
    "account name",
  ].map(normalizeKey);

  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i]; // retorna o header original
  }
  return null;
}

function findCityKey(rawHeaders: string[]) {
  const candidates = [
    "cidade",
    "municipio",
    "município",
    "localidade",
    "city",
  ].map(normalizeKey);

  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

function findAddressKey(rawHeaders: string[]) {
  const candidates = [
    "endereco",
    "endereço",
    "logradouro",
    "rua",
    "address",
  ].map(normalizeKey);

  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = confirm(`Deseja importar a planilha "${file.name}"?`);
    if (!ok) {
    e.target.value = "";
     return;
}

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setHeaders([]);
    setRows([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("Planilha vazia ou inválida.");

      // Lê como matriz (primeira linha = cabeçalho)
      const aoa = XLSX.utils.sheet_to_json<any[]>(ws, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!aoa.length) throw new Error("Planilha sem linhas.");
      const rawHeaders = (aoa[0] || []).map((h: any) => (h ?? "").toString().trim());
      const cityUfKey = findCityUfKey(rawHeaders);
      const dataRows = aoa.slice(1);

      // Monta objetos {header: value}
      const parsed: Row[] = dataRows
        .filter((r) => Array.isArray(r) && r.some((cell) => String(cell ?? "").trim() !== ""))
        .map((r) => {
          const obj: Row = {};
          rawHeaders.forEach((h, idx) => {
            if (!h) return;
            obj[h] = r?.[idx] ?? "";
          });
          return obj;
        });

      setHeaders(["Nome", "Especialidade", ...rawHeaders.filter(Boolean)]);
     const limited = parsed.slice(0, 5000);

const specialtyKey = findSpecialtyKey(rawHeaders);
const nameKey = findNameKey(rawHeaders);
const cityKey = findCityKey(rawHeaders);
const addressKey = findAddressKey(rawHeaders);

const normalized = limited.map((row) => {
  const out: Row = { ...row };

 if (nameKey)
  out["Nome"] = String(row[nameKey] ?? "").trim().toUpperCase();

if (specialtyKey)
  out["Especialidade"] = normalizeSpecialty(row[specialtyKey]).toUpperCase();

if (cityUfKey)
  out["UF Cidade"] = String(row[cityUfKey] ?? "").trim().toUpperCase();

  return out;
});
setRows(normalized);
const { error } = await supabase
  .from("doctors")
  .insert(
  normalized.map((r) => ({
    name: r["Nome"],
    specialty: r["Especialidade"],
    phone: "",
    state: r["UF"],
    city: r["Cidade"],
  }))
);

if (error) throw error;

setSuccessMsg("Planilha importada com sucesso.");

    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao ler a planilha.");
    } finally {
      setLoading(false);
    }
  }

  return (
  <main
    style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: 16,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    }}
  >
    <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 4px" }}>
      Importar Médicos via Excel
    </h1>

    <p style={{ margin: "0 0 16px", opacity: 0.75, fontSize: 14 }}>
      Selecione um arquivo
    </p>

    <section
      style={{
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#fff",
    maxWidth: 260,
    }}
    >
      <div style={{ marginTop: 16 }}>

<input
  id="fileUpload"
  type="file"
  accept=".xlsx,.xls"
  onChange={handleFile}
  style={{ display: "none" }}
/>
  <label
    htmlFor="fileUpload"
    style={{
      display: "inline-block",
      padding: "10px 18px",
      borderRadius: 8,
      border: "1px solid #111",
      background: "#111",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "0.2s ease",
    }}
  >
    IMPORTAR
  </label>
</div>

      {errorMsg && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}
        >
          {errorMsg}
        </div>
      )}
    </section>

    {/* O resto da sua tela (chips, preview, etc) fica abaixo */}
    {/* NÃO apague seu conteúdo atual de headers/preview; só cole ele aqui embaixo depois */}
  </main>
  );
}