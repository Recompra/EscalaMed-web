"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = Record<string, any>;

function normalizeKey(s: string) {
  return (s || "").toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

const SPECIALTY_MAP: Record<string, string> = {
  CLG: "CLÍNICO GERAL", GIN: "GINECOLOGISTA", GOB: "OBSTETRA",
  PED: "PEDIATRA", CARD: "CARDIOLOGISTA", DERM: "DERMATOLOGISTA",
  ORTOP: "ORTOPEDISTA", URO: "UROLOGISTA", ENDO: "ENDOCRINOLOGISTA",
  PSIQ: "PSIQUIATRA", NEURO: "NEUROLOGISTA", OFT: "OFTALMOLOGISTA",
  ORL: "OTORRINOLARINGOLOGISTA", GASTRO: "GASTROENTEROLOGISTA",
  MASTO: "MASTOLOGISTA", ONCO: "ONCOLOGISTA", CIRG: "CIRURGIÃO GERAL",
  ANEST: "ANESTESIOLOGISTA", NUTRO: "NUTRÓLOGO", NEFRO: "NEFROLOGISTA",
  PNEUMO: "PNEUMOLOGISTA", REUMA: "REUMATOLOGISTA", HEMATO: "HEMATOLOGISTA",
  INFEC: "INFECTOLOGISTA", OUTRAS: "OUTRAS",
};

function normalizeSpecialty(raw: any) {
  const sigla = String(raw ?? "").trim().toUpperCase();
  if (!sigla) return "";
  return SPECIALTY_MAP[sigla] ?? sigla;
}

function findSpecialtyKey(rawHeaders: string[]) {
  const candidates = ["especialidade","specialty","especialidade eurofarma","especialidade laboratorio","especialidade lab","especialidade medica","especialidade médica"];
  for (const h of rawHeaders) {
    const nh = normalizeKey(h);
    if (candidates.some((c) => nh.includes(normalizeKey(c)))) return h;
  }
  return null;
}

function findCityUfKey(rawHeaders: string[]) {
  const candidates = ["estado","uf cidade","uf da cidade","uf endereco","uf do endereco","estado (uf)","estado/uf","cidade uf"].map(normalizeKey);
  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  for (const h of rawHeaders) {
    if (normalizeKey(h).includes("estado")) return h;
  }
  return null;
}

function findNameKey(rawHeaders: string[]) {
  const candidates = ["nome","name","nome do medico","nome médico","nome_medico","medico","médico","profissional","nome da conta","conta","account name"].map(normalizeKey);
  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

function findCityKey(rawHeaders: string[]) {
  const candidates = ["cidade","municipio","município","localidade","city"].map(normalizeKey);
  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

function findAddressKey(rawHeaders: string[]) {
  const candidates = ["endereco","endereço","logradouro","rua","address"].map(normalizeKey);
  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

function findCrmKey(rawHeaders: string[]) {
  const candidates = ["crm","crm medico","crm_medico","crm do medico","registro","registro medico","registro_medico","numero crm","número crm","crm numero","crm número","doc","documento","conselho","licencas ativas","licenças ativas","licenca ativa","licença ativa"].map(normalizeKey);
  const normHeaders = rawHeaders.map((h) => normalizeKey(h || ""));
  for (let i = 0; i < normHeaders.length; i++) {
    if (candidates.includes(normHeaders[i])) return rawHeaders[i];
  }
  return null;
}

function parseCrm(raw: string | number | null | undefined, fallbackUf = "") {
  const value = String(raw ?? "").trim().toUpperCase();
  const ufMatch = value.match(/^[A-Z]{2}/);
  const onlyDigits = value.replace(/\D/g, "");
  const crm = onlyDigits.slice(-6).padStart(6, "0");
  return { crm, crm_uf: ufMatch ? ufMatch[0] : fallbackUf };
}

export default function ImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = confirm(`Deseja importar a planilha "${file.name}"?`);
    if (!ok) { e.target.value = ""; return; }

    setLoading(true);
    setErrorMsg(""); setSuccessMsg("");
    setHeaders([]); setRows([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("Planilha vazia ou inválida.");

      const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", blankrows: false });
      if (!aoa.length) throw new Error("Planilha sem linhas.");

      const rawHeaders = (aoa[0] || []).map((h: any) => (h ?? "").toString().trim());
      const cityUfKey = findCityUfKey(rawHeaders);
      const dataRows = aoa.slice(1);

      const parsed: Row[] = dataRows
        .filter((r) => Array.isArray(r) && r.some((cell) => String(cell ?? "").trim() !== ""))
        .map((r) => {
          const obj: Row = {};
          rawHeaders.forEach((h, idx) => { if (!h) return; obj[h] = r?.[idx] ?? ""; });
          return obj;
        });

      setHeaders(["Nome", "Especialidade", ...rawHeaders.filter(Boolean)]);
      const limited = parsed.slice(0, 5000);

      const specialtyKey = findSpecialtyKey(rawHeaders);
      const nameKey = findNameKey(rawHeaders);
      const cityKey = findCityKey(rawHeaders);
      const addressKey = findAddressKey(rawHeaders);
      const crmKey = findCrmKey(rawHeaders);

      const normalized = limited.map((row) => {
        const out: Row = { ...row };
        if (nameKey) {
          const rawName = String(row[nameKey] ?? "").trim();
          const match = rawName.match(/HYPERLINK\s*\([^,]+,\s*"([^"]+)"\s*\)/i);
          out["Nome"] = match ? match[1].trim().toUpperCase() : rawName.toUpperCase();
        }
        if (specialtyKey) out["Especialidade"] = normalizeSpecialty(row[specialtyKey]).toUpperCase();
        if (cityUfKey) out["UF Cidade"] = String(row[cityUfKey] ?? "").trim().toUpperCase();
        if (crmKey) {
          const rawCrm = String(row[crmKey] ?? "").trim();
          const firstCrm = rawCrm.split(",")[0].trim();
          const parsedCrm = parseCrm(firstCrm, cityUfKey ? String(row[cityUfKey] ?? "").trim().toUpperCase() : "");
          out["CRM"] = parsedCrm.crm;
          out["CRM_UF"] = parsedCrm.crm_uf;
        }
        return out;
      });

      setRows(normalized);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error("Usuário não autenticado.");

      // ✅ CORREÇÃO 1: city e uf agora usam as chaves detectadas corretamente
      const { data: inserted, error } = await supabase
        .from("doctors")
        .insert(
          normalized.map((r) => ({
            name: String(r["Nome"] ?? "").trim().toUpperCase(),
            specialty: String(r["Especialidade"] ?? "").trim().toUpperCase(),
            phone: "", clinic: "", address: "",
            city: cityKey ? String(r[cityKey] ?? "").trim().toUpperCase() : "",
            uf: cityUfKey ? String(r[cityUfKey] ?? "").trim().toUpperCase() : "",
            state: cityUfKey ? String(r[cityUfKey] ?? "").trim().toUpperCase() : "",
            secretary_name: "", secretary_phone: "", notes: "",
            crm: String(r["CRM"] ?? "").trim(),
            crm_uf: String(r["CRM_UF"] ?? "").trim().toUpperCase(),
            tenant_id: user.id,
            is_active: true,
            
          }))
        )
        .select("id");

      if (error) throw error;

      // ✅ CORREÇÃO 2: inserir registro em doctor_availability para cada médico importado
      if (inserted && inserted.length > 0) {
        const { error: availError } = await supabase
          .from("doctor_availability")
          .insert(
            inserted.map((doc) => ({
              doctor_id: doc.id,
              slot: "SEGUNDA_MANHA",
              tenant_id: user.id,
            }))
          );
        if (availError) throw availError;
      }

      setErrorMsg("");
      setSuccessMsg(`${inserted?.length ?? 0} médicos importados com sucesso.`);

    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao ler a planilha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 720,
      margin: "0 auto",
      padding: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#0D1117",
          margin: 0,
        }}>
          Importar Médicos via Excel
        </h1>
        <button
          type="button"
          onClick={() => router.push("/home")}
          style={{
            background: "rgba(13,17,23,0.06)", color: "#0D1117",
            padding: "8px 14px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 12,
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
          }}
        >Voltar</button>
      </div>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8A9BB0" }}>
        Selecione um arquivo
      </p>

      <section style={{
        border: "1px solid rgba(13,17,23,0.08)",
        borderRadius: 14,
        padding: 20,
        background: "#fff",
        maxWidth: 300,
        boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
      }}>
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
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "#1A6B4A",
            color: "#fff",
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >
          {loading ? "IMPORTANDO..." : "IMPORTAR"}
        </label>

        {successMsg && (
          <div style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(26,107,74,0.10)",
            border: "1.5px solid rgba(26,107,74,0.20)",
            color: "#1A6B4A",
            fontSize: 13,
            fontWeight: 600,
          }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1.5px solid rgba(192,57,43,0.20)",
            background: "#FFF0EE",
            color: "#C0392B",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}>
            {errorMsg}
          </div>
        )}
      </section>
    </main>
  );
}