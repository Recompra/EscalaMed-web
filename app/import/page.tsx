"use client";

import * as XLSX from "xlsx";
import { useState } from "react";

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
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

    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao ler a planilha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Importar Médicos via Excel</h1>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        disabled={loading}
        style={{ marginTop: 12 }}
      />

      {loading && <p style={{ marginTop: 12 }}>Lendo planilha...</p>}
      {!!errorMsg && <p style={{ marginTop: 12, color: "red" }}>{errorMsg}</p>}

      {headers.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Cabeçalhos detectados ({headers.length})</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {headers.map((h) => (
              <span
                key={h}
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Pré-visualização (primeiras {Math.min(rows.length, 20)} linhas)</h3>
          <pre
            style={{
              marginTop: 8,
              background: "#0b1020",
              color: "#e6e6e6",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
              maxHeight: 360,
              fontSize: 12,
            }}
          >
            {JSON.stringify(rows.slice(0, 20), null, 2)}
          </pre>

          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Linhas lidas: <b>{rows.length}</b> (limite atual: 2000)
          </p>
        </div>
      )}
    </main>
  );
}