"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Group = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error"|"warning"|null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#FFFFFF",
    color: "#0D1117",
    outline: "none",
    width: "100%",
  };

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      // Grupos que é dono + grupos que é membro
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const groupIds = (memberRows ?? []).map((r: any) => r.group_id);

      const { data: owned } = await supabase
        .from("groups")
        .select("*")
        .eq("owner_id", user.id);

      const { data: member } = groupIds.length > 0
        ? await supabase.from("groups").select("*").in("id", groupIds)
        : { data: [] };

      const all = [...(owned ?? []), ...(member ?? [])];
      const unique = Array.from(new Map(all.map((g) => [g.id, g])).values());
      setGroups(unique);
      setLoading(false);
    }
    load();
  }, []);

  async function createGroup() {
    if (!newName.trim()) {
      setMsg("Digite um nome para o grupo.");
      setMsgType("warning");
      return;
    }

    setCreating(true);
    setMsg(""); setMsgType(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("groups")
      .insert({ name: newName.trim().toUpperCase(), owner_id: user.id })
      .select()
      .single();

    if (error || !data) {
      setMsg("Erro ao criar grupo.");
      setMsgType("error");
      setCreating(false);
      return;
    }

    // Dono entra automaticamente como membro
    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: user.id,
    });

    setGroups((prev) => [data, ...prev]);
    setNewName("");
    setShowCreate(false);
    setMsg("Grupo criado com sucesso ✅");
    setMsgType("success");
    setCreating(false);
  }

  function shareInvite(group: Group) {
    const url = `${window.location.origin}/groups/join?code=${group.invite_code}`;
    if (navigator.share) {
      navigator.share({
        title: `Entre no grupo ${group.name} no EscalaMed`,
        text: `Você foi convidado para o grupo ${group.name}. Clique para entrar:`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      setMsg("Link copiado ✅");
      setMsgType("success");
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>Grupos</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            Veja os médicos dos seus colegas
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            style={{
              background: "#1A6B4A", color: "white",
              padding: "8px 14px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 12,
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              boxShadow: "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >+ Novo grupo</button>
        </div>
      </div>

      {/* Badge Premium */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "rgba(212,130,10,0.12)",
        border: "1px solid rgba(212,130,10,0.30)",
        borderRadius: 100, padding: "5px 14px",
        fontSize: 11, fontWeight: 700, color: "#D4820A",
        letterSpacing: "0.10em", marginBottom: 20,
      }}>⭐ FUNCIONALIDADE PREMIUM</div>

      {/* Criar grupo */}
      {showCreate && (
        <div style={{
          background: "#fff",
          border: "1px solid rgba(13,17,23,0.08)",
          borderRadius: 14, padding: 20,
          marginBottom: 16,
          boxShadow: "0 4px 16px rgba(13,17,23,0.08)",
          display: "grid", gap: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase" as const, color: "#8A9BB0",
          }}>Novo grupo</div>

          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value.toUpperCase())}
            placeholder="Nome do grupo"
            style={inputStyle}
          />

          <button
            type="button"
            onClick={createGroup}
            disabled={creating}
            style={{
              padding: "12px 16px",
              background: creating ? "#8A9BB0" : "#1A6B4A",
              color: "white", borderRadius: 10, border: "none",
              cursor: creating ? "not-allowed" : "pointer",
              fontFamily: "'Syne', sans-serif", fontSize: 12,
              fontWeight: 700, letterSpacing: "0.08em",
              boxShadow: creating ? "none" : "0 4px 16px rgba(26,107,74,0.30)",
            }}
          >{creating ? "Criando..." : "Criar grupo"}</button>
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: msgType === "success" ? "rgba(26,107,74,0.10)" : msgType === "warning" ? "#FFF3DC" : "#FFF0EE",
          color: msgType === "success" ? "#1A6B4A" : msgType === "warning" ? "#7A4A00" : "#C0392B",
          fontWeight: 600, fontSize: 13,
          border: `1.5px solid ${msgType === "success" ? "rgba(26,107,74,0.20)" : msgType === "warning" ? "rgba(212,130,10,0.25)" : "rgba(192,57,43,0.20)"}`,
        }}>{msg}</div>
      )}

      {/* Lista de grupos */}
      {loading && (
        <div style={{ fontSize: 13, color: "#8A9BB0" }}>Carregando...</div>
      )}

      {!loading && groups.length === 0 && (
        <div style={{
          padding: "20px 16px", borderRadius: 14,
          background: "#fff", border: "1px solid rgba(13,17,23,0.08)",
          textAlign: "center", color: "#8A9BB0", fontSize: 13,
        }}>
          Você ainda não tem grupos.<br/>
          <span style={{ color: "#1A6B4A", fontWeight: 700, cursor: "pointer" }}
            onClick={() => setShowCreate(true)}>Criar o primeiro grupo →</span>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {groups.map((g) => (
          <div key={g.id} style={{
            background: "#fff",
            border: "1px solid rgba(13,17,23,0.08)",
            borderLeft: "3px solid #1A6B4A",
            borderRadius: 14, padding: 16,
            boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: 14, color: "#0D1117",
              }}>{g.name}</div>
              <div style={{ fontSize: 11, color: "#8A9BB0" }}>
                Código: <span style={{ fontWeight: 700, color: "#4A5568" }}>{g.invite_code}</span>
                {g.owner_id === userId && (
                  <span style={{
                    marginLeft: 8, fontSize: 9, fontWeight: 800,
                    padding: "2px 8px", borderRadius: 100,
                    background: "rgba(26,107,74,0.10)", color: "#1A6B4A",
                  }}>DONO</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => shareInvite(g)}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: "1.5px solid rgba(26,107,74,0.25)",
                  background: "rgba(26,107,74,0.08)", color: "#1A6B4A",
                  fontFamily: "'Syne', sans-serif", fontSize: 11,
                  fontWeight: 700, cursor: "pointer",
                }}
              >Convidar</button>
              <button
                type="button"
                onClick={() => router.push(`/groups/${g.id}`)}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: "1.5px solid rgba(13,17,23,0.12)",
                  background: "#fff", color: "#0D1117",
                  fontFamily: "'Syne', sans-serif", fontSize: 11,
                  fontWeight: 700, cursor: "pointer",
                }}
              >Ver grupo</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}