"use client";

export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function AdminContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const router = useRouter();
  
  console.log("ADMIN PAGE OK - ACCORDION TEST");

  // ── ÚNICO TRECHO ALTERADO: inputStyle ──
  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#FFFFFF",
    color: "#0D1117",
    outline: "none",
  };

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
  const [weekday, setWeekday] = useState("");
  const [period, setPeriod] = useState("");
  function formatCRM(raw: string, ufValue: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
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
  if (!editId) return;

  async function loadDoctorForEdit() {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setName(data.name || "");
      setCrm(data.crm || "");
      setCrmUf(data.crm_uf || "DF");
      setPhone(data.phone || "");
      setClinic(data.clinic || "");
      setAddress(data.address || "");
      setSpecialty(data.specialty || "");
      setUf(data.uf || "DF");
      setSecretaryName(data.secretary_name || "");
      setSecretaryPhone(data.secretary_phone || "");
      setNotes(data.notes || "");
      const loadedCity = (data.city || "").toUpperCase();
      setCity(loadedCity);
      setCityQuery(loadedCity);
      setCitySelected(!!loadedCity);
      setCityOpen(false);
      setWeekday(data.weekday || "Segunda");
      setPeriod(data.period || "Manhã");

      const { data: avail, error: avErr } = await supabase
        .from("doctor_availability")
        .select("slot")
        .eq("doctor_id", editId);
      if (avErr) {
        console.log("erro ao buscar disponibilidade:", avErr);
      } else if (avail) {
        setSlotsSelected(avail.map((row: any) => row.slot));
      }
    }
  }

  loadDoctorForEdit();
}, [editId]);
  useEffect(() => {
  if (editId) return;

  const list = CITIES_BY_UF[uf] ?? [];
  setCity("");
  setCityQuery("");
  setCitySelected(false);
}, [uf, editId]);


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
  console.log("CLICOU NO SALVAR editId=", editId);
  setMsg("");
  setMsgType(null);

  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      setMsg("Usuário não autenticado. Faça login.");
      setMsgType("error");
      return;
    }

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

    const nameNorm = (name || "").trim().toUpperCase();
    const phoneNorm = onlyDigits(phone);
    const ufNorm = uf;

    let existingDoctorQuery = supabase
      .from("doctors")
      .select("id")
      .eq("name", nameNorm)
      .eq("phone", phoneNorm)
      .eq("uf", ufNorm);
    if (editId) {
      existingDoctorQuery = existingDoctorQuery.neq("id", editId);
    }
    const { data: existingDoctor, error: existingErr } = await existingDoctorQuery.maybeSingle();

    if (existingErr) {
      console.error("Erro ao checar duplicidade:", existingErr);
      setMsg(existingErr.message ?? "Erro ao checar duplicidade.");
      setMsgType("error");
      return;
    }

    if (existingDoctor?.id && existingDoctor.id !== editId) {
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

const { data: dupOtherUF, error: dupOtherUFErr } = await supabase
  .from("doctors")
  .select("id, uf, state, crm_uf")
  .or(`phone.eq.${phoneNorm},name.eq.${nameNorm}`)
  .neq("uf", ufNorm)
  .limit(1)
  .maybeSingle();

if (dupOtherUFErr) {
  console.error("Erro ao checar duplicidade (outra UF):", dupOtherUFErr);
} else if (dupOtherUF?.id) {
  const ufExistente = dupOtherUF.uf
  const ok = confirm(
    `Atenção: este médico já está cadastrado na UF ${ufExistente}. Deseja continuar mesmo assim?`
  );
  if (!ok) {
    setMsg("Cadastro cancelado.");
    setMsgType("error");
    return;
  }
}

    const payload = {
      name: nameNorm,
      crm: crm || null,
      crm_uf: crmUf || null,
      phone: phoneNorm,
      city: (city || "").toUpperCase(),
      uf: ufNorm,
      state: ufNorm,
      specialty: (specialty || "").toUpperCase(),
      clinic: clinic ? clinic.toUpperCase() : null,
      address: (address || "").toUpperCase(),
      secretary_name: secretaryName ? secretaryName.toUpperCase() : null,
      secretary_phone: secretaryPhone ? onlyDigits(secretaryPhone) : null,
      notes: notes || null,
      tenant_id: user.id,
      is_active: true,
    };

if (editId) {
  const { tenant_id, is_active, ...updatePayload } = payload;

  const { error: updErr } = await supabase
    .from("doctors")
    .update(updatePayload)
    .eq("id", editId);

  if (updErr) {
    console.error("Erro ao atualizar médico:", updErr);
    setMsg("Erro ao atualizar médico.");
    setMsgType("error");
    return;
  }

  try {
    await supabase.from("doctor_availability").delete().eq("doctor_id", editId);
    if (slotsSelected.length > 0) {
      const availabilityRows = slotsSelected.map((s) => ({
        doctor_id: editId,
        slot: s,
      }));
      const { error: avErr } = await supabase
        .from("doctor_availability")
        .insert(availabilityRows);
      if (avErr) {
        console.error("Erro ao atualizar horários:", avErr);
      }
    }
  } catch (e) {
    console.error("Erro ao recadastrar disponibilidade:", e);
  }

  setMsg("Médico atualizado com sucesso.");
  setMsgType("success");
  setTimeout(() => {
    router.push("/home");
  }, 1500);
  return;
}
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

    const { error: linkErr2 } = await supabase
      .from("user_doctors")
      .insert({ user_id: user.id, doctor_id: newDoc.id });

    if (linkErr2) {
      console.error("Erro ao vincular médico:", linkErr2);
      setMsg("Médico criado, mas falhou vincular ao seu perfil.");
      setMsgType("warning");
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
    // ── ALTERADO: background e fontFamily ──
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#F5F3EE",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── ALTERADO: container visual ── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid rgba(13,17,23,0.10)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          {/* ── ALTERADO: h2 ── */}
          <h2 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#0D1117",
          }}>Cadastrar Médico</h2>

          {/* ── ALTERADO: botão Voltar ── */}
          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{
              backgroundColor: "#1A6B4A",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#155c3e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1A6B4A";
            }}
          >
            Voltar
          </button>
        </div>

        {/* Nome */}
        <label style={{ display: "grid", gap: 6 }}>
          {/* ── ALTERADO: span label ── */}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="Digite o nome"
            style={inputStyle}
          />
        </label>

        <div style={{display: "grid",gridTemplateColumns:typeof window !== "undefined" && window.innerWidth >= 768 ? "1.4fr 120px 1.6fr": "1fr",gap: 12,}}>

          {/* CRM */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>CRM</span>
            <input
              value={crm}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCrm(digits);
              }}
              placeholder="000000"
              style={inputStyle}
            />
          </label>

          {/* UF CRM */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>UF</span>
            <select value={crmUf} onChange={(e) => setCrmUf(e.target.value)} style={inputStyle}>
              {UFS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>

        </div>

        {/* Telefone */}
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Telefone</span>
          <input
            value={formatPhoneBR(phone)}
            onChange={(e) => setPhone(onlyDigits(e.target.value))}
            placeholder="(62) 99999-9999"
            style={inputStyle}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6, position: "relative" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Cidade</span>
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
                border: "1.5px solid rgba(13,17,23,0.10)",
                borderRadius: 10,
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

          {/* UF da cidade */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>UF</span>
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
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Especialidade</span>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                style={{ ...inputStyle, width: "100%", maxWidth: "none" }}
              >
                <option value="">Selecione</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* Clínica */}
            <label style={{ display: "grid", gap: 6, width: "100%", minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Clínica</span>
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Endereço</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value.toUpperCase())}
            placeholder="Rua, número, bairro"
            style={inputStyle}
          />
        </label>

        {/* Dias de Atendimento */}
        <div style={{ display: "grid", gap: 6, position: "relative" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Dias de Atendimento</span>
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
                border: "1.5px solid rgba(13,17,23,0.10)",
                borderRadius: 10,
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Nome Secretária</span>
          <input
            value={secretaryName}
            onChange={(e) => setSecretaryName(e.target.value.toUpperCase())}
            placeholder="Nome da secretária"
            style={inputStyle}
          />
        </label>

        {/* Telefone Secretária */}
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Telefone Secretária</span>
          <input
            value={formatPhoneBR(secretaryPhone)}
            onChange={(e) => setSecretaryPhone(onlyDigits(e.target.value))}
            placeholder="(00) 99999-1122"
            style={inputStyle}
          />
        </label>

        {/* Observações */}
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4A5568", textTransform: "uppercase" }}>Observações</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </label>

        {/* ── ALTERADO: mensagem de feedback ── */}
        {msg && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: msgType === "success" ? "rgba(26,107,74,0.10)" : msgType === "warning" ? "#FFF3DC" : "#FFF0EE",
              color: msgType === "success" ? "#1A6B4A" : msgType === "warning" ? "#7A4A00" : "#C0392B",
              fontWeight: 600,
              fontSize: 13,
              border: `1.5px solid ${msgType === "success" ? "rgba(26,107,74,0.20)" : msgType === "warning" ? "rgba(212,130,10,0.25)" : "rgba(192,57,43,0.20)"}`,
            }}
          >
            {msg}
          </div>
        )}

        {/* ── ALTERADO: botão Salvar ── */}
        <button
          type="button"
          onClick={onSave}
          style={{
            marginTop: 16,
            padding: "14px 16px",
            background: "#1A6B4A",
            color: "white",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            width: "100%",
            boxShadow: "0 4px 16px rgba(26,107,74,0.30)",
          }}
        >
          Salvar Médico
        </button>

      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}