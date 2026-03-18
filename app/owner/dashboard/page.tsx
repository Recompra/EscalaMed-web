“use client”;

import { useEffect, useMemo, useState } from “react”;
import { createClient } from “@supabase/supabase-js”;
import { useRouter } from “next/navigation”;

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Counts = {
users: number;
premiumUsers: number;
doctors: number;
directory: number;
userDoctors: number;
groups: number;
feedback: number;
visits: number;
};

type ProfileRow = {
id: string;
user_id: string;
plan: string | null;
role: string | null;
created_at: string;
};

type DoctorRow = {
id?: string;
name: string | null;
city: string | null;
uf: string | null;
specialty?: string | null;
created_at: string;
};

type FeedbackRow = {
id: string;
user_name: string | null;
user_email: string | null;
tipo: string | null;
mensagem: string | null;
created_at: string;
};

type VisitRow = {
id: string;
name: string | null;
city: string | null;
uf: string | null;
specialty: string | null;
status: string | null;
created_at: string;
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmt(d?: string | null) {
if (!d) return “—”;
return new Date(d).toLocaleDateString(“pt-BR”, {
day: “2-digit”,
month: “short”,
year: “numeric”,
});
}

/* ════════════════════════════════════════════════════════════════════════════
MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function OwnerDashboardPage() {
const router = useRouter();

const [loading, setLoading] = useState(true);
const [errorMsg, setErrorMsg] = useState(””);
const [counts, setCounts] = useState<Counts>({
users: 0, premiumUsers: 0, doctors: 0, directory: 0,
userDoctors: 0, groups: 0, feedback: 0, visits: 0,
});
const [recentUsers, setRecentUsers]       = useState<ProfileRow[]>([]);
const [recentDoctors, setRecentDoctors]   = useState<DoctorRow[]>([]);
const [recentFeedback, setRecentFeedback] = useState<FeedbackRow[]>([]);
const [recentVisits, setRecentVisits]     = useState<VisitRow[]>([]);
const [new7d, setNew7d] = useState({ users: 0, doctors: 0, visits: 0, feedback: 0 });

useEffect(() => { loadDashboard(); }, []);

async function loadDashboard() {
try {
setLoading(true);
setErrorMsg(””);

```
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { router.push("/login"); return; }

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("user_id", user.id).single();
  if (profileError) { setErrorMsg("Erro ao validar acesso."); setLoading(false); return; }
  if (profile?.role !== "owner") { router.push("/"); return; }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const iso7d = sevenDaysAgo.toISOString();

  const [
    profilesRes, premiumProfilesRes, doctorsRes, directoryRes,
    userDoctorsRes, groupsRes, feedbackRes, visitsRes,
    recentUsersRes, recentDoctorsRes, recentFeedbackRes, recentVisitsRes,
    users7dRes, doctors7dRes, visits7dRes, feedback7dRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "premium"),
    supabase.from("doctors").select("*", { count: "exact", head: true }),
    supabase.from("doctors_directory").select("*", { count: "exact", head: true }),
    supabase.from("user_doctors").select("*", { count: "exact", head: true }),
    supabase.from("groups").select("*", { count: "exact", head: true }),
    supabase.from("feedback").select("*", { count: "exact", head: true }),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("id,user_id,plan,role,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("doctors").select("id,name,city,uf,specialty,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("feedback").select("id,user_name,user_email,tipo,mensagem,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("visit_requests").select("id,name,city,uf,specialty,status,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", iso7d),
    supabase.from("doctors").select("*", { count: "exact", head: true }).gte("created_at", iso7d),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }).gte("created_at", iso7d),
    supabase.from("feedback").select("*", { count: "exact", head: true }).gte("created_at", iso7d),
  ]);

  setCounts({
    users:       profilesRes.count ?? 0,
    premiumUsers: premiumProfilesRes.count ?? 0,
    doctors:     doctorsRes.count ?? 0,
    directory:   directoryRes.count ?? 0,
    userDoctors: userDoctorsRes.count ?? 0,
    groups:      groupsRes.count ?? 0,
    feedback:    feedbackRes.count ?? 0,
    visits:      visitsRes.count ?? 0,
  });
  setRecentUsers((recentUsersRes.data as ProfileRow[]) ?? []);
  setRecentDoctors((recentDoctorsRes.data as DoctorRow[]) ?? []);
  setRecentFeedback((recentFeedbackRes.data as FeedbackRow[]) ?? []);
  setRecentVisits((recentVisitsRes.data as VisitRow[]) ?? []);
  setNew7d({
    users:    users7dRes.count ?? 0,
    doctors:  doctors7dRes.count ?? 0,
    visits:   visits7dRes.count ?? 0,
    feedback: feedback7dRes.count ?? 0,
  });
} catch (err) {
  console.error(err);
  setErrorMsg("Erro ao carregar dashboard.");
} finally {
  setLoading(false);
}
```

}

const adoptionRate = useMemo(() => {
if (!counts.doctors) return 0;
return Math.round((counts.userDoctors / counts.doctors) * 100);
}, [counts.doctors, counts.userDoctors]);

const premiumRate = useMemo(() => {
if (!counts.users) return 0;
return Math.round((counts.premiumUsers / counts.users) * 100);
}, [counts.users, counts.premiumUsers]);

const trend7d = [
{ label: “Usuários”,  value: new7d.users,    total: counts.users,    icon: “👤” },
{ label: “Médicos”,   value: new7d.doctors,   total: counts.doctors,  icon: “🩺” },
{ label: “Visitas”,   value: new7d.visits,    total: counts.visits,   icon: “📋” },
{ label: “Feedbacks”, value: new7d.feedback,  total: counts.feedback, icon: “💬” },
];
const maxTrend = Math.max(…trend7d.map((x) => x.value), 1);

/* ── Loading ─────────────────────────────────────────────────────────── */
if (loading) {
return (
<main style={css.page}>
<style>{keyframes}</style>
<div style={{ …css.card, padding: 48, textAlign: “center” as const, color: “#6B7280”, fontSize: 14, maxWidth: 400, margin: “60px auto” }}>
<div style={css.spinner} />
Carregando dashboard…
</div>
</main>
);
}

/* ── Render ──────────────────────────────────────────────────────────── */
return (
<main style={css.page}>
<style>{keyframes}</style>
<div style={css.wrap}>

```
    {/* ── HEADER ──────────────────────────────────────────────────── */}
    <header style={css.header}>
      <div style={css.headerInner}>
        <div style={css.headerLeft}>
          <span style={css.badge}>
            <span style={css.dot} />
            OWNER · ESCALAMED
          </span>
          <h1 style={css.title}>Analytics Dashboard</h1>
          <p style={css.subtitle}>Visão interna de produto, adoção e operação</p>
        </div>
        <div style={css.headerActions}>
          <button type="button" onClick={loadDashboard} style={css.btnGhost}>
            ↺ Atualizar
          </button>
          <button type="button" onClick={() => router.push("/home")} style={css.btnPrimary}>
            ← Voltar
          </button>
        </div>
      </div>
      <div style={css.ring} />
    </header>

    {/* ── ERROR ────────────────────────────────────────────────────── */}
    {errorMsg && <div style={css.error}>{errorMsg}</div>}

    {/* ── KPI GRID ─────────────────────────────────────────────────── */}
    <section style={css.kpiGrid}>
      <KpiCard label="Usuários"     value={counts.users}        delta={new7d.users}    deltaLabel="novos / 7d" color="#3B82F6" />
      <KpiCard label="Premium"      value={counts.premiumUsers}  badge={`${premiumRate}%`}  badgeLabel="da base"    color="#8B5CF6" accent />
      <KpiCard label="Médicos"      value={counts.doctors}       delta={new7d.doctors}  deltaLabel="novos / 7d" color="#10B981" />
      <KpiCard label="Diretório"    value={counts.directory}     deltaLabel="pesquisável"                        color="#F59E0B" />
      <KpiCard label="Vínculos"     value={counts.userDoctors}   badge={`${adoptionRate}%`} badgeLabel="adoção"    color="#EC4899" />
      <KpiCard label="Grupos"       value={counts.groups}        deltaLabel="ativos"                             color="#6366F1" />
      <KpiCard label="Feedbacks"    value={counts.feedback}      delta={new7d.feedback} deltaLabel="novos / 7d" color="#14B8A6" />
      <KpiCard label="Solicitações" value={counts.visits}        delta={new7d.visits}   deltaLabel="novos / 7d" color="#F97316" />
    </section>

    {/* ── MIDDLE ROW ───────────────────────────────────────────────── */}
    <section style={css.midRow}>

      {/* Health indicators */}
      <div style={{ ...css.card, flex: "1 1 420px", padding: 28 }}>
        <SectionHeader title="Saúde do produto" sub="Indicadores principais" />
        <div style={css.healthGrid}>
          <HealthTile label="Conversão premium" value={`${premiumRate}%`}   desc="Usuários com plano premium"      fill={premiumRate}   color="#8B5CF6" />
          <HealthTile label="Adoção de médicos"  value={`${adoptionRate}%`}  desc="Vínculos sobre base de médicos"  fill={adoptionRate}  color="#10B981" />
          <HealthTile label="Base do diretório"  value={counts.directory.toLocaleString("pt-BR")} desc="Médicos disponíveis para busca" fill={Math.min(100, Math.round(counts.directory / 10))} color="#F59E0B" />
          <HealthTile label="Interações totais"  value={(counts.feedback + counts.visits).toLocaleString("pt-BR")} desc="Feedbacks + solicitações" fill={Math.min(100, Math.round((counts.feedback + counts.visits) / 2))} color="#3B82F6" />
        </div>
      </div>

      {/* 7-day trend bars */}
      <div style={{ ...css.card, flex: "0 1 300px", padding: 28 }}>
        <SectionHeader title="Últimos 7 dias" sub="Novos registros por categoria" />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
          {trend7d.map((item) => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{item.icon}</span>{item.label}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                  {item.value}
                </span>
              </div>
              <div style={css.barTrack}>
                <div style={{ ...css.barFill, width: `${Math.round((item.value / maxTrend) * 100)}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                Total: {item.total.toLocaleString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── RECENT ACTIVITY ──────────────────────────────────────────── */}
    <section>
      <SectionHeader title="Atividade recente" sub="Últimos registros por categoria" />
      <div style={css.tableGrid}>

        <ActivityTable title="Usuários recentes" count={recentUsers.length} icon="👤">
          {recentUsers.length === 0 ? <EmptyRow /> : recentUsers.map((u) => (
            <ActivityRow
              key={u.id}
              primary={u.user_id.slice(0, 18) + "…"}
              secondary={`${u.plan ?? "—"} · ${u.role ?? "—"}`}
              date={fmt(u.created_at)}
              tag={u.plan === "premium" ? { label: "premium", color: "#8B5CF6" } : undefined}
            />
          ))}
        </ActivityTable>

        <ActivityTable title="Médicos recentes" count={recentDoctors.length} icon="🩺">
          {recentDoctors.length === 0 ? <EmptyRow /> : recentDoctors.map((d, i) => (
            <ActivityRow
              key={`${d.name}-${i}`}
              primary={d.name ?? "—"}
              secondary={`${d.specialty ?? "—"} · ${d.city ?? "—"}/${d.uf ?? "—"}`}
              date={fmt(d.created_at)}
            />
          ))}
        </ActivityTable>

        <ActivityTable title="Feedbacks recentes" count={recentFeedback.length} icon="💬">
          {recentFeedback.length === 0 ? <EmptyRow /> : recentFeedback.map((f) => (
            <ActivityRow
              key={f.id}
              primary={f.user_name ?? "—"}
              secondary={f.mensagem ?? "—"}
              date={fmt(f.created_at)}
              tag={f.tipo ? { label: f.tipo, color: "#14B8A6" } : undefined}
            />
          ))}
        </ActivityTable>

        <ActivityTable title="Solicitações de visita" count={recentVisits.length} icon="📋">
          {recentVisits.length === 0 ? <EmptyRow /> : recentVisits.map((v) => (
            <ActivityRow
              key={v.id}
              primary={v.name ?? "—"}
              secondary={`${v.specialty ?? "—"} · ${v.city ?? "—"}/${v.uf ?? "—"}`}
              date={fmt(v.created_at)}
              tag={v.status ? { label: v.status, color: statusColor(v.status) } : undefined}
            />
          ))}
        </ActivityTable>

      </div>
    </section>

  </div>
</main>
```

);
}

/* ─── Status color ───────────────────────────────────────────────────────── */
function statusColor(s: string) {
if (s === “aprovado” || s === “approved”) return “#10B981”;
if (s === “pendente”  || s === “pending”)  return “#F59E0B”;
if (s === “recusado”  || s === “rejected”) return “#EF4444”;
return “#6B7280”;
}

/* ════════════════════════════════════════════════════════════════════════════
SUB-COMPONENTS
════════════════════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, delta, deltaLabel, badge, badgeLabel, color, accent }: {
label: string;
value: number;
delta?: number;
deltaLabel?: string;
badge?: string;
badgeLabel?: string;
color: string;
accent?: boolean;
}) {
return (
<div style={{
…css.card,
padding: “22px 24px”,
background: accent ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)` : “#FFFFFF”,
borderLeft: `3px solid ${color}`,
position: “relative” as const,
overflow: “hidden”,
}}>
<div style={{ position: “absolute” as const, top: -20, right: -20, width: 80, height: 80, borderRadius: “50%”, background: `${color}0D`, pointerEvents: “none” as const }} />
<div style={{ fontSize: 11, fontWeight: 600, color: “#6B7280”, letterSpacing: “0.07em”, textTransform: “uppercase” as const, marginBottom: 10 }}>
{label}
</div>
<div style={{ fontSize: 34, fontWeight: 800, color: “#0D1117”, lineHeight: 1, fontVariantNumeric: “tabular-nums” as const, marginBottom: 10 }}>
{value.toLocaleString(“pt-BR”)}
</div>
{badge ? (
<div style={{ display: “inline-flex”, alignItems: “center”, gap: 4, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 999, padding: “3px 10px” }}>
<span style={{ fontSize: 13, fontWeight: 800, color }}>{badge}</span>
<span style={{ fontSize: 11, color: “#6B7280” }}>{badgeLabel}</span>
</div>
) : delta !== undefined ? (
<div style={{ display: “inline-flex”, alignItems: “center”, gap: 5 }}>
<span style={{ fontSize: 13, fontWeight: 700, color: delta > 0 ? “#10B981” : “#6B7280” }}>
{delta > 0 ? `+${delta}` : delta}
</span>
<span style={{ fontSize: 12, color: “#9CA3AF” }}>{deltaLabel}</span>
</div>
) : (
<span style={{ fontSize: 12, color: “#9CA3AF” }}>{deltaLabel}</span>
)}
</div>
);
}

function HealthTile({ label, value, desc, fill, color }: {
label: string;
value: string;
desc: string;
fill: number;
color: string;
}) {
const pct = Math.min(100, Math.max(0, fill));
return (
<div style={{ padding: “18px 20px”, background: “#F9FAFB”, borderRadius: 14, border: “1px solid #F3F4F6” }}>
<div style={{ fontSize: 11, fontWeight: 600, color: “#9CA3AF”, textTransform: “uppercase” as const, letterSpacing: “0.07em”, marginBottom: 6 }}>{label}</div>
<div style={{ fontSize: 28, fontWeight: 800, color: “#111827”, marginBottom: 10, fontVariantNumeric: “tabular-nums” as const }}>{value}</div>
<div style={{ height: 6, borderRadius: 999, background: “#E5E7EB”, overflow: “hidden”, marginBottom: 6 }}>
<div style={{ height: “100%”, width: `${pct}%`, borderRadius: 999, background: color, transition: “width 0.6s ease” }} />
</div>
<div style={{ fontSize: 11, color: “#9CA3AF” }}>{desc}</div>
</div>
);
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
return (
<div style={{ marginBottom: 20 }}>
<h2 style={{ fontSize: 18, fontWeight: 800, color: “#111827”, margin: 0 }}>{title}</h2>
<p style={{ fontSize: 13, color: “#9CA3AF”, margin: “4px 0 0” }}>{sub}</p>
</div>
);
}

function ActivityTable({ title, count, icon, children }: {
title: string;
count: number;
icon: string;
children: React.ReactNode;
}) {
return (
<div style={{ …css.card, padding: “22px 24px” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 16 }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 8 }}>
<span style={{ fontSize: 16 }}>{icon}</span>
<h3 style={{ fontSize: 15, fontWeight: 700, color: “#111827”, margin: 0 }}>{title}</h3>
</div>
<span style={{ fontSize: 12, color: “#6B7280”, background: “#F3F4F6”, padding: “2px 9px”, borderRadius: 999, fontWeight: 600 }}>
{count}
</span>
</div>
<div>{children}</div>
</div>
);
}

function ActivityRow({ primary, secondary, date, tag }: {
primary: string;
secondary: string;
date: string;
tag?: { label: string; color: string };
}) {
return (
<div style={{ padding: “11px 0”, borderTop: “1px solid #F3F4F6”, display: “flex”, justifyContent: “space-between”, alignItems: “flex-start”, gap: 12 }}>
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontSize: 13, fontWeight: 600, color: “#111827”, whiteSpace: “nowrap” as const, overflow: “hidden”, textOverflow: “ellipsis” }}>
{primary}
</div>
<div style={{ fontSize: 12, color: “#9CA3AF”, marginTop: 2, whiteSpace: “nowrap” as const, overflow: “hidden”, textOverflow: “ellipsis” }}>
{secondary}
</div>
</div>
<div style={{ display: “flex”, flexDirection: “column” as const, alignItems: “flex-end”, gap: 4, flexShrink: 0 }}>
<span style={{ fontSize: 11, color: “#9CA3AF” }}>{date}</span>
{tag && (
<span style={{
fontSize: 10, fontWeight: 700, color: tag.color,
background: `${tag.color}18`, border: `1px solid ${tag.color}28`,
borderRadius: 999, padding: “2px 7px”,
textTransform: “uppercase” as const, letterSpacing: “0.05em”,
}}>
{tag.label}
</span>
)}
</div>
</div>
);
}

function EmptyRow() {
return <div style={{ fontSize: 13, color: “#9CA3AF”, paddingTop: 12 }}>Nenhum registro encontrado.</div>;
}

/* ════════════════════════════════════════════════════════════════════════════
STYLES
════════════════════════════════════════════════════════════════════════════ */
const css: Record<string, React.CSSProperties> = {
page: {
minHeight: “100vh”,
background: “#F4F6F9”,
padding: “28px 24px”,
fontFamily: “‘Inter’, -apple-system, BlinkMacSystemFont, sans-serif”,
color: “#111827”,
},
wrap: {
maxWidth: 1280,
margin: “0 auto”,
display: “flex”,
flexDirection: “column”,
gap: 24,
},
card: {
background: “#FFFFFF”,
border: “1px solid #E5E7EB”,
borderRadius: 16,
boxShadow: “0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)”,
},
header: {
background: “#0D1117”,
borderRadius: 20,
padding: “28px 32px”,
position: “relative”,
overflow: “hidden”,
},
headerInner: {
display: “flex”,
justifyContent: “space-between”,
alignItems: “center”,
flexWrap: “wrap”,
gap: 16,
position: “relative”,
zIndex: 1,
},
headerLeft: {
display: “flex”,
flexDirection: “column”,
gap: 6,
},
headerActions: {
display: “flex”,
gap: 10,
},
badge: {
display: “inline-flex”,
alignItems: “center”,
gap: 7,
background: “rgba(16,185,129,0.12)”,
border: “1px solid rgba(16,185,129,0.22)”,
borderRadius: 999,
padding: “5px 12px”,
fontSize: 11,
fontWeight: 700,
letterSpacing: “0.08em”,
color: “#34D399”,
width: “fit-content”,
},
dot: {
width: 7,
height: 7,
borderRadius: “50%”,
background: “#10B981”,
boxShadow: “0 0 8px #10B981”,
display: “inline-block”,
},
title: {
fontSize: 28,
fontWeight: 800,
color: “#FFFFFF”,
margin: 0,
letterSpacing: “-0.02em”,
},
subtitle: {
fontSize: 14,
color: “rgba(255,255,255,0.5)”,
margin: 0,
},
btnGhost: {
background: “rgba(255,255,255,0.07)”,
color: “rgba(255,255,255,0.85)”,
border: “1px solid rgba(255,255,255,0.12)”,
borderRadius: 10,
padding: “9px 16px”,
cursor: “pointer”,
fontWeight: 600,
fontSize: 13,
fontFamily: “inherit”,
},
btnPrimary: {
background: “#10B981”,
color: “#fff”,
border: “none”,
borderRadius: 10,
padding: “9px 16px”,
cursor: “pointer”,
fontWeight: 700,
fontSize: 13,
fontFamily: “inherit”,
boxShadow: “0 4px 14px rgba(16,185,129,0.35)”,
},
ring: {
position: “absolute”,
top: -80,
right: -80,
width: 280,
height: 280,
borderRadius: “50%”,
border: “40px solid rgba(255,255,255,0.03)”,
pointerEvents: “none”,
},
error: {
background: “#FEF2F2”,
border: “1px solid #FECACA”,
color: “#B91C1C”,
borderRadius: 12,
padding: “14px 18px”,
fontSize: 14,
},
kpiGrid: {
display: “grid”,
gridTemplateColumns: “repeat(auto-fit, minmax(200px, 1fr))”,
gap: 14,
},
midRow: {
display: “flex”,
gap: 16,
flexWrap: “wrap”,
alignItems: “flex-start”,
},
healthGrid: {
display: “grid”,
gridTemplateColumns: “repeat(auto-fit, minmax(180px, 1fr))”,
gap: 12,
},
tableGrid: {
display: “grid”,
gridTemplateColumns: “repeat(auto-fit, minmax(300px, 1fr))”,
gap: 16,
},
barTrack: {
height: 8,
borderRadius: 999,
background: “#F3F4F6”,
overflow: “hidden”,
},
barFill: {
height: “100%”,
borderRadius: 999,
background: “linear-gradient(90deg, #10B981, #34D399)”,
transition: “width 0.6s ease”,
minWidth: 4,
},
spinner: {
width: 24,
height: 24,
border: “3px solid #E5E7EB”,
borderTopColor: “#10B981”,
borderRadius: “50%”,
animation: “spin 0.8s linear infinite”,
margin: “0 auto 12px”,
},
};

const keyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;