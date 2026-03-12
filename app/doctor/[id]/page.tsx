"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

type Doctor = {
  doctor_key: string;
  name: string | null;
  specialty: string | null;
  phone: string | null;
  clinic: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
};

export default function DoctorPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function loadDoctor() {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("doctors_directory")
        .select("doctor_key,name,specialty,phone,clinic,address,city,uf")
        .eq("doctor_key", id)
        .single();

      setData((data as Doctor) ?? null);
      setError(error);
      setLoading(false);
    }

    loadDoctor();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#F5F3EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: "#8A9BB0",
      }}>
        Carregando...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#F5F3EE",
        fontFamily: "'DM Sans', sans-serif",
        padding: 40,
      }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#0D1117",
          marginBottom: 8,
        }}>Ficha do Médico</h1>
        <p style={{ fontSize: 13, color: "#8A9BB0" }}>ID: {id}</p>
        <p style={{
          marginTop: 12,
          padding: "12px 16px",
          background: "#FFF3DC",
          border: "1.5px solid rgba(212,130,10,0.25)",
          borderRadius: 10,
          fontSize: 13,
          color: "#7A4A00",
        }}>Não encontrado no banco.</p>
      </div>
    );
  }

  const d = data;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        background: "#fff",
        border: "1px solid rgba(13,17,23,0.10)",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 4px 16px rgba(13,17,23,0.08)",
        borderLeft: "4px solid #1A6B4A",
      }}>

        {/* Avatar + Nome */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: "rgba(26,107,74,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700, fontSize: 18,
            color: "#1A6B4A",
            flexShrink: 0,
          }}>
            {(d.name ?? "?")[0]}
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "#0D1117",
              lineHeight: 1.3,
            }}>
              {(d.name ?? "").toUpperCase()}
            </h1>
            <div style={{ fontSize: 12, color: "#8A9BB0", marginTop: 3 }}>
              {(d.specialty ?? "-").toUpperCase()}
              {d.phone ? ` · ${d.phone}` : ""}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(13,17,23,0.07)", marginBottom: 20 }} />

        {/* Detalhes */}
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { label: "Clínica", value: d.clinic ?? "-" },
            { label: "Endereço", value: d.address ?? "-" },
            { label: "Cidade / UF", value: `${(d.city ?? "-").toUpperCase()} / ${(d.uf ?? "-").toUpperCase()}` },
          ].map((row) => (
            <div key={row.label}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#8A9BB0",
                marginBottom: 3,
              }}>{row.label}</div>
              <div style={{ fontSize: 13, color: "#0D1117" }}>{row.value}</div>
            </div>
          ))}
        </div>

        {/* ID */}
        <div style={{ marginTop: 24, fontSize: 11, color: "#C0C8D4" }}>
          ID: {d.doctor_key}
        </div>
      </div>
    </div>
  );
}