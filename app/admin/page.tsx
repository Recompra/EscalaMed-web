"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { UFS, CITIES_BY_UF } from "@/data/cities";

type Slot =
  | "Segunda Manhã" | "Segunda Tarde"
  | "Terça Manhã"   | "Terça Tarde"
  | "Quarta Manhã"  | "Quarta Tarde"
  | "Quinta Manhã"  | "Quinta Tarde"
  | "Sexta Manhã"   | "Sexta Tarde";

const SLOTS: Slot[] = [
  "Segunda Manhã", "Segunda Tarde",
  "Terça Manhã", "Terça Tarde",
  "Quarta Manhã", "Quarta Tarde",
  "Quinta Manhã", "Quinta Tarde",
  "Sexta Manhã", "Sexta Tarde",
];

const SPECIALTIES = [
  "CLÍNICO GERAL",
  "GINECOLOGISTA",
  "PEDIATRA",
  "CARDIOLOGISTA",
  "DERMATOLOGISTA",
  "ORTOPEDISTA",
  "UROLOGISTA",
  "ENDOCRINOLOGISTA",
  "PSIQUIATRA",
  "NEUROLOGISTA",
  "OFTALMOLOGISTA",
  "OTORRINOLARINGOLOGISTA",
  "GASTROENTEROLOGISTA",
  "MASTOLOGISTA",
  "ONCOLOGISTA",
  "CIRURGIÃO GERAL",
  "ANESTESIOLOGISTA",
  "OBSTETRA",
  "NUTROLOGO",
  "NEFROLOGISTA",
  "PNEUMOLOGISTA",
  "REUMATOLOGISTA",
  "HEMATOLOGISTA",
  "INFECTOLOGISTA",
  "OUTRAS",
] as const;

export default function AdminPage() {
  const router = useRouter();
  
  console.log("ADMIN PAGE OK - ACCORDION TEST");
  const inputStyle = {padding: 10,borderRadius: 8,border: "1px solid #ddd",fontSize: 14,};
  const [name, setName] = useState("");
  const [crmUf, setCrmUf] = useState("DF");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [clinic, setClinic] = useState("");
  const [crm, setCrm] = useState("");
  const [address, setAddress] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [secretaryPhone, setSecretaryPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [slotsSelected, setSlotsSelected] = useState<string[]>([]);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [msgType, setMsgType] = useState<"success" | "error" | "warning" | null>(null);
  const [myDoctors, setMyDoctors] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uf, setUf] = useState<(typeof UFS)[number]>(UFS[0]);
  const cities = useMemo<string[]>(() => CITIES_BY_UF[uf] ?? [], [uf]);
  const [city, setCity] = useState<string>("");
  const [cityQuery, setCityQuery] = useState("");
  const [citySelected, setCitySelected] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  function formatCRM(raw: string, ufValue: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 6); // até 6 dígitos
  const padded = digits.padStart(6, "0");
  return `${padded}-${ufValue}`;
}
async function loadMyDoctors() {
  setMsg("");

  const auth = await supabase.auth.getUser();
  const user = auth?.data?.user;
  setLoadError(null);

  if (!user) {
    setMsg("Usuário não autenticado.");
    return;
  }

  // 1) busca os ids dos médicos linkados ao usuário
const { data: links, error: linkErr } = await supabase
  .from("user_doctors")
  .select("doctor_id")
  .eq("user_id", user.id);

if (linkErr) {
  console.log(linkErr);
  setLoadError("Erro ao carregar seus médicos.");
  return;
}

const ids = (links ?? []).map((x: any) => x.doctor_id).filter(Boolean);

if (ids.length === 0) {
  setMyDoctors([]);
  return;
}

// 2) busca os médicos na tabela doctors
const { data: docs, error: docsErr } = await supabase
  .from("doctors")
  .select("*")
  .in("id", ids);

if (docsErr) {
  console.log(docsErr);
  setLoadError("Erro ao carregar seus médicos.");
  return;
}

setMyDoctors(docs ?? []);
setLoadError(null);

  // transforma para uma lista simples de doctors
  const list = (docs ?? [])
    .map((row: any) => row.doctors)
    .filter(Boolean);

  setMyDoctors(list);
}

useEffect(() => {
  loadMyDoctors();
}, []);
  function norm(s: string) {return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();}
  const cityOptions = useMemo(() => {
  const q = norm(cityQuery);if (!q) return cities.slice(0, 30);if (q.length < 2) {
  return cities.filter((c) => norm(c).startsWith(q)).slice(0, 30);}
  return cities.filter((c) => norm(c).includes(q)).slice(0, 30);}, [cities, cityQuery]);

  useEffect(() => {
  setCity("");
  setCityQuery("");
}, [uf]);
  
  function onlyDigits(v: string) {
  return v.replace(/\D/g, "");}
  function formatPhoneBR(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    if (!data?.user) router.push("/login");
  });

}, [router]);
  useEffect(() => {
  const list = CITIES_BY_UF[uf] ?? [];
  setCity("");
  setCityQuery("");
  setCitySelected(false);
}, [uf]);


  async function handleDelete(doctorId: string) {
    setMsg("");

    const auth = await supabase.auth.getUser();
    const user = auth?.data?.user;
    if (!user) {
      setMsg("Usuário não autenticado.");
      return;
    }

    const { error } = await supabase
      .from("user_doctors")
      .delete()
      .eq("user_id", user.id)
      .eq("doctor_id", doctorId);

    if (error) {
      console.log(error);
      setMsg("Erro ao excluir.");
      return;
    }

    setMsg("Excluído.");
    await loadMyDoctors();
  }

  async function onSave() {
  console.log("CLICOU NO SALVAR");
  setMsg("");
  setMsgType(null);

  try {
    // 1) Validar usuário
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      setMsg("Usuário não autenticado. Faça login.");
      setMsgType("error");
      return;
    }

    // 2) Validações de campos
    if (slotsSelected.length === 0) {
      setMsg("Selecione pelo menos 1 slot.");
      setMsgType("warning");
      return;
    }

    if (!citySelected) {
      setMsg("SELECIONE UMA CIDADE DA LISTA.");
      setMsgType("warning");
      return;
    }

    const specOk = SPECIALTIES.includes((specialty || "").toUpperCase() as any);
    if (!specOk) {
      setMsg("ESCOLHA UMA ESPECIALIDADE DA LISTA (OU OUTRAS).");
      setMsgType("warning");
      return;
    }

    if (!name || !specialty || !phone || !address || !uf || !city) {
      setMsg("Preencha nome, especialidade, telefone, endereço, UF e cidade.");
      setMsgType("warning");
      return;
    }

    // Normalizações (mantenha simples e consistente)
    const nameNorm = (name || "").trim().toUpperCase();
    const phoneNorm = onlyDigits(phone); // seu input já guarda dígitos, mas garante
    const ufNorm = uf;

    // 3) Verificar se já existe (Nome + Telefone + UF)
    const { data: existingDoctor, error: existingErr } = await supabase
      .from("doctors")
      .select("id")
      .eq("name", nameNorm)
      .eq("phone", phoneNorm)
      .eq("uf", ufNorm)
      .maybeSingle();

    if (existingErr) {
      console.error("Erro ao checar duplicidade:", existingErr);
      setMsg(existingErr.message ?? "Erro ao checar duplicidade.");
      setMsgType("error");
      return;
    }

    // 3A) Se já existe: só vincula ao usuário e salva horários
    if (existingDoctor?.id) {
      const { error: linkErr } = await supabase
        .from("user_doctors")
        .upsert({ user_id: user.id, doctor_id: existingDoctor.id }, { onConflict: "user_id,doctor_id" });

      if (linkErr) {
        console.error("Erro ao vincular médico:", linkErr);
        setMsg(linkErr.message ?? "Erro ao vincular médico ao seu perfil.");
        setMsgType("error");
        return;
      }

      const availabilityRows = slotsSelected.map((s) => ({
        doctor_id: existingDoctor.id,
        slot: s,
      }));

      const { error: avErr } = await supabase
        .from("doctor_availability")
        .insert(availabilityRows);

      if (avErr) {
        console.error("Erro ao salvar horários:", avErr);
        setMsg(avErr.message ?? "Erro ao salvar horários.");
        setMsgType("error");
        return;
      }

      setMsg("Este médico já existia e foi vinculado ao seu perfil ✅");
      setMsgType("success");

      setTimeout(() => loadMyDoctors(), 1500);
      return;
    }

    // 3B) Aviso: já existe em OUTRA UF (NUNCA avisar se for a mesma UF)
const { data: dupOtherUF, error: dupOtherUFErr } = await supabase
  .from("doctors")
  .select("id, uf, state, crm_uf")
  .or(`phone.eq.${phoneNorm},name.eq.${nameNorm}`)
  .neq("uf", ufNorm)          // se no seu banco o campo for "state", troque esta linha
  .limit(1)
  .maybeSingle();

if (dupOtherUFErr) {
  console.error("Erro ao checar duplicidade (outra UF):", dupOtherUFErr);
  // não trava o cadastro por causa do aviso
} else if (dupOtherUF?.id) {
  const ufExistente = dupOtherUF.uf
  const ok = window.confirm(
    `Atenção: este médico já está cadastrado na UF ${ufExistente}. Deseja continuar mesmo assim?`
  );
  if (!ok) {
    setMsg("Cadastro cancelado.");
    setMsgType("error");
    return;
  }
}

    // 4) Inserir novo médico
    const payload = {
      name: nameNorm,
      crm: crm || null,
      crm_uf: crmUf || null,
      phone: phoneNorm,
      city: (city || "").toUpperCase(),
      uf: ufNorm,
      state: ufNorm, // se você usa os dois no banco
      specialty: (specialty || "").toUpperCase(),
      clinic: clinic ? clinic.toUpperCase() : null,
      address: (address || "").toUpperCase(),
      secretary_name: secretaryName ? secretaryName.toUpperCase() : null,
      secretary_phone: secretaryPhone ? onlyDigits(secretaryPhone) : null,
      notes: notes || null,
      tenant_id: user.id,
      is_active: true,
    };

    const { data: newDoc, error: docErr } = await supabase
      .from("doctors")
      .insert(payload)
      .select("id")
      .single();

    if (docErr || !newDoc?.id) {
      console.error("Erro ao criar médico:", docErr, newDoc);
      setMsg(docErr?.message ?? "Erro ao criar médico. (Possível RLS bloqueando retorno do SELECT)");
      setMsgType("error");
      return;
    }

    // 5) Vincular ao usuário + salvar horários
    const { error: linkErr2 } = await supabase
      .from("user_doctors")
      .insert({ user_id: user.id, doctor_id: newDoc.id });

    if (linkErr2) {
      console.error("Erro ao vincular médico:", linkErr2);
      setMsg("Médico criado, mas falhou vincular ao seu perfil.");
      setMsgType("warning");
      // continua mesmo assim para salvar horários? (opcional)
      // return;
    }

    const availabilityRows = slotsSelected.map((s) => ({
      doctor_id: newDoc.id,
      slot: s,
    }));

    const { error: avErr2 } = await supabase
      .from("doctor_availability")
      .insert(availabilityRows);

    if (avErr2) {
      console.error("Erro ao salvar horários:", avErr2);
      setMsg(avErr2.message ?? "Erro ao salvar horários.");
      setMsgType("error");
      return;
    }

    // 6) Sucesso + limpeza
    setMsg("Cadastrado ✅");
    setMsgType("success");

    setName("");
    setCrm("");
    setCrmUf("DF");
    setPhone("");
    setUf("DF");
    setCity("");
    setCityQuery("");
    setCitySelected(false);
    setCityOpen(false);
    setSpecialty("");
    setClinic("");
    setAddress("");
    setSecretaryName("");
    setSecretaryPhone("");
    setNotes("");
    setSlotsSelected([]);
    setSlotsOpen(false);

    setTimeout(() => loadMyDoctors(), 1500);
    return;
  } catch (err) {
    console.error("onSave error:", err);
    setMsg("Erro interno ao salvar. Veja console.");
    setMsgType("error");
    return;
  }
}

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02))",
      }} 
      >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "rgba(255,255,255,0.65)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
  <h2 style={{ margin: 0 }}>Cadastrar Médico</h2>

  <button
    type="button"
    onClick={() => router.push("/")}
    style={{
      backgroundColor: "#111827",
      color: "white",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#0f172a";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#111827";
    }}
  >
    Voltar
  </button>
</div>

        {/* Nome */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Nome</span>
  <input
    value={name}
    onChange={(e) => setName(e.target.value.toUpperCase())}
    placeholder="Digite o nome"
    style={inputStyle}
  />

</label>
<div style={{display: "grid",gridTemplateColumns:typeof window !== "undefined" && window.innerWidth >= 768 ? "1.4fr 120px 1.6fr": "1fr",gap: 12, }}
>

{/* CRM */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>CRM</span>
  <input
    value={crm}
   onChange={(e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
  setCrm(digits);}}
    placeholder="000000"
    style={inputStyle}
  />

</label>
{/* UF CRM */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>UF</span>
  <select value={crmUf} onChange={(e) => setCrmUf(e.target.value)} style={inputStyle}>
    {UFS.map((u) => (
      <option key={u} value={u}>{u}</option>
    ))}
  </select>
</label>

</div>

{/* Telefone (por enquanto normal; máscara no passo 2) */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Telefone</span>
  <input
    value={formatPhoneBR(phone)}
    onChange={(e) => setPhone(onlyDigits(e.target.value))}
    placeholder="(62) 99999-9999"
    style={inputStyle}
  />
</label>

<div style={{ display: "grid", gridTemplateColumns: "2fr 120px", gap: 12, alignItems: "end" }}>
 <label style={{ display: "grid", gap: 6, position: "relative" }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Cidade</span>

  <input
    value={cityQuery}
   onChange={(e) => {
  const value = e.target.value.toUpperCase();
  setCityQuery(value);
  setCitySelected(false);
  setCity("");
  setCityOpen(value.length > 0);   
}}

    placeholder="Digite a cidade"
    style={inputStyle}
  />
  
 </label>
  {cityOpen && !citySelected && cityOptions.length > 0 && (
  <div
    style={{
      position: "absolute",
      top: 62,
      left: 0,
      right: 0,
      background: "white",
      border: "1px solid #ddd",
      borderRadius: 8,
      boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
      maxHeight: 240,
      overflowY: "auto",
      zIndex: 20,
    }}
  >
    {cityOptions.map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => {
  setCity(c);
  setCityQuery(c);
  setCitySelected(true);
  setCityOpen(false); 
}}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        {c}
      </button>
    ))}
    
  </div>
)}
{/* UF (da cidade) */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>UF</span>
  <select
    value={uf}
    onChange={(e) => setUf(e.target.value as (typeof UFS)[number])}
    style={inputStyle}
  >
    {UFS.map((u) => (
      <option key={u} value={u}>{u}</option>
    ))}
  </select>
</label>

<div
  style={{
    display: "grid",
    gridTemplateColumns: typeof window !== "undefined" && window.innerWidth >= 768 ? "1fr 1fr" : "1fr",
    gap: 12,
    width: "100%",
  }}
>
  {/* Especialidade */}
  <label style={{ display: "grid", gap: 6, width: "100%", minWidth: 0 }}>
    <span style={{ fontSize: 13, fontWeight: 700 }}>Especialidade</span>

    <select
      value={specialty}
      onChange={(e) => setSpecialty(e.target.value)}
      style={{ ...inputStyle, width: "100%", maxWidth: "none" }}
    >
      <option value="">Selecione</option>
      {SPECIALTIES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  </label>

  {/* Clínica */}
  <label style={{ display: "grid", gap: 6, width: "100%", minWidth: 0 }}>
    <span style={{ fontSize: 13, fontWeight: 700 }}>Clínica</span>
    <input
      value={clinic}
      onChange={(e) => setClinic(e.target.value.toUpperCase())}
      placeholder="Nome da clínica"
      style={{ ...inputStyle, width: "100%", maxWidth: "none" }}
    />
  </label>
</div>
  

</div>
{/* Endereço */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Endereço</span>
  <input
    value={address}
    onChange={(e) => setAddress(e.target.value.toUpperCase())}
    placeholder="Rua, número, bairro"
    style={inputStyle}
  />
</label>

{/* Dias de Atendimento */}
<div style={{ display: "grid", gap: 6, position: "relative" }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Dias de Atendimento</span>

  <button
  type="button"
  onClick={() => setSlotsOpen((v) => !v)}
  style={{ ...inputStyle, width: "100%", textAlign: "left", cursor: "pointer" }}
>
  {slotsSelected.length ? slotsSelected.join(", ") : "SELECIONAR"}
</button>

{slotsOpen && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 6,
      background: "white",
      border: "1px solid #ddd",
      borderRadius: 8,
      boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
      zIndex: 30,
      padding: 8,
      display: "grid",
      gap: 6,
    }}
  >
    {SLOTS.map((s) => {
      const checked = slotsSelected.includes(s);
      return (
        <label key={s} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              setSlotsSelected((prev) =>
                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
              );
            }}
          />
          <span>{s}</span>
        </label>
      );
    })}

    <button
      type="button"
      onClick={() => setSlotsOpen(false)}
      style={{ ...inputStyle, width: "100%", marginTop: 8 }}
    >
      OK
    </button>
  </div>
)}
</div>

{/* Nome Secretária */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Nome Secretária</span>
  <input
    value={secretaryName}
    onChange={(e) => setSecretaryName(e.target.value.toUpperCase())}
    placeholder="Nome da secretária"
    style={inputStyle}
  />
</label>

{/* Telefone Secretária (máscara no passo 2 também) */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Telefone Secretária</span>
  <input
    value={formatPhoneBR(secretaryPhone)}
    onChange={(e) => setSecretaryPhone(onlyDigits(e.target.value))}
    placeholder="(00) 99999-1122"
    style={inputStyle}
  />
</label>

{/* Observações */}
<label style={{ display: "grid", gap: 6 }}>
  <span style={{ fontSize: 13, fontWeight: 700 }}>Observações</span>
  <textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Observações (opcional)"
    rows={3}
    style={{ ...inputStyle, resize: "vertical" as const }}
  />
</label>

{msg && (
  <div
    style={{
      marginTop: 16,
      padding: "10px 14px",
      borderRadius: 6,
      background: msgType === "success" ? "#d4edda" : "#f8d7da",
      color: msgType === "success" ? "#155724" : "#721c24",
      fontWeight: 600,
    }}
  >
    {msg}
  </div>
)}

<button
  type="button"
  onClick={onSave}
  style={{
    marginTop: 16,
    padding: "10px 16px",
    background: "#111",
    color: "white",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  }}
>
  Salvar Médico
</button>

        </div>
     </main>
  );
}
