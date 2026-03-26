"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [msg, setMsg] = useState("Processando convite...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function join() {
      if (!code) { setMsg("Código inválido."); return; }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        router.push(`/login?redirect=/groups/join?code=${code}`);
        return;
      }

      const { data: group, error: groupError } = await supabase
  .from("groups")
  .select("id, name, invite_code")
  .eq("invite_code", code)
  .maybeSingle();

if (groupError) {
  console.log("GROUP FETCH ERROR:", groupError);
  setMsg(`Grupo não encontrado: ${groupError.message}`);
  return;
}

if (!group) {
  setMsg("Grupo não encontrado.");
  return;
}

      const { data: existing } = await supabase
  .from("group_members")
  .select("id")
  .eq("group_id", group.id)
  .eq("user_id", user.id)
  .single();

if (!existing) {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

 if (error) {
  console.log("JOIN GROUP ERROR:", error);
  setMsg(`Erro ao entrar no grupo: ${error.message}`);
  return; }
}

      setMsg(`Você entrou no grupo "${group.name}" ✅`);
      setDone(true);
      setTimeout(() => router.push(`/groups/${group.id}`), 1500);
    }
    join();
  }, [code]);

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 32,
      maxWidth: 400, width: "100%", textAlign: "center",
      boxShadow: "0 4px 16px rgba(13,17,23,0.10)",
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800, fontSize: 20, color: "#0D1117", marginBottom: 16,
      }}>EscalaMed</div>
      <div style={{
        fontSize: 14, color: done ? "#1A6B4A" : "#8A9BB0", fontWeight: 600,
      }}>{msg}</div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <main style={{
      minHeight: "100vh", background: "#F5F3EE",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <Suspense fallback={
        <div style={{ fontSize: 13, color: "#8A9BB0" }}>Carregando...</div>
      }>
        <JoinGroupContent />
      </Suspense>
    </main>
  );
}