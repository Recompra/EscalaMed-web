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
  const router = useRouter();
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

  let existingDoctor: any = null;
  let doc: any = null;
  let user: any = null;

  try {
    const resExisting = await supabase
      .from("doctors")
      .select("*")
      .eq("name", name)
      .eq("phone", phone)
      .eq("uf", uf)
      .maybeSingle();

    existingDoctor = resExisting.data;

    if (!existingDoctor) {
      console.log("Médico não encontrado com nome, telefone e UF informados.");
      setMsg("Médico não encontrado. Verifique os dados ou cadastre um novo médico primeiro.");
      setMsgType("error");
      return; // Impede que continue e tente usar existingDoctor.id
    }

    console.log("Médico encontrado, ID:", existingDoctor.id);

    if (slotsSelected.length === 0) {
    setMsg("Selecione pelo menos 1 slot.");
    setMsgType("warning");
    return;
  }

  if (!citySelected) {
    setMsg("SELECIONE UMA CIDADE DA LISTA.");
    return;
  }

  const specOk = SPECIALTIES.includes((specialty || "").toUpperCase() as any);
  if (!specOk) {
    setMsg("ESCOLHA UMA ESPECIALIDADE DA LISTA (OU OUTRAS).");
    return;
  }

  if (!name || !specialty || !phone || !address || !uf || !city) {
    setMsg("Preencha nome, especialidade, telefone, endereço, UF e cidade.");
    return;
  }

  // Pegar usuário logado PRIMEIRO (para evitar erro de uso antes da declaração)
  const authUser = await supabase.auth.getUser();
  user = authUser?.data?.user;
  const userErr = authUser?.error;

  if (userErr || !user) {
    setMsg("Usuário não autenticado. Faça login.");
    console.error("Erro ao pegar usuário:", userErr);
    return;
  }

  console.log("Usuário logado:", user.id); // debug: veja se o ID aparece

  // Dados do médico
  const doctorData = {
    name,
    crm: crm || null,
    crm_uf: crmUf || null,
    phone,
    city,
    state: uf,
    uf: uf,
    specialty,
    clinic: clinic || null,
    address,
    secretary_name: secretaryName || null,
    secretary_phone: secretaryPhone || null,
    notes: notes || null,
    tenant_id: user.id,       // agora seguro: user já foi checado
    is_active: true,
  };

  console.log("Tentando inserir médico:", doctorData);

  // 1) normaliza
const phoneDigits = onlyDigits(phone);
const nameUp = (name || "").trim().toUpperCase();

// 2) procura duplicidade por telefone em outra UF
const { data: dupPhone, error: dupErr } = await supabase
  .from("doctors")
  .select("id,name,phone,city,state,crm,crm_uf")
  .eq("phone", phoneDigits)     // se seu banco salva phone só dígitos
  .neq("state", uf)             // UF diferente
  .limit(5);

if (dupErr) {
  console.log(dupErr);
} else if (dupPhone && dupPhone.length > 0) {
  const d = dupPhone[0];
  const place = `${(d.city || "—").toUpperCase()}/${(d.state || "—").toUpperCase()}`;

  // 🔎 Verifica possível duplicidade em UF diferente
const { data: possibleDup } = await supabase
  .from("doctors")
  .select("id, name, phone, city, uf")
  .or(`name.eq.${doctorData.name},phone.eq.${doctorData.phone}`);

const duplicatesInOtherUF = (possibleDup || []).filter(
  (d) =>
    d.uf &&
    doctorData.uf &&
    d.uf.toUpperCase() !== doctorData.uf.toUpperCase()
);

if (duplicatesInOtherUF.length > 0) {
  const info = duplicatesInOtherUF
    .map((d) => `${d.city || "Sem cidade"} / ${d.uf}`)
    .join(", ");

  const confirmSave = confirm(
    `⚠️ Já existe médico com mesmo nome ou telefone em:\n\n${info}\n\nDeseja continuar mesmo assim?`
  );

  if (!confirmSave) return;

  await supabase.from("notifications").insert({
  user_id: (duplicatesInOtherUF[0] as any).user_id, // quem já tem o cadastro
  title: "Possível duplicidade de UF",
  message: `O médico ${doctorData.name} foi cadastrado em outra UF (${doctorData.uf}).`,
});

}
}
// Se existingDoctor existir, notifica duplicate; caso contrário apenas loga
if (existingDoctor && existingDoctor.id) {
  await fetch(
    "https://ukfeskhdbbgngkrjrpas.supabase.co/functions/v1/notify-duplicate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctor_id: existingDoctor?.id,
        new_uf: uf,
        new_city: city,
      }),
    }
  );
} else {
  console.warn("notify-duplicate skipped: existingDoctor missing id", existingDoctor);
}
  console.log("Iniciando insert no doctors...");

// 1) força o tenant_id ir certo (igual ao usuário logado)
const payload = { ...doctorData, tenant_id: user.id };

const { data: doc, error: docErr } = await supabase
  .from("doctors")
  .insert(payload)
  .select("id, tenant_id")
  .maybeSingle();

// 2) LOG OBRIGATÓRIO (antes de QUALQUER doc.id)
console.log("RESULT INSERT doctors -> docErr:", docErr);
console.log("RESULT INSERT doctors -> doc:", doc);

// 3) se deu erro, para aqui
if (docErr) {
  console.error("ERRO REAL DO SUPABASE NO INSERT:", docErr);
  setMsg(docErr.message ?? "Erro ao cadastrar médico.");
  setMsgType("error");
  return;
}

// 4) se não veio id, para aqui (e NÃO tenta doc.id)
if (!doc?.id) {
  console.error("INSERT OK mas sem retorno de id. doc:", doc);
  setMsg("Inseriu, mas não retornou ID. (provável RLS no SELECT).");
  setMsgType("error");
  return;
}

console.log("Insert sucesso! ID:", doc.id, "tenant:", doc.tenant_id);

const { error: linkErr } = await supabase
  .from("user_doctors")
  .insert({
    user_id: user.id,
    doctor_id: doc.id,
  });

if (linkErr) {
  console.error("Erro no link user_doctors:", linkErr);
  setMsg("Médico cadastrado, mas falhou vincular ao seu perfil.");
  setMsgType("warning");
}
  const availabilityRows = slotsSelected.map((s) => ({
    doctor_id: doc.id,
    slot: s,
  }));

  const { error: avErr } = await supabase
    .from("doctor_availability")
    .insert(availabilityRows);

  if (avErr) {
    console.error("Erro nos slots:", avErr);
    setMsg("Erro ao salvar horários: " + (avErr.message || "Tente novamente"));
    setMsgType("error");
    return;
  }

setMsgType("success");
setMsg("Cadastrado ✅");

setName("");
setCrm("");
setCrmUf("");         
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

setMsgType("success");
setMsg("Cadastrado ✅");

setTimeout(() => {
  loadMyDoctors();
}, 1500);

return;

} catch (err) {
  console.error("onSave error:", err, { existingDoctor, doc, user });
  setMsg("Erro interno ao salvar. Veja console.");
  setMsgType("error");
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
        <h2 style={{ marginBottom: 16 }}>Cadastrar Médico</h2>

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
<div style={{ display: "grid", gridTemplateColumns: "1.4fr 120px 1.6fr", gap: 12 }}>
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
</div>

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
    gridTemplateColumns: "minmax( 0,8fr) minmax( 0,9fr)",
    gap: 12,
    width: "100%",
    alignItems: "end",
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
}