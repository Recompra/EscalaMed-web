"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  city: string;
  address: string;
  uf?: string;
  clinic?: string;
  weekday?: string;
  period?: string;
};

const SPECIALTIES = [
  "CLÍNICO GERAL","GINECOLOGISTA","PEDIATRA","CARDIOLOGISTA",
  "DERMATOLOGISTA","ORTOPEDISTA","UROLOGISTA","ENDOCRINOLOGISTA",
  "PSIQUIATRA","NEUROLOGISTA","OFTALMOLOGISTA","OTORRINOLARINGOLOGISTA",
  "GASTROENTEROLOGISTA","MASTOLOGISTA","ONCOLOGISTA","CIRURGIÃO GERAL",
  "ANESTESIOLOGISTA","OBSTETRA","NUTROLOGO","NEFROLOGISTA",
  "PNEUMOLOGISTA","REUMATOLOGISTA","HEMATOLOGISTA","INFECTOLOGISTA","OUTRAS",
] as const;

export default function MedicosPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

 async function loadDoctors() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) return;

  const { data: links } = await supabase
    .from("user_doctors")
    .select("doctor_id")
    .eq("user_id", user.id);

  const ids = (links ?? []).map((x: any) => x.doctor_id);

  if (ids.length === 0) {
    setDoctors([]);
    setFiltered([]);
    return;
  }

  const { data } = await supabase
    .from("doctors")
    .select("*")
    .in("id", ids)
    .order("name");

  if (data) {
    setDoctors(data);
    setFiltered(data);
  }
}

  useEffect(() => {
    let result = doctors;
    if (nameFilter) {
      result = result.filter((d) => d.name?.includes(nameFilter.toUpperCase()));
    }
    if (specialtyFilter) {
      result = result.filter((d) => d.specialty === specialtyFilter);
    }
    setFiltered(result);
  }, [nameFilter, specialtyFilter, doctors]);

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir?")) return;

    const { error } = await supabase.from("doctors").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir (provável RLS). Veja o console.");
      console.error(error);
      return;
    }

    setDoctors((prev) => prev.filter((doc) => doc.id !== id));
    setFiltered((prev) => prev.filter((doc) => doc.id !== id));
    loadDoctors();
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: 20,
    }}>

      {/* Título */}
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 22,
        color: "#0D1117",
        marginBottom: 16,
      }}>
        Médicos cadastrados ({doctors.length})
      </h1>

      {/* Filtros */}
      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Nome"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value.toUpperCase())}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid rgba(13,17,23,0.10)",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            background: "#fff",
            color: "#0D1117",
            outline: "none",
            width: "100%",
          }}
        />
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1.5px solid rgba(13,17,23,0.10)",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            background: "#fff",
            color: specialtyFilter ? "#0D1117" : "#8A9BB0",
            outline: "none",
            width: "100%",
          }}
        >
          <option value="">Especialidade</option>
          {SPECIALTIES.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((doc) => (
          <div
            key={doc.id}
            style={{
              padding: 16,
              border: "1px solid rgba(13,17,23,0.08)",
              borderLeft: "3px solid #1A6B4A",
              borderRadius: 14,
              background: "#fff",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
            }}
          >
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "#0D1117",
              }}>{doc.name}</strong>

              <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                {doc.specialty} · {doc.phone}
              </div>

              <div style={{ fontSize: 12, color: "#8A9BB0" }}>
                {doc.clinic ?? "—"} — {doc.address ?? "—"}
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {[doc.uf, doc.city, doc.weekday, doc.period].filter(Boolean).map((tag) => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 100,
                    background: "#F5F3EE", color: "#4A5568",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => router.push(`/admin?id=${doc.id}`)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(13,17,23,0.12)",
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0D1117",
                }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(192,57,43,0.20)",
                  background: "#FFF0EE",
                  color: "#C0392B",
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}