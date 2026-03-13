"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Request = {
  id: string;
  created_at: string;
  name: string;
  crm: string;
  crm_uf: string;
  phone: string;
  uf: string;
  city: string;
  specialty: string;
  clinic: string;
  slots: string[];
  status: string;
};

export default function VisitRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("visit_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setRequests(data);
      setLoading(false);
    }
    load();
  }, []);

  async function markContacted(id: string) {
    await supabase
      .from("visit_requests")
      .update({ status: "contacted" })
      .eq("id", id);

    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "contacted" } : r)
    );
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#0D1117",
        }}>Médico solicitou visita</h1>
        <button
          type="button"
          onClick={() => router.push("/home")}
          style={{
            backgroundColor: "#1A6B4A",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >Voltar</button>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "#8A9BB0" }}>Carregando...</div>
      )}

      {!loading && requests.length === 0 && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: "#FFF3DC",
          border: "1.5px solid rgba(212,130,10,0.25)",
          fontSize: 13,
          color: "#7A4A00",
        }}>Nenhuma solicitação recebida ainda.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {requests.map((r) => (
          <div key={r.id} style={{
            padding: 16,
            background: "#fff",
            border: "1px solid rgba(13,17,23,0.08)",
            borderLeft: `3px solid ${r.status === "contacted" ? "#8A9BB0" : "#1A6B4A"}`,
            borderRadius: 14,
            boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
            display: "grid",
            gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <strong style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#0D1117",
              }}>{r.name}</strong>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 100,
                background: r.status === "contacted" ? "rgba(13,17,23,0.06)" : "rgba(26,107,74,0.10)",
                color: r.status === "contacted" ? "#8A9BB0" : "#1A6B4A",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.06em",
              }}>
                {r.status === "contacted" ? "CONTATADO" : "PENDENTE"}
              </span>
            </div>

            <div style={{ fontSize: 12, color: "#8A9BB0" }}>
              {r.specialty} · CRM {r.crm}-{r.crm_uf} · {r.phone}
            </div>

            <div style={{ fontSize: 12, color: "#8A9BB0" }}>
              {r.clinic} · {r.city} / {r.uf}
            </div>

            {r.slots?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.slots.map((s) => (
                  <span key={s} style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 100,
                    background: "#F5F3EE", color: "#4A5568",
                  }}>{s}</span>
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: "#C0C8D4" }}>
              {new Date(r.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>

            {r.status !== "contacted" && (
              <button
                type="button"
                onClick={() => markContacted(r.id)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(26,107,74,0.25)",
                  background: "rgba(26,107,74,0.08)",
                  color: "#1A6B4A",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  width: "fit-content",
                }}
              >
                Marcar como contatado
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}