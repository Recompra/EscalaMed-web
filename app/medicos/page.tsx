"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  weekday?: string;
  period?: string;
};

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

export default function MedicosPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    const { data } = await supabase
      .from("doctors")
      .select("*")
      .order("name");

    if (data) {
      setDoctors(data);
      setFiltered(data);
    }
  }

  useEffect(() => {
    let result = doctors;

    if (nameFilter) {
      result = result.filter((d) =>
        d.name?.includes(nameFilter.toUpperCase())
      );
    }

    if (specialtyFilter) {
      result = result.filter((d) => d.specialty === specialtyFilter);
    }

    setFiltered(result);
  }, [nameFilter, specialtyFilter, doctors]);

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir?")) return;

    await supabase.from("doctors").delete().eq("id", id);
    loadDoctors();
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
     Médicos cadastrados ({doctors.length})
    </h1>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <input
          placeholder="Nome"
          value={nameFilter}
          onChange={(e) =>
            setNameFilter(e.target.value.toUpperCase())
          }
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
            flex: 1,
          }}
        />

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <option value="">Especialidade</option>
          {SPECIALTIES.map((s: string) => (
          <option key={s} value={s}>
          {s}
          </option>
         ))}
        </select>
      </div>

      {/* LISTA */}
      <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
        {filtered.map((doc) => (
          <div
            key={doc.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {doc.name}
              </div>

              <div style={{ marginTop: 4 }}>
                {doc.specialty} • {doc.phone}
              </div>

              <div style={{ marginTop: 4 }}>
                {doc.address}
              </div>

              <div style={{ marginTop: 4 }}>
                {doc.city}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(doc.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
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