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

  // ✅ Filtros
  const [filterUF, setFilterUF] = useState("");
  const [filterCity, setFilterCity] = useState("");

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

  // ✅ Excluir solicitação
  async function deleteRequest(id: string) {
    const ok = confirm("Deseja excluir esta solicitação?");
    if (!ok) return;

    await supabase.from("visit_requests").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  // ✅ Listas únicas para os selects
  const ufs = Array.from(new Set(requests.map((r) => r.uf).filter(Boolean))).sort();
  const cities = Array.from(
    new Set(
      requests
        .filter((r) => !filterUF || r.uf === filterUF)
        .map((r) => r.city)
        .filter(Boolean)
    )
  ).sort();

  // ✅ Aplicar filtros
  const filtered = requests.filter((r) => {
    if (filterUF && r.uf !== filterUF) return false;
    if (filterCity && r.city !== filterCity) return false;
    return true;
  });

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

      {/* ✅ Filtros UF e Cidade */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={filterUF}
          onChange={(e) => { setFilterUF(e.target.value); setFilterCity(""); }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(13,17,23,0.12)",
            background: "#fff",
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            color: filterUF ? "#0D1117" : "#8A9BB0",
            cursor: "pointer",
            minWidth: 100,
          }}
        >
          <option value="">Todas as UFs</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(13,17,23,0.12)",
            background: "#fff",
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            color: filterCity ? "#0D1117" : "#8A9BB0",
            cursor: "pointer",
            minWidth: 140,
          }}
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {(filterUF || filterCity) && (
          <button
            type="button"
            onClick={() => { setFilterUF(""); setFilterCity(""); }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(192,57,43,0.20)",
              background: "#FFF0EE",
              color: "#C0392B",
              fontSize: 11,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >LIMPAR</button>
        )}
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "#8A9BB0" }}>Carregando...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: "#FFF3DC",
          border: "1.5px solid rgba(212,130,10,0.25)",
          fontSize: 13,
          color: "#7A4A00",
        }}>Nenhuma solicitação encontrada.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((r) => (
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

            {/* ✅ Botões de ação */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  }}
                >
                  Marcar como contatado
                </button>
              )}

              {/* ✅ Botão excluir */}
              <button
                type="button"
                onClick={() => deleteRequest(r.id)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(192,57,43,0.20)",
                  background: "#FFF0EE",
                  color: "#C0392B",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
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