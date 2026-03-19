"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Period = "7d" | "30d" | "90d";

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

type SparkPoint = { day: string; value: number };

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
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function periodDays(p: Period) {
  return p === "7d" ? 7 : p === "30d" ? 30 : 90;
}

function buildSparkData(rows: { created_at: string }[], days: number): SparkPoint[] {
  const counts: Record<string, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    counts[key] = 0;
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    if (key in counts) counts[key]++;
  }
  return Object.entries(counts).map(([day, value]) => ({ day, value }));
}

function Sparkline({ data, color }: { data: SparkPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 80;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.value / max) * h;
    return x + "," + y;
  });
  const polyline = pts.join(" ");
  const area =
    "M" +
    pts[0] +
    " L" +
    pts.join(" L") +
    " L" +
    (w + "," + h) +
    " L0," +
    h +
    " Z";

  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={"grad-" + color.replace("#", "")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#grad-" + color.replace("#", "") + ")"} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [period, setPeriod] = useState<Period>("7d");
  const [counts, setCounts] = useState<Counts>({
    users: 0, premiumUsers: 0, doctors: 0, directory: 0,
    userDoctors: 0, groups: 0, feedback: 0, visits: 0,
  });
  const [recentUsers, setRecentUsers] = useState<ProfileRow[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<DoctorRow[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRow[]>([]);
  const [recentVisits, setRecentVisits] = useState<VisitRow[]>([]);
  const [newPeriod, setNewPeriod] = useState({ users: 0, doctors: 0, visits: 0, feedback: 0 });
  const [visitStatus, setVisitStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const [sparkUsers, setSparkUsers] = useState<SparkPoint[]>([]);
  const [sparkDoctors, setSparkDoctors] = useState<SparkPoint[]>([]);
  const [sparkVisits, setSparkVisits] = useState<SparkPoint[]>([]);
  const [sparkFeedback, setSparkFeedback] = useState<SparkPoint[]>([]);

  const loadDashboard = useCallback(async (p: Period = period, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push("/login"); return; }

      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("role").eq("user_id", user.id).single();
      if (profileError) { setErrorMsg("Erro ao validar acesso."); return; }
      if (profile?.role !== "owner") { router.push("/"); return; }

      const days = periodDays(p);
      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - days);
      const isoPeriod = periodAgo.toISOString();

      const sparkStart = new Date();
      sparkStart.setDate(sparkStart.getDate() - days);
      const isoSpark = sparkStart.toISOString();

      const [
        profilesRes, premiumRes, doctorsRes, directoryRes,
        userDoctorsRes, groupsRes, feedbackRes, visitsRes,
        recentUsersRes, recentDoctorsRes, recentFeedbackRes, recentVisitsRes,
        periodUsersRes, periodDoctorsRes, periodVisitsRes, periodFeedbackRes,
        pendingRes, approvedRes, rejectedRes,
        sparkUsersRes, sparkDoctorsRes, sparkVisitsRes, sparkFeedbackRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "premium"),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("doctors_directory").select("*", { count: "exact", head: true }),
        supabase.from("user_doctors").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
        supabase.from("visit_requests").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("id,user_id,plan,role,created_at").order("created_at", { ascending: false }).limit(8),
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
        supabase.from("profiles").select("created_at").gte("created_at", isoSpark),
        supabase.from("doctors").select("created_at").gte("created_at", isoSpark),
        supabase.from("visit_requests").select("created_at").gte("created_at", isoSpark),
        supabase.from("feedback").select("created_at").gte("created_at", isoSpark),
      ]);

      setCounts({
        users: profilesRes.count ?? 0,
        premiumUsers: premiumRes.count ?? 0,
        doctors: doctorsRes.count ?? 0,
        directory: directoryRes.count ?? 0,
        userDoctors: userDoctorsRes.count ?? 0,
        groups: groupsRes.count ?? 0,
        feedback: feedbackRes.count ?? 0,
        visits: visitsRes.count ?? 0,
      });

      setRecentUsers((recentUsersRes.data as ProfileRow[]) ?? []);
      setRecentDoctors((recentDoctorsRes.data as DoctorRow[]) ?? []);
      setRecentFeedback((recentFeedbackRes.data as FeedbackRow[]) ?? []);
      setRecentVisits((recentVisitsRes.data as VisitRow[]) ?? []);

      setNewPeriod({
        users: periodUsersRes.count ?? 0,
        doctors: periodDoctorsRes.count ?? 0,
        visits: periodVisitsRes.count ?? 0,
        feedback: periodFeedbackRes.count ?? 0,
      });

      setVisitStatus({
        pending: pendingRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        rejected: rejectedRes.count ?? 0,
      });

      setSparkUsers(buildSparkData(sparkUsersRes.data ?? [], days));
      setSparkDoctors(buildSparkData(sparkDoctorsRes.data ?? [], days));
      setSparkVisits(buildSparkData(sparkVisitsRes.data ?? [], days));
      setSparkFeedback(buildSparkData(sparkFeedbackRes.data ?? [], days));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, router]);

  useEffect(() => { loadDashboard(period); }, []);

  function handlePeriod(p: Period) {
    setPeriod(p);
    loadDashboard(p, true);
  }

  const adoptionRate = useMemo(() => {
    if (!counts.doctors) return 0;
    return Math.round((counts.userDoctors / counts.doctors) * 100);
  }, [counts.doctors, counts.userDoctors]);

  const premiumRate = useMemo(() => {
    if (!counts.users) return 0;
    return Math.round((counts.premiumUsers / counts.users) * 100);
  }, [counts.users, counts.premiumUsers]);

  const totalVisits = visitStatus.pending + visitStatus.approved + visitStatus.rejected;

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
                <span style={D.badge}>
                  <span style={D.dot} />
                  OWNER
                </span>
                {refreshing && <span style={{ fontSize: 12, color: "#6B7280" }}>Atualizando...</span>}
              </div>
              <h1 style={D.title}>EscalaMed Dashboard</h1>
              <p style={D.subtitle}>Visao interna de produto, adocao e operacao</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Period selector */}
              <div style={D.periodBar}>
                {(["7d", "30d", "90d"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriod(p)}
                    style={{ ...D.periodBtn, ...(period === p ? D.periodBtnActive : {}) }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => loadDashboard(period, true)} style={D.btnGhost}>
                Atualizar
              </button>
              <button type="button" onClick={() => router.push("/home")} style={D.btnPrimary}>
                Voltar
              </button>
            </div>
          </div>
        </header>

        {errorMsg && <div style={D.error}>{errorMsg}</div>}

        {/* KPI GRID */}
        <section style={D.kpiGrid}>
          <KpiCard label="Usuarios"     value={counts.users}       delta={newPeriod.users}    period={period} color="#3B82F6" spark={<Sparkline data={sparkUsers}   color="#3B82F6" />} />
          <KpiCard label="Premium"      value={counts.premiumUsers} badge={premiumRate + "%"}  badgeLabel="conversao"     color="#8B5CF6" accent spark={<Sparkline data={sparkUsers}   color="#8B5CF6" />} />
          <KpiCard label="Medicos"      value={counts.doctors}      delta={newPeriod.doctors}  period={period} color="#10B981" spark={<Sparkline data={sparkDoctors} color="#10B981" />} />
          <KpiCard label="Diretorio"    value={counts.directory}    badge={counts.directory.toLocaleString("pt-BR")} badgeLabel="cadastros" color="#F59E0B" spark={<Sparkline data={sparkDoctors} color="#F59E0B" />} />
          <KpiCard label="Vinculos"     value={counts.userDoctors}  badge={adoptionRate + "%"} badgeLabel="adocao"        color="#EC4899" spark={<Sparkline data={sparkUsers}   color="#EC4899" />} />
          <KpiCard label="Grupos"       value={counts.groups}       color="#6366F1" spark={<Sparkline data={sparkUsers} color="#6366F1" />} />
          <KpiCard label="Feedbacks"    value={counts.feedback}     delta={newPeriod.feedback} period={period} color="#14B8A6" spark={<Sparkline data={sparkFeedback} color="#14B8A6" />} />
          <KpiCard label="Solicitacoes" value={counts.visits}       delta={newPeriod.visits}   period={period} color="#F97316" spark={<Sparkline data={sparkVisits}  color="#F97316" />} />
        </section>

        {/* MID ROW */}
        <section style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* Visit status donut-like */}
          <div style={{ ...D.card, flex: "0 1 280px", padding: 24 }}>
            <SectionHeader title="Solicitacoes de visita" sub="Status em tempo real" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Pendentes",  value: visitStatus.pending,  color: "#F59E0B" },
                { label: "Aprovadas",  value: visitStatus.approved, color: "#10B981" },
                { label: "Recusadas",  value: visitStatus.rejected, color: "#EF4444" },
              ].map((s) => {
                const pct = totalVisits ? Math.round((s.value / totalVisits) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>{s.label}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#F9FAFB" }}>{s.value}</span>
                        <span style={{ fontSize: 11, color: "#4B5563" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "#1F2937", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: s.color, borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid #1F2937", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#4B5563" }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#F9FAFB" }}>{totalVisits}</span>
              </div>
            </div>
          </div>

          {/* Health */}
          <div style={{ ...D.card, flex: "1 1 360px", padding: 24 }}>
            <SectionHeader title="Saude do produto" sub="Indicadores de adocao e uso" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <HealthTile label="Conversao premium" value={premiumRate + "%"}   desc="Usuarios com plano premium"    fill={premiumRate}   color="#8B5CF6" />
              <HealthTile label="Adocao de medicos" value={adoptionRate + "%"}  desc="Vinculos sobre base"           fill={adoptionRate}  color="#10B981" />
              <HealthTile label="Base diretorio"    value={counts.directory.toLocaleString("pt-BR")} desc="Medicos pesquisaveis" fill={Math.min(100, Math.round(counts.directory / 10))} color="#F59E0B" />
              <HealthTile label="Interacoes"        value={(counts.feedback + counts.visits).toLocaleString("pt-BR")} desc="Feedbacks + solicitacoes" fill={Math.min(100, counts.feedback + counts.visits)} color="#3B82F6" />
            </div>
          </div>

          {/* Period trend bars */}
          <div style={{ ...D.card, flex: "0 1 260px", padding: 24 }}>
            <SectionHeader title={"Novos em " + period} sub="Comparativo por categoria" />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { label: "Usuarios",  value: newPeriod.users,    color: "#3B82F6" },
                { label: "Medicos",   value: newPeriod.doctors,  color: "#10B981" },
                { label: "Visitas",   value: newPeriod.visits,   color: "#F97316" },
                { label: "Feedbacks", value: newPeriod.feedback, color: "#14B8A6" },
              ].map((item) => {
                const max = Math.max(newPeriod.users, newPeriod.doctors, newPeriod.visits, newPeriod.feedback, 1);
                return (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#F9FAFB" }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "#1F2937", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: Math.round((item.value / max) * 100) + "%", background: item.color, borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section>
          <SectionHeader title="Atividade recente" sub="Ultimos registros por categoria" />
          <div style={D.tableGrid}>

            <ActivityTable title="Usuarios recentes" count={recentUsers.length}>
              {recentUsers.length === 0 ? <EmptyRow /> : recentUsers.map((u) => (
                <ActivityRow
                  key={u.id}
                  primary={u.user_id.slice(0, 16) + "..."}
                  secondary={"Plano: " + (u.plan ?? "-") + "  |  " + (u.role ?? "-")}
                  time={timeAgo(u.created_at)}
                  tag={u.plan === "premium" ? { label: "premium", color: "#8B5CF6" } : undefined}
                />
              ))}
            </ActivityTable>

            <ActivityTable title="Medicos recentes" count={recentDoctors.length}>
              {recentDoctors.length === 0 ? <EmptyRow /> : recentDoctors.map((d, i) => (
                <ActivityRow
                  key={(d.name ?? "") + i}
                  primary={d.name ?? "-"}
                  secondary={(d.specialty ?? "-") + "  |  " + (d.city ?? "-") + "/" + (d.uf ?? "-")}
                  time={timeAgo(d.created_at)}
                />
              ))}
            </ActivityTable>

            <ActivityTable title="Feedbacks recentes" count={recentFeedback.length}>
              {recentFeedback.length === 0 ? <EmptyRow /> : recentFeedback.map((f) => (
                <FeedbackRow
                  key={f.id}
                  item={f}
                  expanded={expandedFeedback === f.id}
                  onToggle={() => setExpandedFeedback(expandedFeedback === f.id ? null : f.id)}
                />
              ))}
            </ActivityTable>

            <ActivityTable title="Solicitacoes de visita" count={recentVisits.length}>
              {recentVisits.length === 0 ? <EmptyRow /> : recentVisits.map((v) => (
                <ActivityRow
                  key={v.id}
                  primary={v.name ?? "-"}
                  secondary={(v.specialty ?? "-") + "  |  " + (v.city ?? "-") + "/" + (v.uf ?? "-")}
                  time={timeAgo(v.created_at)}
                  tag={v.status ? { label: v.status, color: statusColor(v.status) } : undefined}
                />
              ))}
            </ActivityTable>

          </div>
        </section>

      </div>
    </main>
  );
}

function statusColor(s: string) {
  if (s === "aprovado" || s === "approved") return "#10B981";
  if (s === "pendente" || s === "pending") return "#F59E0B";
  if (s === "recusado" || s === "rejected") return "#EF4444";
  return "#6B7280";
}

function KpiCard({
  label, value, delta, period, badge, badgeLabel, color, accent, spark,
}: {
  label: string; value: number; delta?: number; period?: Period;
  badge?: string; badgeLabel?: string; color: string; accent?: boolean;
  spark?: React.ReactNode;
}) {
  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, " + color + "22 0%, " + color + "08 100%)" : "#111827",
      border: "1px solid " + (accent ? color + "40" : "#1F2937"),
      borderLeft: "3px solid " + color,
      borderRadius: 16,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ opacity: 0.7 }}>{spark}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#F9FAFB", lineHeight: 1, margin: "10px 0 10px" }}>
        {value.toLocaleString("pt-BR")}
      </div>
      {badge ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: color + "20", border: "1px solid " + color + "40", borderRadius: 999, padding: "3px 10px" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{badge}</span>
          {badgeLabel && <span style={{ fontSize: 11, color: "#6B7280" }}>{badgeLabel}</span>}
        </div>
      ) : delta !== undefined ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: delta > 0 ? "#10B981" : "#6B7280" }}>
            {delta > 0 ? "+" + delta : String(delta)}
          </span>
          <span style={{ fontSize: 12, color: "#4B5563" }}>{"novos / " + (period ?? "7d")}</span>
        </div>
      ) : (
        <span style={{ fontSize: 12, color: "#4B5563" }}>{badgeLabel ?? ""}</span>
      )}
    </div>
  );
}

function HealthTile({ label, value, desc, fill, color }: {
  label: string; value: string; desc: string; fill: number; color: string;
}) {
  const pct = Math.min(100, Math.max(0, fill));
  return (
    <div style={{ padding: "16px 18px", background: "#0D1117", borderRadius: 14, border: "1px solid #1F2937" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 10 }}>{value}</div>
      <div style={{ height: 5, borderRadius: 999, background: "#1F2937", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "#4B5563" }}>{desc}</div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#F9FAFB", margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: "#4B5563", margin: "3px 0 0" }}>{sub}</p>
    </div>
  );
}

function ActivityTable({ title, count, children }: {
  title: string; count: number; children: React.ReactNode;
}) {
  return (
    <div style={{ ...D.card, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 11, color: "#4B5563", background: "#1F2937", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{count}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ActivityRow({ primary, secondary, time, tag }: {
  primary: string; secondary: string; time: string;
  tag?: { label: string; color: string };
}) {
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{primary}</div>
        <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{secondary}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#374151" }}>{time}</span>
        {tag && (
          <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.color + "20", border: "1px solid " + tag.color + "40", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tag.label}
          </span>
        )}
      </div>
    </div>
  );
}

function FeedbackRow({ item, expanded, onToggle }: {
  item: FeedbackRow; expanded: boolean; onToggle: () => void;
}) {
  return (
    <div
      style={{ padding: "10px 0", borderTop: "1px solid #1F2937", cursor: "pointer" }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", display: "flex", alignItems: "center", gap: 6 }}>
            {item.user_name ?? "-"}
            <span style={{ fontSize: 10, color: "#4B5563" }}>{expanded ? "Fechar" : "Ver mensagem"}</span>
          </div>
          <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>{item.user_email ?? "-"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>{timeAgo(item.created_at)}</span>
          {item.tipo && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#14B8A6", background: "#14B8A620", border: "1px solid #14B8A640", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {item.tipo}
            </span>
          )}
        </div>
      </div>
      {expanded && item.mensagem && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#0D1117", borderRadius: 10, border: "1px solid #1F2937", fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
          {item.mensagem}
        </div>
      )}
    </div>
  );
}

function EmptyRow() {
  return <div style={{ fontSize: 13, color: "#374151", paddingTop: 12 }}>Nenhum registro encontrado.</div>;
}

const D: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0D1117",
    padding: "24px 20px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#F9FAFB",
  },
  wrap: {
    maxWidth: 1320,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "#111827",
    border: "1px solid #1F2937",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  header: {
    background: "#111827",
    border: "1px solid #1F2937",
    borderRadius: 18,
    padding: "22px 28px",
  },
  headerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 999,
    padding: "4px 11px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#34D399",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10B981",
    boxShadow: "0 0 6px #10B981",
    display: "inline-block",
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#F9FAFB",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    margin: 0,
  },
  periodBar: {
    display: "flex",
    background: "#0D1117",
    border: "1px solid #1F2937",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    background: "transparent",
    color: "#6B7280",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  periodBtnActive: {
    background: "#1F2937",
    color: "#F9FAFB",
  },
  btnGhost: {
    background: "#1F2937",
    color: "#9CA3AF",
    border: "1px solid #374151",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "inherit",
  },
  btnPrimary: {
    background: "#10B981",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  error: {
    background: "#1F0A0A",
    border: "1px solid #7F1D1D",
    color: "#FCA5A5",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 14,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 14,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #1F2937",
    borderTopColor: "#10B981",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

const kf = `@keyframes spin { to { transform: rotate(360deg); } }`;