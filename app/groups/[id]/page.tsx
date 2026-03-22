"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Member = {
  user_id: string;
  name?: string;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  city: string | null;
  uf: string | null;
  tenant_id: string;
};

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;

  const [groupName, setGroupName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [qName, setQName] = useState("");
  const [qMember, setQMember] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  const inputStyle = {
    padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid rgba(13,17,23,0.10)",
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    background: "#fff", color: "#0D1117", outline: "none", width: "100%",
  };

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { router.push("/login"); return; }
      setCurrentUserId(user.id);

      const { data: group } = await supabase
        .from("groups")
        .select("name, owner_id")
        .eq("id", groupId)
        .single();

      setGroupName(group?.name ?? "");
      setIsOwner(group?.owner_id === user.id);

      const { data: memberRows } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      const memberIds = (memberRows ?? []).map((r: any) => r.user_id);

      if (memberIds.length === 0) { setLoading(false); return; }

      const { data: memberProfiles } = await supabase
        .rpc("get_users_names", { user_ids: memberIds });

      const memberList: Member[] = memberIds.map((id: string) => ({
        user_id: id,
        name: memberProfiles?.find((p: any) => p.id === id)?.name ?? id.slice(0, 8) + "...",
      }));
      setMembers(memberList);

      const { data: doctorRows } = await supabase
        .from("doctors")
        .select("*")
        .in("tenant_id", memberIds);

      const allDoctors = (doctorRows ?? []) as Doctor[];
      setDoctors(allDoctors);
      setFiltered(allDoctors);
      setLoading(false);
    }
    load();
  }, [groupId]);

  useEffect(() => {
    let result = doctors;
    if (qName) result = result.filter((d) => (d.name || "").toUpperCase().includes(qName.toUpperCase()));
    if (qMember) result = result.filter((d) => d.tenant_id === qMember);
    setFiltered(result);
  }, [qName, qMember, doctors]);

  async function leaveGroup() {
    if (!confirm("Tem certeza que deseja sair do grupo?")) return;
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", currentUserId);

    if (error) {
      setMsg("Erro ao sair do grupo.");
      setMsgType("error");
      return;
    }
    router.push("/groups");
  }

  async function deleteGroup() {
    if (!confirm("Tem certeza que deseja EXCLUIR o grupo? Essa ação não pode ser desfeita.")) return;

    // Remove todos os membros primeiro
    await supabase.from("group_members").delete().eq("group_id", groupId);

    // Remove o grupo
    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) {
      setMsg("Erro ao excluir grupo.");
      setMsgType("error");
      return;
    }
    router.push("/groups");
  }

  return (
    <main style={{
      minHeight: "100vh", background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 720, margin: "0 auto", padding: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 22, color: "#0D1117",
          }}>{groupName || "Grupo"}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A9BB0" }}>
            {doctors.length} médicos · {members.length} membros
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/groups")}
            style={{
              background: "rgba(13,17,23,0.06)", color: "#0D1117",
              padding: "8px 14px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 12,
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
            }}
          >← Grupos</button>

          {isOwner ? (
            <button
              type="button"
              onClick={deleteGroup}
              style={{
                background: "#FFF0EE", color: "#C0392B",
                padding: "8px 14px", borderRadius: 8,
                border: "1.5px solid rgba(192,57,43,0.20)",
                cursor: "pointer", fontSize: 12,
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
              }}
            >Excluir grupo</button>
          ) : (
            <button
              type="button"
              onClick={leaveGroup}
              style={{
                background: "rgba(13,17,23,0.06)", color: "#0D1117",
                padding: "8px 14px", borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 12,
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
              }}
            >Sair do grupo</button>
          )}
        </div>
      </div>

      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: msgType === "error" ? "#FFF0EE" : "rgba(26,107,74,0.10)",
          color: msgType === "error" ? "#C0392B" : "#1A6B4A",
          fontWeight: 600, fontSize: 13,
          border: `1.5px solid ${msgType === "error" ? "rgba(192,57,43,0.20)" : "rgba(26,107,74,0.20)"}`,
        }}>{msg}</div>
      )}

      {/* Filtros */}
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Buscar por nome do médico"
          value={qName}
          onChange={(e) => setQName(e.target.value)}
          style={inputStyle}
        />
        <select
          value={qMember}
          onChange={(e) => setQMember(e.target.value)}
          style={{ ...inputStyle, color: qMember ? "#0D1117" : "#8A9BB0" }}
        >
          <option value="">Filtrar por propagandista</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name ?? m.user_id.slice(0, 8) + "..."}
            </option>
          ))}
        </select>
      </div>

      {loading && <div style={{ fontSize: 13, color: "#8A9BB0" }}>Carregando...</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((d) => (
          <div key={d.id} style={{
            background: "#fff",
            border: "1px solid rgba(13,17,23,0.08)",
            borderLeft: "3px solid #1A6B4A",
            borderRadius: 14, padding: 16,
            boxShadow: "0 1px 4px rgba(13,17,23,0.06)",
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: 13, color: "#0D1117", marginBottom: 4,
            }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "#8A9BB0" }}>
              {d.specialty} · {d.phone}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>
              {[d.city, d.uf].filter(Boolean).map((tag) => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "3px 8px", borderRadius: 100,
                  background: "#F5F3EE", color: "#4A5568",
                }}>{tag}</span>
              ))}
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: "3px 8px", borderRadius: 100,
                background: "rgba(26,107,74,0.10)", color: "#1A6B4A",
              }}>
                {members.find((m) => m.user_id === d.tenant_id)?.name ?? "—"}
              </span>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{
            padding: "16px", borderRadius: 10,
            background: "#FFF3DC", border: "1.5px solid rgba(212,130,10,0.25)",
            fontSize: 13, color: "#7A4A00",
          }}>Nenhum médico encontrado.</div>
        )}
      </div>
    </main>
  );
}