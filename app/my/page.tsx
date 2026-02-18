"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UFS, CITIES_BY_UF } from "@/data/cities";

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

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;

  // CRM
  crm: string | null;
  crm_uf: string | null;

  // Local (cidade)
  city: string | null;
  uf: string | null;

  clinic_name: string | null;
  address: string | null;
};

type UserDoctorRow = {
  id: string;
  user_id: string;
  doctor_id: string;
  doctors: Doctor | null; // relacionamento
};

export default function MyPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [raw, setRaw] = useState<Doctor[]>([]);

  // filtros
  const [qName, setQName] = useState("");
  const [qCrm, setQCrm] = useState("");
  const [qCrmUf, setQCrmUf] = useState("");
  const [qCity, setQCity] = useState("");
  const [qCityUf, setQCityUf] = useState("");
  const [qSpec, setQSpec] = useState("");
  const toUpper = (v: string) => (v || "").toUpperCase();

  const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
  const CITY_UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO"
];

  const rows = useMemo(() => {
  const name = qName.trim().toUpperCase();
  const crm = qCrm.trim().toUpperCase();
  const crmUf = qCrmUf.trim().toUpperCase();
  const city = qCity.trim().toUpperCase();
  const cityUf = qCityUf.trim().toUpperCase();
  const spec = qSpec.trim().toUpperCase();

  return raw.filter((d) => {
    if (name && !(d.name || "").toUpperCase().includes(name)) return false;
    if (crm && !(d.crm || "").toUpperCase().includes(crm)) return false;
    if (crmUf && (d.crm_uf || "").toUpperCase() !== crmUf) return false;

    if (city && !(d.city || "").toUpperCase().includes(city)) return false;
    if (cityUf && (d.uf || "").toUpperCase() !== cityUf) return false;

    if (spec && !(d.specialty || "").toUpperCase().includes(spec)) return false;

    return true;
  });
}, [raw, qName, qCrm, qCrmUf, qCity, qCityUf, qSpec]);

  const cityOptions = useMemo(() => {
  const uf = (qCityUf || "").trim().toUpperCase();
  if (!uf) return [];
  return ((CITIES_BY_UF as Record<string, string[]>)[uf] || []).slice().sort();
}, [qCityUf]);

  const cityUfOptions = useMemo(() => {
    return Array.from(
      new Set(raw.map((d) => (d.uf || "").trim().toUpperCase()).filter(Boolean))
    ).sort();
  }, [raw]);

  const specOptions = useMemo(() => {
    return Array.from(
      new Set(raw.map((d) => (d.specialty || "").trim().toUpperCase()).filter(Boolean))
    ).sort();
  }, [raw]);
  

  async function loadMyDoctors() {
    setLoading(true);
    setMsg("");

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      setLoading(false);
      setMsg("Usuário não autenticado.");
      setRaw([]);
      return;
    }

   const { data, error } = await supabase
  .from("doctors")
  .select("*")
  .order("created_at", { ascending: false });

console.log("DOCTORS TEST:", { error, data });

if (error) {
  setMsg("Erro ao carregar médicos.");
  setRaw([]);
  setLoading(false);
  return;
}

setRaw((data as unknown as Doctor[]) || []);
setLoading(false);
}

  async function removeFromMyList(doctorId: string) {
    setMsg("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

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
      console.log("ERRO AO REMOVER:", error);
      setMsg("Erro ao remover.");
      return;
    }

    setMsg("Removido ✅");
    // atualiza lista local sem refetch
    setRaw((prev) => prev.filter((d) => d.id !== doctorId));
  }

  useEffect(() => {
    loadMyDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>EscalaMed</h1>
      <div style={{ opacity: 0.8, marginTop: 6 }}>
        Minha Lista
      </div>

      {/* filtros (somente ajuda de busca) */}
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Nome</div>
          <input
            value={qName}
            onChange={(e) => setQName(e.target.value.toUpperCase())}
            placeholder="Digite o Nome"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>CRM</div>
          <input
            value={qCrm}
            onChange={(e) => setQCrm(e.target.value)}
            maxLength={6}
            placeholder="000000"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>UF</div>
          <select value={qCrmUf} onChange={(e) => setQCrmUf((e.target.value || "").toUpperCase())}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: "100%", textTransform: "uppercase" }}
>          <option value="AC">AC</option>
             {UFS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
           </select>
           </div>

        <div>
          <label style={{ fontWeight: 700 }}>Cidade</label>
          <select
          value={qCity}
          onChange={(e) => setQCity(e.target.value || "")}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: "100%", textTransform: "none" }}
>         <option value="">Digite a Cidade</option>
         {cityOptions.map((c) => (
         <option key={c} value={c}>{c}</option>
          ))}
         </select>
          </div>

          <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>UF</div>
          <select value={qCityUf} onChange={(e) => setQCityUf((e.target.value || "").toUpperCase())}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: "100%", textTransform: "uppercase" }}
            >
          {CITY_UFS.map((uf) => (<option key={uf} value={uf}>{uf}
        </option>
          ))}
        
        </select>
            </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Especialidade</div>
         <select value={qSpec}onChange={(e) => setQSpec((e.target.value || "").toUpperCase())}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: "100%", textTransform: "none" }}
           >
        <option value="">Selecione</option> {SPECIALTIES.map((s) => (
          <option key={s} value={s}>{s}
          </option>
         ))}
        </select>
          </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={loadMyDoctors}
          style={btnStyle}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Buscar"}
        </button>

        {msg ? <div style={{ alignSelf: "center" }}>{msg}</div> : null}
      </div>

      {/* LISTA SEMPRE APARENTE */}
      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {!loading && raw.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Sua escala está vazia.</div>
        ) : null}

        {!loading && raw.length > 0 && rows.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Sem match no filtro.</div>
        ) : null}

        {rows.map((d) => (
          <div key={d.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {d.name}
                </div>

                <div style={{ opacity: 0.85, marginTop: 2 }}>
                  {d.specialty || "—"}{" "}
                  {d.phone ? `• ${d.phone}` : ""}
                </div>

                <div style={{ opacity: 0.85, marginTop: 6 }}>
                  <div>
                    <b>CRM:</b>{" "}
                    {(d.crm || "—") + (d.crm_uf ? ` / ${d.crm_uf}` : "")}
                  </div>

                  <div>
                    <b>Local:</b>{" "}
                    {(d.city || "—") + (d.uf ? ` / ${d.uf}` : "")}
                  </div>

                  {d.clinic_name ? (
                    <div>
                      <b>Clínica:</b> {d.clinic_name}
                    </div>
                  ) : null}

                  {d.address ? (
                    <div>
                      <b>Endereço:</b> {d.address}
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {const ok = window.confirm("Tem certeza que deseja excluir o cadastro?");
                    if (ok) {removeFromMyList(d.id);}
                    }}
                  style={{ ...btnStyle, background: "#fff" }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 14,
  padding: 16,
  background: "#fff",
};
