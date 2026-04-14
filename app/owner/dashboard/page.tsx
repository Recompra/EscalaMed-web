"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";


type Period = "7d" | "30d" | "90d";
type Tab = "overview" | "partners" | "analytics" | "ai" | "subscriptions";
type SubRow = { id: string; user_id: string; plan: string | null; status: string | null; start_date: string | null; end_date: string | null; mp_subscription_id: string | null; email: string | null };
type AiUserRow = { user_id: string; total: number; email: string | null };

type Counts = {
  users: number; premiumUsers: number; doctors: number; directory: number;
  userDoctors: number; groups: number; feedback: number; visits: number;
};
type ProfileRow  = { id: string; user_id: string; email: string | null; plan: string | null; role: string | null; created_at: string };
type ExpiringRow = { user_id: string; plan: string | null; end_date: string; email: string | null };
type MrrPoint    = { month: string; mrr: number };
type DoctorRow   = { id?: string; name: string | null; city: string | null; uf: string | null; specialty?: string | null; created_at: string };
type FeedbackRow = { id: string; user_name: string | null; user_email: string | null; tipo: string | null; mensagem: string | null; created_at: string };
type VisitRow    = { id: string; name: string | null; city: string | null; uf: string | null; specialty: string | null; status: string | null; created_at: string };
type SparkPoint  = { day: string; value: number };
type PartnerRow  = { id: string; name: string; email: string | null; commission_pct: number };
type CouponUse   = { id: string; code: string; partner_id: string | null; user_id: string | null; plan: string | null; value_brl: number | null; created_at: string };
type NavLog      = { tab_name: string; count: number };
type AIRow       = { id: string; question: string | null; created_at: string };
type UfRow       = { uf: string | null; count: number };

function timeAgo(d?: string | null) {
  if (!d) return "-";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return mins + "m atras";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h atras";
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + "d atras";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmt(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function periodDays(p: Period) {
  return p === "7d" ? 7 : p === "30d" ? 30 : 90;
}

function buildSparkData(rows: { created_at: string }[], days: number): SparkPoint[] {
  const counts: Record<string, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * 86400000).toISOString().slice(0, 10);
    counts[key] = 0;
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    if (key in counts) counts[key]++;
  }
  return Object.entries(counts).map(([day, value]) => ({ day, value }));
}

function exportCSV(data: CouponUse[], partners: PartnerRow[]) {
  const partnerMap: Record<string, string> = {};
  for (const p of partners) partnerMap[p.id] = p.name;
  const header = "ID,Codigo,Parceiro,Plano,Valor (R$),Data";
  const rows = data.map((r) =>
    [r.id, r.code, r.partner_id ? (partnerMap[r.partner_id] ?? r.partner_id) : "-",
     r.plan ?? "-", r.value_brl ?? 0, fmt(r.created_at)].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "cupons-escalamed.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportPartnerReport(couponUses: CouponUse[], partners: PartnerRow[]) {
  const partnerMap: Record<string, string> = {};
  const commissionMap: Record<string, number> = {};
  for (const p of partners) { partnerMap[p.id] = p.name; commissionMap[p.id] = p.commission_pct; }

  const grouped: Record<string, { uses: number; revenue: number; commission: number }> = {};
  for (const u of couponUses) {
    const pid = u.partner_id ?? "sem-parceiro";
    if (!grouped[pid]) grouped[pid] = { uses: 0, revenue: 0, commission: 0 };
    grouped[pid].uses++;
    grouped[pid].revenue += u.value_brl ?? 0;
    const pct = pid !== "sem-parceiro" ? (commissionMap[pid] ?? 10) : 0;
    grouped[pid].commission += ((u.value_brl ?? 0) * pct) / 100;
  }

  const header = "Parceiro,Conversoes,Receita Total (R$),Comissao (R$)";
  const rows = Object.entries(grouped).map(([pid, d]) =>
    [(partnerMap[pid] ?? "Sem parceiro"), d.uses,
     d.revenue.toFixed(2), d.commission.toFixed(2)].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = "relatorio-parceiros-escalamed.csv"; a.click();
  URL.revokeObjectURL(url);
}

function Sparkline({ data, color }: { data: SparkPoint[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 80; const h = 32;
  const pts = data.map((d, i) => (i / (data.length - 1)) * w + "," + (h - (d.value / max) * h));
  const area = "M" + pts[0] + " L" + pts.join(" L") + " L" + w + "," + h + " L0," + h + " Z";
  const id = "g" + color.replace("#", "");
  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#" + id + ")"} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [period, setPeriod]     = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const [counts, setCounts]               = useState<Counts>({ users:0, premiumUsers:0, doctors:0, directory:0, userDoctors:0, groups:0, feedback:0, visits:0 });
  const [recentUsers, setRecentUsers]     = useState<ProfileRow[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<DoctorRow[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRow[]>([]);
  const [recentVisits, setRecentVisits]   = useState<VisitRow[]>([]);
  const [newPeriod, setNewPeriod]         = useState({ users:0, doctors:0, visits:0, feedback:0 });
  const [visitStatus, setVisitStatus]     = useState({ pending:0, approved:0, rejected:0 });
  const [sparkUsers, setSparkUsers]       = useState<SparkPoint[]>([]);
  const [sparkDoctors, setSparkDoctors]   = useState<SparkPoint[]>([]);
  const [sparkVisits, setSparkVisits]     = useState<SparkPoint[]>([]);
  const [sparkFeedback, setSparkFeedback] = useState<SparkPoint[]>([]);

  const [partners, setPartners]           = useState<PartnerRow[]>([]);
  const [couponUses, setCouponUses]       = useState<CouponUse[]>([]);
  const [navLogs, setNavLogs]             = useState<NavLog[]>([]);
  const [aiQuestions, setAiQuestions]     = useState<AIRow[]>([]);
  const [ufRanking, setUfRanking]         = useState<UfRow[]>([]);
  const [expiringRows, setExpiringRows]   = useState<ExpiringRow[]>([]);
  const [mrrData, setMrrData]             = useState<MrrPoint[]>([]);
  const [allSubs, setAllSubs]             = useState<SubRow[]>([]);
  const [aiUserRanking, setAiUserRanking] = useState<AiUserRow[]>([]);
  const [userGrowth, setUserGrowth]       = useState<MrrPoint[]>([]);

  const loadDashboard = useCallback(async (p: Period = period, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setErrorMsg("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push("/login"); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      if (profileError) { setErrorMsg("Erro ao validar acesso."); return; }
      
      const allowedEmails = [
      "jr.antoniojrr@gmail.com",
      "flavinha.q3@hotmail.com"
      ];

      const userEmail = (user.email || "").toLowerCase();

      if (!allowedEmails.includes(userEmail)) {
      router.push("/");
     return;
}

      const days = periodDays(p);
      const periodAgo = new Date(); periodAgo.setDate(periodAgo.getDate() - days);
      const isoPeriod = periodAgo.toISOString();

      const [
        profilesRes, premiumRes, doctorsRes, directoryRes, userDoctorsRes,
        groupsRes, feedbackRes, visitsRes, recentUsersRes, recentDoctorsRes,
        recentFeedbackRes, recentVisitsRes, periodUsersRes, periodDoctorsRes,
        periodVisitsRes, periodFeedbackRes, pendingRes, approvedRes, rejectedRes,
        sparkUsersRes, sparkDoctorsRes, sparkVisitsRes, sparkFeedbackRes,
        partnersRes, couponUsesRes, navLogsRes, aiRes, expiringSubs, couponMrrRes, allSubsRes, aiUsersRes, allProfilesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "premium"),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("doctors_directory").select("*", { count: "exact", head: true }),
        supabase.from("user_doctors").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("id,user_id,email,plan,role,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("doctors").select("id,name,city,uf,specialty,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("feedback").select("id,user_name,user_email,tipo,mensagem,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("visit_requests").select("id,name,city,uf,specialty,status,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", isoPeriod),
        supabase.from("doctors").select("*", { count: "exact", head: true }).gte("created_at", isoPeriod),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }).gte("created_at", isoPeriod),
        supabase.from("feedback").select("*", { count: "exact", head: true }).gte("created_at", isoPeriod),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }).in("status", ["pendente", "pending"]),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }).in("status", ["aprovado", "approved"]),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }).in("status", ["recusado", "rejected"]),
        supabase.from("profiles").select("created_at").gte("created_at", isoPeriod),
        supabase.from("doctors").select("created_at").gte("created_at", isoPeriod),
        supabase.from("visit_requests").select("created_at").gte("created_at", isoPeriod),
        supabase.from("feedback").select("created_at").gte("created_at", isoPeriod),
        supabase.from("partners").select("id,name,email,commission_pct").eq("active", true),
        supabase.from("coupon_uses").select("id,code,partner_id,user_id,plan,value_brl,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("navigation_logs").select("tab_name").gte("created_at", isoPeriod),
        supabase.from("ai_conversations").select("id,question,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("subscriptions").select("user_id,plan,end_date").eq("status", "active").lte("end_date", new Date(Date.now() + 15 * 86400000).toISOString()),
        supabase.from("coupon_uses").select("value_brl,plan,created_at").order("created_at", { ascending: true }),
        supabase.from("subscriptions").select("id,user_id,plan,status,start_date,end_date,mp_subscription_id").order("start_date", { ascending: false }).limit(200),
        supabase.from("ai_conversations").select("user_id,created_at").not("user_id", "is", null),
        supabase.from("profiles").select("user_id,created_at"),
      ]);

      setCounts({ users: profilesRes.count??0, premiumUsers: premiumRes.count??0, doctors: doctorsRes.count??0, directory: directoryRes.count??0, userDoctors: userDoctorsRes.count??0, groups: groupsRes.count??0, feedback: feedbackRes.count??0, visits: visitsRes.count??0 });
      setRecentUsers((recentUsersRes.data as ProfileRow[]) ?? []);
      setRecentDoctors((recentDoctorsRes.data as DoctorRow[]) ?? []);
      setRecentFeedback((recentFeedbackRes.data as FeedbackRow[]) ?? []);
      setRecentVisits((recentVisitsRes.data as VisitRow[]) ?? []);
      setNewPeriod({ users: periodUsersRes.count??0, doctors: periodDoctorsRes.count??0, visits: periodVisitsRes.count??0, feedback: periodFeedbackRes.count??0 });
      setVisitStatus({ pending: pendingRes.count??0, approved: approvedRes.count??0, rejected: rejectedRes.count??0 });
      setSparkUsers(buildSparkData(sparkUsersRes.data??[], days));
      setSparkDoctors(buildSparkData(sparkDoctorsRes.data??[], days));
      setSparkVisits(buildSparkData(sparkVisitsRes.data??[], days));
      setSparkFeedback(buildSparkData(sparkFeedbackRes.data??[], days));
      setPartners((partnersRes.data as PartnerRow[]) ?? []);
      setCouponUses((couponUsesRes.data as CouponUse[]) ?? []);

      const navRaw = (navLogsRes.data ?? []) as { tab_name: string }[];
      const navCount: Record<string, number> = {};
      for (const n of navRaw) navCount[n.tab_name] = (navCount[n.tab_name] ?? 0) + 1;
      setNavLogs(Object.entries(navCount).sort((a, b) => b[1] - a[1]).map(([tab_name, count]) => ({ tab_name, count })));

      setAiQuestions((aiRes.data as AIRow[]) ?? []);

      // ── ADIÇÃO 1: assinaturas vencendo ───────────────────────────────
      const expiringRaw = (expiringSubs.data ?? []) as { user_id: string; plan: string | null; end_date: string }[];
      if (expiringRaw.length > 0) {
        const expUserIds = expiringRaw.map((r) => r.user_id);
        const { data: expProfiles } = await supabase.from("profiles").select("user_id,email").in("user_id", expUserIds);
        const emailMap: Record<string, string> = {};
        for (const p of (expProfiles ?? []) as { user_id: string; email: string | null }[]) {
          if (p.email) emailMap[p.user_id] = p.email;
        }
        setExpiringRows(expiringRaw.map((r) => ({ ...r, email: emailMap[r.user_id] ?? null })));
      } else {
        setExpiringRows([]);
      }

      // ── ADIÇÃO 2: MRR mensal ─────────────────────────────────────────
      const PLAN_PRICE: Record<string, number> = { mensal: 29.90, semestral: 131.90 / 6, anual: 239.90 / 12 };
      const mrrRaw = (couponMrrRes.data ?? []) as { value_brl: number | null; plan: string | null; created_at: string }[];
      const mrrMap: Record<string, number> = {};
      const now6 = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now6.getFullYear(), now6.getMonth() - i, 1);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        mrrMap[key] = 0;
      }
      for (const r of mrrRaw) {
        const key = r.created_at.slice(0, 7);
        if (key in mrrMap) {
          const val = r.value_brl ?? (r.plan ? PLAN_PRICE[r.plan] ?? 0 : 0);
          mrrMap[key] += val;
        }
      }
      setMrrData(Object.entries(mrrMap).map(([month, mrr]) => ({ month, mrr: parseFloat(mrr.toFixed(2)) })));

      // ── MELHORIA 1: todas as assinaturas com email ───────────────────
      const subsRaw = (allSubsRes.data ?? []) as Omit<SubRow, "email">[];
      if (subsRaw.length > 0) {
        const subUserIds = [...new Set(subsRaw.map((r) => r.user_id))];
        const { data: subProfiles } = await supabase.from("profiles").select("user_id,email").in("user_id", subUserIds);
        const subEmailMap: Record<string, string> = {};
        for (const p of (subProfiles ?? []) as { user_id: string; email: string | null }[]) {
          if (p.email) subEmailMap[p.user_id] = p.email;
        }
        setAllSubs(subsRaw.map((r) => ({ ...r, email: subEmailMap[r.user_id] ?? null })));
      } else {
        setAllSubs([]);
      }

      // ── MELHORIA 2: ranking de usuários mais ativos na IA ────────────
      const aiUsersRaw = (aiUsersRes.data ?? []) as { user_id: string }[];
      const aiCount: Record<string, number> = {};
      for (const r of aiUsersRaw) aiCount[r.user_id] = (aiCount[r.user_id] ?? 0) + 1;
      const topAiUsers = Object.entries(aiCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (topAiUsers.length > 0) {
        const aiUserIds = topAiUsers.map(([uid]) => uid);
        const { data: aiProfiles } = await supabase.from("profiles").select("user_id,email").in("user_id", aiUserIds);
        const aiEmailMap: Record<string, string> = {};
        for (const p of (aiProfiles ?? []) as { user_id: string; email: string | null }[]) {
          if (p.email) aiEmailMap[p.user_id] = p.email;
        }
        setAiUserRanking(topAiUsers.map(([uid, total]) => ({ user_id: uid, total, email: aiEmailMap[uid] ?? null })));
      } else {
        setAiUserRanking([]);
      }

      // ── MELHORIA 4: crescimento de usuários por mês ──────────────────
      const allProfilesRaw = (allProfilesRes.data ?? []) as { created_at: string }[];
      const growthMap: Record<string, number> = {};
      const now6g = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now6g.getFullYear(), now6g.getMonth() - i, 1);
        const gKey = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        growthMap[gKey] = 0;
      }
      for (const r of allProfilesRaw) {
        const key = r.created_at.slice(0, 7);
        if (key in growthMap) growthMap[key]++;
      }
      setUserGrowth(Object.entries(growthMap).map(([month, mrr]) => ({ month, mrr })));

      const { data: ufData } = await supabase.from("profiles").select("uf").not("uf", "is", null);
      const ufCount: Record<string, number> = {};
      for (const r of (ufData ?? []) as { uf: string | null }[]) {
        if (r.uf) ufCount[r.uf] = (ufCount[r.uf] ?? 0) + 1;
      }
      setUfRanking(Object.entries(ufCount).sort((a, b) => b[1] - a[1]).map(([uf, count]) => ({ uf, count })));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar dashboard.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [period, router]);

  useEffect(() => { loadDashboard("30d"); }, []);

  function handlePeriod(p: Period) { setPeriod(p); loadDashboard(p, true); }

  const adoptionRate = useMemo(() => !counts.doctors ? 0 : Math.round((counts.userDoctors / counts.doctors) * 100), [counts]);
  const premiumRate  = useMemo(() => !counts.users   ? 0 : Math.round((counts.premiumUsers / counts.users) * 100), [counts]);
  const totalVisits  = visitStatus.pending + visitStatus.approved + visitStatus.rejected;

  const partnerStats = useMemo(() => {
    const map: Record<string, { name: string; uses: number; revenue: number; commission: number; commission_pct: number }> = {};
    const partnerMap: Record<string, PartnerRow> = {};
    for (const p of partners) partnerMap[p.id] = p;
    for (const u of couponUses) {
      const pid = u.partner_id ?? "none";
      const pName = u.partner_id ? (partnerMap[u.partner_id]?.name ?? "Desconhecido") : "Sem parceiro";
      const pct   = u.partner_id ? (partnerMap[u.partner_id]?.commission_pct ?? 10) : 0;
      if (!map[pid]) map[pid] = { name: pName, uses: 0, revenue: 0, commission: 0, commission_pct: pct };
      map[pid].uses++;
      map[pid].revenue    += u.value_brl ?? 0;
      map[pid].commission += ((u.value_brl ?? 0) * pct) / 100;
    }
    return Object.values(map).sort((a, b) => b.uses - a.uses);
  }, [couponUses, partners]);

  const totalRevenue    = partnerStats.reduce((s, p) => s + p.revenue, 0);
  const totalCommission = partnerStats.reduce((s, p) => s + p.commission, 0);
  const maxNavCount     = navLogs[0]?.count ?? 1;
  const maxUfCount      = ufRanking[0]?.count ?? 1;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",       label: "Visao geral" },
    { id: "partners",       label: "Parceiros e cupons" },
    { id: "analytics",      label: "Uso e UF" },
    { id: "ai",             label: "Perguntas IA" },
    { id: "subscriptions",  label: "Assinaturas" },
  ];

  if (loading) {
    return (
      <main style={D.page}>
        <style>{kf}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
          <div style={D.spinner} />
          <span style={{ color: "#6B7280", fontSize: 14 }}>Carregando dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main style={D.page}>
      <style>{kf}</style>
      <div style={D.wrap}>

        {/* HEADER */}
        <header style={D.header}>
          <div style={D.headerInner}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={D.badge}><span style={D.dot} />OWNER</span>
                {refreshing && <span style={{ fontSize: 12, color: "#6B7280" }}>Atualizando...</span>}
              </div>
              <h1 style={D.title}>EscalaMed Dashboard</h1>
              <p style={D.subtitle}>Visao interna de produto, adocao e operacao</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={D.periodBar}>
                {(["7d","30d","90d"] as Period[]).map((p) => (
                  <button key={p} type="button" onClick={() => handlePeriod(p)}
                    style={{ ...D.periodBtn, ...(period === p ? D.periodBtnActive : {}) }}>{p}</button>
                ))}
              </div>
              <button type="button" onClick={() => loadDashboard(period, true)} style={D.btnGhost}>Atualizar</button>
              <button type="button" onClick={() => router.push("/home")} style={D.btnPrimary}>Voltar</button>
            </div>
          </div>

          {/* TAB BAR */}
          <div style={{ display: "flex", gap: 4, marginTop: 20, borderTop: "1px solid #1F2937", paddingTop: 16, flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                style={{ ...D.tabBtn, ...(activeTab === t.id ? D.tabBtnActive : {}) }}>{t.label}</button>
            ))}
          </div>
        </header>

        {errorMsg && <div style={D.error}>{errorMsg}</div>}

        {/* ── TAB: OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* ADIÇÃO 1 — Alerta assinaturas vencendo */}
            {expiringRows.length > 0 && (
              <section style={{ background:"#1C0A0A", border:"1px solid #7F1D1D", borderLeft:"4px solid #EF4444", borderRadius:14, padding:"18px 22px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:16 }}>⚠️</span>
                  <span style={{ fontWeight:800, color:"#FCA5A5", fontSize:14 }}>
                    {expiringRows.length} assinatura{expiringRows.length > 1 ? "s" : ""} vencendo nos próximos 15 dias
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {expiringRows.map((r) => (
                    <div key={r.user_id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:10, padding:"10px 14px", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#F9FAFB" }}>{r.email ?? r.user_id.slice(0,20)+"..."}</div>
                        <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>Plano: {r.plan ?? "-"}</div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#FCA5A5" }}>
                        Vence em {new Date(r.end_date).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={D.kpiGrid}>
              <KpiCard label="Usuarios"     value={counts.users}       delta={newPeriod.users}    period={period} color="#3B82F6" spark={<Sparkline data={sparkUsers}   color="#3B82F6" />} />
              <KpiCard label="Premium"      value={counts.premiumUsers} badge={premiumRate+"%"}   badgeLabel="conversao"  color="#8B5CF6" accent spark={<Sparkline data={sparkUsers}   color="#8B5CF6" />} />
              <KpiCard label="Medicos"      value={counts.doctors}      delta={newPeriod.doctors}  period={period} color="#10B981" spark={<Sparkline data={sparkDoctors} color="#10B981" />} />
              <KpiCard label="Diretorio"    value={counts.directory}    color="#F59E0B" spark={<Sparkline data={sparkDoctors} color="#F59E0B" />} />
              <KpiCard label="Vinculos"     value={counts.userDoctors}  badge={adoptionRate+"%"}  badgeLabel="adocao"     color="#EC4899" spark={<Sparkline data={sparkUsers}   color="#EC4899" />} />
              <KpiCard label="Grupos"       value={counts.groups}       color="#6366F1" spark={<Sparkline data={sparkUsers}   color="#6366F1" />} />
              <KpiCard label="Feedbacks"    value={counts.feedback}     delta={newPeriod.feedback} period={period} color="#14B8A6" spark={<Sparkline data={sparkFeedback} color="#14B8A6" />} />
              <KpiCard label="Solicitacoes" value={counts.visits}       delta={newPeriod.visits}   period={period} color="#F97316" spark={<Sparkline data={sparkVisits}  color="#F97316" />} />
            </section>

            <section style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ ...D.card, flex: "0 1 280px", padding: 24 }}>
                <SectionHeader title="Status das visitas" sub="Em tempo real" />
                {[{ label:"Pendentes", value:visitStatus.pending, color:"#F59E0B" },
                  { label:"Aprovadas", value:visitStatus.approved, color:"#10B981" },
                  { label:"Recusadas", value:visitStatus.rejected, color:"#EF4444" }].map((s) => {
                  const pct = totalVisits ? Math.round((s.value / totalVisits) * 100) : 0;
                  return (
                    <div key={s.label} style={{ marginBottom: 14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:13, color:"#9CA3AF" }}>{s.label}</span>
                        <div style={{ display:"flex", gap:8, alignItems:"baseline" }}>
                          <span style={{ fontSize:18, fontWeight:800, color:"#F9FAFB" }}>{s.value}</span>
                          <span style={{ fontSize:11, color:"#4B5563" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:6, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:pct+"%", background:s.color, borderRadius:999, transition:"width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop:"1px solid #1F2937", paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"#4B5563" }}>Total</span>
                  <span style={{ fontSize:14, fontWeight:800, color:"#F9FAFB" }}>{totalVisits}</span>
                </div>
              </div>

              {/* MELHORIA 3 — Breakdown feedbacks por tipo */}
              <div style={{ ...D.card, flex:"0 1 260px", padding:24 }}>
                <SectionHeader title="Feedbacks por tipo" sub="Distribuição" />
                {(() => {
                  const tipoMap: Record<string, number> = {};
                  for (const f of recentFeedback) {
                    const t = (f.tipo ?? "outro").toLowerCase();
                    tipoMap[t] = (tipoMap[t] ?? 0) + 1;
                  }
                  const tipoColors: Record<string, string> = { bug:"#EF4444", sugestão:"#10B981", sugestao:"#10B981", dúvida:"#3B82F6", duvida:"#3B82F6", outro:"#6B7280" };
                  const total = Object.values(tipoMap).reduce((s, v) => s + v, 0) || 1;
                  const entries = Object.entries(tipoMap).sort((a, b) => b[1] - a[1]);
                  if (entries.length === 0) return <EmptyRow />;
                  return entries.map(([tipo, count]) => {
                    const color = tipoColors[tipo] ?? "#6B7280";
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={tipo} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} />
                            <span style={{ fontSize:13, color:"#9CA3AF", textTransform:"capitalize" }}>{tipo}</span>
                          </div>
                          <div style={{ display:"flex", gap:8, alignItems:"baseline" }}>
                            <span style={{ fontSize:18, fontWeight:800, color:"#F9FAFB" }}>{count}</span>
                            <span style={{ fontSize:11, color:"#4B5563" }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ height:6, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:pct+"%", background:color, borderRadius:999, transition:"width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div style={{ ...D.card, flex:"1 1 360px", padding:24 }}>
                <SectionHeader title="Saude do produto" sub="Indicadores de adocao" />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
                  <HealthTile label="Conversao premium" value={premiumRate+"%"}  desc="Usuarios premium"      fill={premiumRate}  color="#8B5CF6" />
                  <HealthTile label="Adocao medicos"    value={adoptionRate+"%"} desc="Vinculos sobre base"   fill={adoptionRate} color="#10B981" />
                  <HealthTile label="Base diretorio"    value={counts.directory.toLocaleString("pt-BR")} desc="Medicos pesquisaveis" fill={Math.min(100,Math.round(counts.directory/10))} color="#F59E0B" />
                  <HealthTile label="Interacoes"        value={(counts.feedback+counts.visits).toLocaleString("pt-BR")} desc="Feedbacks+solicitacoes" fill={Math.min(100,counts.feedback+counts.visits)} color="#3B82F6" />
                </div>
              </div>

              <div style={{ ...D.card, flex:"0 1 240px", padding:24 }}>
                <SectionHeader title={"Novos em "+period} sub="Por categoria" />
                {[{ label:"Usuarios", value:newPeriod.users, color:"#3B82F6" },
                  { label:"Medicos",  value:newPeriod.doctors, color:"#10B981" },
                  { label:"Visitas",  value:newPeriod.visits, color:"#F97316" },
                  { label:"Feedbacks",value:newPeriod.feedback, color:"#14B8A6" }].map((item) => {
                  const max = Math.max(newPeriod.users, newPeriod.doctors, newPeriod.visits, newPeriod.feedback, 1);
                  return (
                    <div key={item.label} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, color:"#6B7280" }}>{item.label}</span>
                        <span style={{ fontSize:16, fontWeight:800, color:"#F9FAFB" }}>{item.value}</span>
                      </div>
                      <div style={{ height:6, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:Math.round((item.value/max)*100)+"%", background:item.color, borderRadius:999, transition:"width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ADIÇÃO 2 — Gráfico MRR mensal */}
            {mrrData.length > 0 && (
              <section style={{ ...D.card, padding:24 }}>
                <SectionHeader title="Receita mensal (MRR)" sub="Últimos 6 meses · baseado em coupon_uses" />
                <MrrChart data={mrrData} />
              </section>
            )}

            {/* MELHORIA 4 — Crescimento de usuários por mês */}
            {userGrowth.length > 0 && (
              <section style={{ ...D.card, padding:24 }}>
                <SectionHeader title="Novos usuários por mês" sub="Últimos 6 meses · cadastros em profiles" />
                <UserGrowthChart data={userGrowth} />
              </section>
            )}

            <section>
              <SectionHeader title="Atividade recente" sub="Ultimos registros" />
              <div style={D.tableGrid}>
                <ActivityTable title="Usuarios recentes" count={recentUsers.length}>
                  {recentUsers.length === 0 ? <EmptyRow /> : recentUsers.map((u) => (
                    <ActivityRow key={u.id} primary={u.email ?? u.user_id.slice(0,16)+"..."} secondary={"Plano: "+(u.plan??"-")+" | "+(u.role??"-")} time={timeAgo(u.created_at)} tag={u.plan==="premium"?{label:"premium",color:"#8B5CF6"}:undefined} />
                  ))}
                </ActivityTable>
                <ActivityTable title="Medicos recentes" count={recentDoctors.length}>
                  {recentDoctors.length === 0 ? <EmptyRow /> : recentDoctors.map((d,i) => (
                    <ActivityRow key={(d.name??"")+i} primary={d.name??"-"} secondary={(d.specialty??"-")+" | "+(d.city??"-")+"/"+(d.uf??"-")} time={timeAgo(d.created_at)} />
                  ))}
                </ActivityTable>
                <ActivityTable title="Feedbacks" count={recentFeedback.length}>
                  {recentFeedback.length === 0 ? <EmptyRow /> : recentFeedback.map((f) => (
                    <FeedbackExpandRow key={f.id} item={f} expanded={expandedFeedback===f.id} onToggle={() => setExpandedFeedback(expandedFeedback===f.id?null:f.id)} />
                  ))}
                </ActivityTable>
                <ActivityTable title="Solicitacoes de visita" count={recentVisits.length}>
                  {recentVisits.length === 0 ? <EmptyRow /> : recentVisits.map((v) => (
                    <ActivityRow key={v.id} primary={v.name??"-"} secondary={(v.specialty??"-")+" | "+(v.city??"-")+"/"+(v.uf??"-")} time={timeAgo(v.created_at)} tag={v.status?{label:v.status,color:statusColor(v.status)}:undefined} />
                  ))}
                </ActivityTable>
              </div>
            </section>
          </>
        )}

        {/* ── TAB: PARTNERS ─────────────────────────────────────────────── */}
        {activeTab === "partners" && (
          <>
            {/* Summary KPIs */}
            <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
              {[{ label:"Conversoes totais", value:couponUses.length, color:"#10B981" },
                { label:"Receita total", value:"R$ "+totalRevenue.toFixed(2), color:"#3B82F6" },
                { label:"Comissoes a pagar", value:"R$ "+totalCommission.toFixed(2), color:"#F59E0B" },
                { label:"Parceiros ativos", value:partners.length, color:"#8B5CF6" }].map((k) => (
                <div key={k.label} style={{ ...D.card, padding:"18px 22px", borderLeft:"3px solid "+k.color }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#4B5563", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{k.label}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:"#F9FAFB" }}>{typeof k.value === "number" ? k.value.toLocaleString("pt-BR") : k.value}</div>
                </div>
              ))}
            </section>

            {/* Partner table */}
            <div style={{ ...D.card, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <SectionHeader title="Conversao por parceiro" sub="Receita e comissoes no periodo" />
                <div style={{ display:"flex", gap:8 }}>
                  <button type="button" onClick={() => exportCSV(couponUses, partners)} style={D.btnExport}>
                    Exportar cupons CSV
                  </button>
                  <button type="button" onClick={() => exportPartnerReport(couponUses, partners)} style={{ ...D.btnExport, background:"#10B981", color:"#fff", border:"none" }}>
                    Relatorio parceiros
                  </button>
                </div>
              </div>

              {partnerStats.length === 0 ? (
                <EmptyRow />
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr>
                        {["Parceiro","Conversoes","Receita (R$)","Comissao %","Comissao (R$)","Status"].map((h) => (
                          <th key={h} style={{ textAlign:"left", padding:"10px 14px", borderBottom:"1px solid #1F2937", color:"#4B5563", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {partnerStats.map((p) => (
                        <tr key={p.name} style={{ borderBottom:"1px solid #1F2937" }}>
                          <td style={{ padding:"12px 14px", color:"#E5E7EB", fontWeight:600 }}>{p.name}</td>
                          <td style={{ padding:"12px 14px", color:"#F9FAFB", fontWeight:700 }}>{p.uses}</td>
                          <td style={{ padding:"12px 14px", color:"#10B981", fontWeight:700 }}>R$ {p.revenue.toFixed(2)}</td>
                          <td style={{ padding:"12px 14px", color:"#9CA3AF" }}>{p.commission_pct}%</td>
                          <td style={{ padding:"12px 14px", color:"#F59E0B", fontWeight:700 }}>R$ {p.commission.toFixed(2)}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:"#10B981", background:"#10B98120", border:"1px solid #10B98140", borderRadius:999, padding:"2px 8px" }}>ATIVO</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:"#0D1117" }}>
                        <td style={{ padding:"12px 14px", color:"#6B7280", fontWeight:700, fontSize:12 }}>TOTAL</td>
                        <td style={{ padding:"12px 14px", color:"#F9FAFB", fontWeight:800 }}>{couponUses.length}</td>
                        <td style={{ padding:"12px 14px", color:"#10B981", fontWeight:800 }}>R$ {totalRevenue.toFixed(2)}</td>
                        <td />
                        <td style={{ padding:"12px 14px", color:"#F59E0B", fontWeight:800 }}>R$ {totalCommission.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Recent coupon uses */}
            <div style={{ ...D.card, padding:24 }}>
              <SectionHeader title="Ultimos usos de cupom" sub="Historico recente" />
              {couponUses.length === 0 ? <EmptyRow /> : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr>
                        {["Codigo","Parceiro","Plano","Valor (R$)","Data"].map((h) => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", borderBottom:"1px solid #1F2937", color:"#4B5563", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {couponUses.slice(0,30).map((u) => {
                        const pName = u.partner_id ? (partners.find((p) => p.id===u.partner_id)?.name ?? "-") : "-";
                        return (
                          <tr key={u.id} style={{ borderBottom:"1px solid #1F2937" }}>
                            <td style={{ padding:"10px 12px", color:"#E5E7EB", fontWeight:600, fontFamily:"monospace" }}>{u.code}</td>
                            <td style={{ padding:"10px 12px", color:"#9CA3AF" }}>{pName}</td>
                            <td style={{ padding:"10px 12px" }}>
                              {u.plan === "premium" && <span style={{ fontSize:10, fontWeight:700, color:"#8B5CF6", background:"#8B5CF620", border:"1px solid #8B5CF640", borderRadius:999, padding:"2px 7px" }}>PREMIUM</span>}
                              {u.plan !== "premium" && <span style={{ color:"#4B5563" }}>{u.plan??"-"}</span>}
                            </td>
                            <td style={{ padding:"10px 12px", color:"#10B981", fontWeight:700 }}>R$ {(u.value_brl??0).toFixed(2)}</td>
                            <td style={{ padding:"10px 12px", color:"#4B5563" }}>{timeAgo(u.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: ANALYTICS ────────────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <section style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start" }}>

            {/* Abas mais usadas */}
            <div style={{ ...D.card, flex:"1 1 340px", padding:24 }}>
              <SectionHeader title="Abas mais acessadas" sub={"Periodo: "+period} />
              {navLogs.length === 0 ? <EmptyRow /> : navLogs.slice(0,10).map((n, i) => (
                <div key={n.tab_name} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"#4B5563", fontWeight:700, width:18 }}>#{i+1}</span>
                      <span style={{ fontSize:13, color:"#E5E7EB", fontWeight:600 }}>{n.tab_name}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:"#F9FAFB" }}>{n.count.toLocaleString("pt-BR")}</span>
                  </div>
                  <div style={{ height:6, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:Math.round((n.count/maxNavCount)*100)+"%", background:"linear-gradient(90deg,#6366F1,#8B5CF6)", borderRadius:999, transition:"width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Usuarios por UF */}
            <div style={{ ...D.card, flex:"1 1 340px", padding:24 }}>
              <SectionHeader title="Usuarios por UF" sub="Ranking de estados" />
              {ufRanking.length === 0 ? <EmptyRow /> : ufRanking.slice(0,15).map((u, i) => (
                <div key={u.uf} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"#4B5563", fontWeight:700, width:18 }}>#{i+1}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:"#F9FAFB", fontFamily:"monospace" }}>{u.uf}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"baseline" }}>
                      <span style={{ fontSize:14, fontWeight:800, color:"#F9FAFB" }}>{u.count}</span>
                      <span style={{ fontSize:11, color:"#4B5563" }}>{counts.users ? Math.round((u.count/counts.users)*100) : 0}%</span>
                    </div>
                  </div>
                  <div style={{ height:5, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:Math.round((u.count/maxUfCount)*100)+"%", background:"linear-gradient(90deg,#3B82F6,#06B6D4)", borderRadius:999, transition:"width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {/* ── TAB: AI ───────────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <>
            <div style={{ ...D.card, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <SectionHeader title="Perguntas feitas para a IA" sub={"Ultimas "+aiQuestions.length+" perguntas"} />
                <button type="button" onClick={() => {
                  const csv = ["Pergunta,Data", ...aiQuestions.map((a) => [(a.question??"-").replace(/,/g," "), fmt(a.created_at)].join(","))].join("\n");
                  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href=url; a.download="perguntas-ia-escalamed.csv"; a.click();
                  URL.revokeObjectURL(url);
                }} style={D.btnExport}>
                  Exportar CSV
                </button>
              </div>
              {aiQuestions.length === 0 ? <EmptyRow /> : (
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {aiQuestions.map((a) => (
                    <div key={a.id} style={{ padding:"12px 0", borderTop:"1px solid #1F2937", display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start" }}>
                      <div style={{ flex:1, fontSize:13, color:"#D1D5DB", lineHeight:1.6 }}>{a.question ?? "-"}</div>
                      <span style={{ fontSize:11, color:"#374151", flexShrink:0 }}>{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MELHORIA 2 — Ranking usuários mais ativos na IA */}
            {aiUserRanking.length > 0 && (
              <div style={{ ...D.card, padding:24 }}>
                <SectionHeader title="Usuários mais ativos na EscalaIA" sub={"Top "+aiUserRanking.length+" por volume de perguntas"} />
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr>
                        {["#","Email","Total de perguntas","Atividade"].map((h) => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", borderBottom:"1px solid #1F2937", color:"#4B5563", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiUserRanking.map((u, i) => {
                        const maxTotal = aiUserRanking[0]?.total ?? 1;
                        const pct = Math.round((u.total / maxTotal) * 100);
                        return (
                          <tr key={u.user_id} style={{ borderBottom:"1px solid #1F2937" }}>
                            <td style={{ padding:"10px 12px", color:"#4B5563", fontWeight:700, width:32 }}>#{i+1}</td>
                            <td style={{ padding:"10px 12px", color:"#E5E7EB", fontWeight:600 }}>{u.email ?? u.user_id.slice(0,20)+"..."}</td>
                            <td style={{ padding:"10px 12px", color:"#4ADE80", fontWeight:800, textAlign:"center", width:140 }}>{u.total}</td>
                            <td style={{ padding:"10px 12px", minWidth:160 }}>
                              <div style={{ height:6, borderRadius:999, background:"#1F2937", overflow:"hidden" }}>
                                <div style={{ height:"100%", width:pct+"%", background:"linear-gradient(90deg,#10B981,#4ADE80)", borderRadius:999, transition:"width 0.6s ease" }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: SUBSCRIPTIONS ────────────────────────────────────────── */}
        {activeTab === "subscriptions" && (() => {
          const active    = allSubs.filter((s) => s.status === "active").length;
          const cancelled = allSubs.filter((s) => s.status === "cancelled").length;
          const suspended = allSubs.filter((s) => s.status === "suspended").length;
          const soon15    = new Date(Date.now() + 15 * 86400000).toISOString();
          return (
            <>
              <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
                {[
                  { label:"Ativas",     value:active,    color:"#10B981" },
                  { label:"Canceladas", value:cancelled, color:"#EF4444" },
                  { label:"Suspensas",  value:suspended, color:"#F59E0B" },
                  { label:"Total",      value:allSubs.length, color:"#3B82F6" },
                ].map((k) => (
                  <div key={k.label} style={{ ...D.card, padding:"18px 22px", borderLeft:"3px solid "+k.color }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#4B5563", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{k.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:"#F9FAFB" }}>{k.value}</div>
                  </div>
                ))}
              </section>

              <div style={{ ...D.card, padding:24 }}>
                <SectionHeader title="Todas as assinaturas" sub={allSubs.length+" registros · vermelho = vence em ≤ 15 dias"} />
                {allSubs.length === 0 ? <EmptyRow /> : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr>
                          {["Email","Plano","Status","Início","Vencimento","ID MP"].map((h) => (
                            <th key={h} style={{ textAlign:"left", padding:"8px 12px", borderBottom:"1px solid #1F2937", color:"#4B5563", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allSubs.map((s) => {
                          const expiring = s.status === "active" && s.end_date != null && s.end_date <= soon15;
                          const statusColor2 = s.status === "active" ? "#10B981" : s.status === "cancelled" ? "#EF4444" : "#F59E0B";
                          return (
                            <tr key={s.id} style={{ borderBottom:"1px solid #1F2937", background: expiring ? "rgba(239,68,68,0.05)" : "transparent" }}>
                              <td style={{ padding:"10px 12px", color: expiring ? "#FCA5A5" : "#E5E7EB", fontWeight:600 }}>{s.email ?? s.user_id.slice(0,18)+"..."}</td>
                              <td style={{ padding:"10px 12px", color:"#9CA3AF", textTransform:"capitalize" }}>{s.plan ?? "-"}</td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ fontSize:10, fontWeight:700, color:statusColor2, background:statusColor2+"20", border:"1px solid "+statusColor2+"40", borderRadius:999, padding:"2px 8px", textTransform:"uppercase" }}>{s.status ?? "-"}</span>
                              </td>
                              <td style={{ padding:"10px 12px", color:"#4B5563", whiteSpace:"nowrap" }}>{fmt(s.start_date)}</td>
                              <td style={{ padding:"10px 12px", whiteSpace:"nowrap", color: expiring ? "#FCA5A5" : "#4B5563", fontWeight: expiring ? 700 : 400 }}>
                                {fmt(s.end_date)}{expiring ? " ⚠️" : ""}
                              </td>
                              <td style={{ padding:"10px 12px", color:"#374151", fontFamily:"monospace", fontSize:11 }}>{s.mp_subscription_id ? s.mp_subscription_id.slice(0,18)+"..." : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          );
        })()}

      </div>
    </main>
  );
}

function statusColor(s: string) {
  if (s === "aprovado" || s === "approved") return "#10B981";
  if (s === "pendente"  || s === "pending")  return "#F59E0B";
  if (s === "recusado"  || s === "rejected") return "#EF4444";
  return "#6B7280";
}

function KpiCard({ label, value, delta, period, badge, badgeLabel, color, accent, spark }: {
  label: string; value: number; delta?: number; period?: Period;
  badge?: string; badgeLabel?: string; color: string; accent?: boolean; spark?: React.ReactNode;
}) {
  return (
    <div style={{ background: accent ? "linear-gradient(135deg,"+color+"22 0%,"+color+"08 100%)" : "#111827", border:"1px solid "+(accent?color+"40":"#1F2937"), borderLeft:"3px solid "+color, borderRadius:16, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#4B5563", letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</div>
        <div style={{ opacity:0.7 }}>{spark}</div>
      </div>
      <div style={{ fontSize:32, fontWeight:800, color:"#F9FAFB", lineHeight:1, margin:"10px 0 10px" }}>{value.toLocaleString("pt-BR")}</div>
      {badge ? (
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:color+"20", border:"1px solid "+color+"40", borderRadius:999, padding:"3px 10px" }}>
          <span style={{ fontSize:13, fontWeight:800, color }}>{badge}</span>
          {badgeLabel && <span style={{ fontSize:11, color:"#6B7280" }}>{badgeLabel}</span>}
        </div>
      ) : delta !== undefined ? (
        <div style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:13, fontWeight:700, color:delta>0?"#10B981":"#6B7280" }}>{delta>0?"+"+delta:String(delta)}</span>
          <span style={{ fontSize:12, color:"#4B5563" }}>{"novos / "+(period??"7d")}</span>
        </div>
      ) : <span style={{ fontSize:12, color:"#4B5563" }}>{badgeLabel??""}</span>}
    </div>
  );
}

function HealthTile({ label, value, desc, fill, color }: { label:string; value:string; desc:string; fill:number; color:string }) {
  return (
    <div style={{ padding:"16px 18px", background:"#0D1117", borderRadius:14, border:"1px solid #1F2937" }}>
      <div style={{ fontSize:11, fontWeight:600, color:"#4B5563", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color:"#F9FAFB", marginBottom:10 }}>{value}</div>
      <div style={{ height:5, borderRadius:999, background:"#1F2937", overflow:"hidden", marginBottom:6 }}>
        <div style={{ height:"100%", width:Math.min(100,Math.max(0,fill))+"%", background:color, borderRadius:999, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ fontSize:11, color:"#4B5563" }}>{desc}</div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title:string; sub:string }) {
  return (
    <div style={{ marginBottom:16 }}>
      <h2 style={{ fontSize:17, fontWeight:800, color:"#F9FAFB", margin:0 }}>{title}</h2>
      <p style={{ fontSize:13, color:"#4B5563", margin:"3px 0 0" }}>{sub}</p>
    </div>
  );
}

function ActivityTable({ title, count, children }: { title:string; count:number; children:React.ReactNode }) {
  return (
    <div style={{ ...D.card, padding:"20px 22px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:"#F9FAFB", margin:0 }}>{title}</h3>
        <span style={{ fontSize:11, color:"#4B5563", background:"#1F2937", padding:"2px 8px", borderRadius:999, fontWeight:600 }}>{count}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ActivityRow({ primary, secondary, time, tag }: { primary:string; secondary:string; time:string; tag?:{label:string;color:string} }) {
  return (
    <div style={{ padding:"10px 0", borderTop:"1px solid #1F2937", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#E5E7EB", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{primary}</div>
        <div style={{ fontSize:12, color:"#4B5563", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{secondary}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
        <span style={{ fontSize:11, color:"#374151" }}>{time}</span>
        {tag && <span style={{ fontSize:10, fontWeight:700, color:tag.color, background:tag.color+"20", border:"1px solid "+tag.color+"40", borderRadius:999, padding:"2px 7px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{tag.label}</span>}
      </div>
    </div>
  );
}

function FeedbackExpandRow({ item, expanded, onToggle }: { item:FeedbackRow; expanded:boolean; onToggle:()=>void }) {
  return (
    <div style={{ padding:"10px 0", borderTop:"1px solid #1F2937", cursor:"pointer" }} onClick={onToggle}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#E5E7EB", display:"flex", alignItems:"center", gap:6 }}>
            {item.user_name??"-"}
            <span style={{ fontSize:10, color:"#4B5563" }}>{expanded?"fechar":"ver msg"}</span>
          </div>
          <div style={{ fontSize:12, color:"#4B5563", marginTop:2 }}>{item.user_email??"-"}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{ fontSize:11, color:"#374151" }}>{timeAgo(item.created_at)}</span>
          {item.tipo && <span style={{ fontSize:10, fontWeight:700, color:"#14B8A6", background:"#14B8A620", border:"1px solid #14B8A640", borderRadius:999, padding:"2px 7px", textTransform:"uppercase" }}>{item.tipo}</span>}
        </div>
      </div>
      {expanded && item.mensagem && (
        <div style={{ marginTop:10, padding:"10px 12px", background:"#0D1117", borderRadius:10, border:"1px solid #1F2937", fontSize:13, color:"#9CA3AF", lineHeight:1.6 }}>
          {item.mensagem}
        </div>
      )}
    </div>
  );
}

function EmptyRow() {
  return <div style={{ fontSize:13, color:"#374151", paddingTop:12 }}>Nenhum registro ainda.</div>;
}

function MrrChart({ data }: { data: MrrPoint[] }) {
  const W = 600; const H = 120; const PAD = { t:10, r:16, b:32, l:56 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map((d) => d.mrr), 1);
  const xs = data.map((_, i) => PAD.l + (i / Math.max(data.length - 1, 1)) * iW);
  const ys = data.map((d) => PAD.t + iH - (d.mrr / maxVal) * iH);
  const polyline = xs.map((x, i) => x + "," + ys[i]).join(" ");
  const area = "M" + xs[0] + "," + ys[0] + " L" + xs.map((x, i) => x + "," + ys[i]).join(" L") +
    " L" + xs[xs.length - 1] + "," + (PAD.t + iH) + " L" + xs[0] + "," + (PAD.t + iH) + " Z";
  const totalMrr = data.reduce((s, d) => s + d.mrr, 0);
  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(mo) - 1] + "/" + y.slice(2);
  };
  return (
    <div>
      <div style={{ display:"flex", gap:24, marginBottom:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:11, color:"#4B5563", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Total 6 meses</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#10B981" }}>R$ {totalMrr.toLocaleString("pt-BR", { minimumFractionDigits:2 })}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:"#4B5563", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Último mês</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#F9FAFB" }}>R$ {(data[data.length - 1]?.mrr ?? 0).toLocaleString("pt-BR", { minimumFractionDigits:2 })}</div>
        </div>
      </div>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", height:"auto", overflow:"visible" }}>
        <defs>
          <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0, 0.5, 1].map((f) => {
          const y = PAD.t + iH - f * iH;
          return (
            <g key={f}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#1F2937" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#4B5563">
                R${(maxVal * f).toFixed(0)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#mrrGrad)" />
        <polyline points={polyline} fill="none" stroke="#10B981" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* dots + labels */}
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={xs[i]} cy={ys[i]} r={4} fill="#10B981" stroke="#111827" strokeWidth={2} />
            <text x={xs[i]} y={H - 6} textAnchor="middle" fontSize={10} fill="#6B7280">{formatMonth(d.month)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function UserGrowthChart({ data }: { data: MrrPoint[] }) {
  const W = 600; const H = 120; const PAD = { t:10, r:16, b:32, l:44 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map((d) => d.mrr), 1);
  const barW = Math.floor(iW / data.length) - 6;
  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(mo) - 1] + "/" + y.slice(2);
  };
  const totalNew = data.reduce((s, d) => s + d.mrr, 0);
  return (
    <div>
      <div style={{ display:"flex", gap:24, marginBottom:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:11, color:"#4B5563", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Novos nos últimos 6 meses</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#3B82F6" }}>{totalNew.toLocaleString("pt-BR")}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:"#4B5563", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Último mês</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#F9FAFB" }}>{data[data.length - 1]?.mrr ?? 0}</div>
        </div>
      </div>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", height:"auto", overflow:"visible" }}>
        {[0, 0.5, 1].map((f) => {
          const y = PAD.t + iH - f * iH;
          return (
            <g key={f}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#1F2937" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#4B5563">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barH = maxVal ? (d.mrr / maxVal) * iH : 0;
          const x = PAD.l + (i / data.length) * iW + (iW / data.length - barW) / 2;
          const y = PAD.t + iH - barH;
          return (
            <g key={d.month}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#3B82F6" opacity={0.85} />
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#6B7280">{formatMonth(d.month)}</text>
              {d.mrr > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#93C5FD" fontWeight="700">{d.mrr}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const D: Record<string, React.CSSProperties> = {
  page:          { minHeight:"100vh", background:"#0D1117", padding:"24px 20px", fontFamily:"Inter,-apple-system,BlinkMacSystemFont,sans-serif", color:"#F9FAFB" },
  wrap:          { maxWidth:1320, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 },
  card:          { background:"#111827", border:"1px solid #1F2937", borderRadius:16, boxShadow:"0 1px 3px rgba(0,0,0,0.3)" },
  header:        { background:"#111827", border:"1px solid #1F2937", borderRadius:18, padding:"22px 28px" },
  headerInner:   { display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 },
  badge:         { display:"inline-flex", alignItems:"center", gap:7, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:999, padding:"4px 11px", fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"#34D399" },
  dot:           { width:6, height:6, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 6px #10B981", display:"inline-block" },
  title:         { fontSize:26, fontWeight:800, color:"#F9FAFB", margin:0, letterSpacing:"-0.02em" },
  subtitle:      { fontSize:13, color:"#4B5563", margin:0 },
  periodBar:     { display:"flex", background:"#0D1117", border:"1px solid #1F2937", borderRadius:10, padding:3, gap:2 },
  periodBtn:     { background:"transparent", color:"#6B7280", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontWeight:600, fontSize:12, fontFamily:"inherit" },
  periodBtnActive: { background:"#1F2937", color:"#F9FAFB" },
  tabBtn:        { background:"transparent", color:"#6B7280", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" },
  tabBtnActive:  { background:"#1F2937", color:"#F9FAFB" },
  btnGhost:      { background:"#1F2937", color:"#9CA3AF", border:"1px solid #374151", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" },
  btnPrimary:    { background:"#10B981", color:"#fff", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" },
  btnExport:     { background:"transparent", color:"#9CA3AF", border:"1px solid #374151", borderRadius:10, padding:"8px 14px", cursor:"pointer", fontWeight:600, fontSize:12, fontFamily:"inherit" },
  error:         { background:"#1F0A0A", border:"1px solid #7F1D1D", color:"#FCA5A5", borderRadius:12, padding:"14px 18px", fontSize:14 },
  kpiGrid:       { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12 },
  tableGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(290px, 1fr))", gap:14 },
  spinner:       { width:28, height:28, border:"3px solid #1F2937", borderTopColor:"#10B981", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
};

const kf = `@keyframes spin { to { transform: rotate(360deg); } }`;