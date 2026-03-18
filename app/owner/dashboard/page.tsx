"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

type MiniTrend = {
  label: string;
  value: number;
};

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [counts, setCounts] = useState<Counts>({
    users: 0,
    premiumUsers: 0,
    doctors: 0,
    directory: 0,
    userDoctors: 0,
    groups: 0,
    feedback: 0,
    visits: 0,
  });

  const [recentUsers, setRecentUsers] = useState<ProfileRow[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<DoctorRow[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRow[]>([]);
  const [recentVisits, setRecentVisits] = useState<VisitRow[]>([]);

  const [newUsers7d, setNewUsers7d] = useState(0);
  const [newDoctors7d, setNewDoctors7d] = useState(0);
  const [newVisits7d, setNewVisits7d] = useState(0);
  const [newFeedback7d, setNewFeedback7d] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profile?.role !== "owner") {
      setErrorMsg(`Acesso negado. role atual: ${profile?.role ?? "null"}`);
      setLoading(false);
      return;
      }

      if (profile?.role !== "owner") {
        router.push("/");
        return;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const iso7d = sevenDaysAgo.toISOString();

      const [
        profilesRes,
        premiumProfilesRes,
        doctorsRes,
        directoryRes,
        userDoctorsRes,
        groupsRes,
        feedbackRes,
        visitsRes,
        recentUsersRes,
        recentDoctorsRes,
        recentFeedbackRes,
        recentVisitsRes,
        users7dRes,
        doctors7dRes,
        visits7dRes,
        feedback7dRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("plan", "premium"),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase
          .from("doctors_directory")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("user_doctors")
          .select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
        supabase
          .from("visit_requests")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("id,user_id,plan,role,created_at")
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("doctors")
          .select("id,name,city,uf,specialty,created_at")
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("feedback")
          .select("id,user_name,user_email,tipo,mensagem,created_at")
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("visit_requests")
          .select("id,name,city,uf,specialty,status,created_at")
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso7d),

        supabase
          .from("doctors")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso7d),

        supabase
          .from("visit_requests")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso7d),

        supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso7d),
      ]);

      setCounts({
        users: profilesRes.count ?? 0,
        premiumUsers: premiumProfilesRes.count ?? 0,
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

      setNewUsers7d(users7dRes.count ?? 0);
      setNewDoctors7d(doctors7dRes.count ?? 0);
      setNewVisits7d(visits7dRes.count ?? 0);
      setNewFeedback7d(feedback7dRes.count ?? 0);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString?: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR");
  }

  const adoptionRate = useMemo(() => {
    if (!counts.doctors) return 0;
    return Math.round((counts.userDoctors / counts.doctors) * 100);
  }, [counts.doctors, counts.userDoctors]);

  const premiumRate = useMemo(() => {
    if (!counts.users) return 0;
    return Math.round((counts.premiumUsers / counts.users) * 100);
  }, [counts.users, counts.premiumUsers]);

  const compactTrend: MiniTrend[] = [
    { label: "Usuários 7d", value: newUsers7d },
    { label: "Médicos 7d", value: newDoctors7d },
    { label: "Visitas 7d", value: newVisits7d },
    { label: "Feedbacks 7d", value: newFeedback7d },
  ];

  const maxTrend = Math.max(...compactTrend.map((x) => x.value), 1);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(26,107,74,0.10), transparent 28%), #F5F3EE",
    padding: 24,
    fontFamily: "'DM Sans', sans-serif",
    color: "#0D1117",
  };

  const wrapperStyle: React.CSSProperties = {
    maxWidth: 1320,
    margin: "0 auto",
  };

  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(13,17,23,0.08)",
    borderRadius: 20,
    boxShadow: "0 10px 30px rgba(13,17,23,0.06)",
  };

  const headerTitleStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 30,
    margin: 0,
    color: "#0D1117",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    margin: 0,
    color: "#0D1117",
  };

  const softText: React.CSSProperties = {
    color: "#6B7280",
    fontSize: 13,
  };

  const cardGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  };

  const tableGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={wrapperStyle}>
          <div style={{ ...panelStyle, padding: 24 }}>Carregando dashboard...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={wrapperStyle}>
        <div
          style={{
            ...panelStyle,
            padding: 24,
            marginBottom: 18,
            background:
              "linear-gradient(135deg, rgba(13,17,23,1) 0%, rgba(16,29,23,1) 55%, rgba(18,53,36,1) 100%)",
            color: "#fff",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(74,222,128,0.08)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
              position: "relative",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(74,222,128,0.12)",
                  border: "1px solid rgba(74,222,128,0.18)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4ADE80",
                    boxShadow: "0 0 10px #4ADE80",
                  }}
                />
                OWNER DASHBOARD
              </div>

              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 30,
                  margin: 0,
                  color: "#fff",
                }}
              >
                EscalaMed Analytics
              </h1>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.70)",
                }}
              >
                Visão interna do produto, adoção e operação
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={loadDashboard}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                style={{
                  background: "#1A6B4A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 6px 18px rgba(26,107,74,0.35)",
                }}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>

        {errorMsg ? (
          <div
            style={{
              ...panelStyle,
              marginBottom: 18,
              padding: 16,
              color: "#C0392B",
              border: "1px solid rgba(192,57,43,0.18)",
              background: "#FFF0EE",
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        <section style={{ marginBottom: 20 }}>
          <div style={cardGridStyle}>
            <MetricCard
              title="Usuários"
              value={counts.users}
              subtitle={`${newUsers7d} novos em 7 dias`}
            />
            <MetricCard
              title="Premium"
              value={counts.premiumUsers}
              subtitle={`${premiumRate}% da base`}
              accent
            />
            <MetricCard
              title="Médicos"
              value={counts.doctors}
              subtitle={`${newDoctors7d} novos em 7 dias`}
            />
            <MetricCard
              title="Diretório"
              value={counts.directory}
              subtitle="Base geral pesquisável"
            />
            <MetricCard
              title="Vínculos"
              value={counts.userDoctors}
              subtitle={`${adoptionRate}% sobre médicos`}
            />
            <MetricCard
              title="Grupos"
              value={counts.groups}
              subtitle="Organização premium"
            />
            <MetricCard
              title="Feedbacks"
              value={counts.feedback}
              subtitle={`${newFeedback7d} nos últimos 7 dias`}
            />
            <MetricCard
              title="Solicitações"
              value={counts.visits}
              subtitle={`${newVisits7d} nos últimos 7 dias`}
            />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 1.4fr) minmax(260px, 0.9fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ ...panelStyle, padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={sectionTitleStyle}>Saúde do produto</h2>
                <p style={{ ...softText, margin: "6px 0 0" }}>
                  Indicadores principais do momento
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <InsightBox
                label="Conversão premium"
                value={`${premiumRate}%`}
                helper="Percentual da base com plan = premium"
              />
              <InsightBox
                label="Adoção de médicos"
                value={`${adoptionRate}%`}
                helper="Vínculos user_doctors sobre base de doctors"
              />
              <InsightBox
                label="Base do diretório"
                value={`${counts.directory}`}
                helper="Médicos disponíveis para busca"
              />
              <InsightBox
                label="Uso operacional"
                value={`${counts.feedback + counts.visits}`}
                helper="Feedbacks + solicitações de visita"
              />
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 20 }}>
            <h2 style={sectionTitleStyle}>Últimos 7 dias</h2>
            <p style={{ ...softText, margin: "6px 0 16px" }}>
              Resumo rápido de atividade
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              {compactTrend.map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: "#374151", fontWeight: 600 }}>
                      {item.label}
                    </span>
                    <span style={{ color: "#0D1117", fontWeight: 800 }}>
                      {item.value}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 10,
                      borderRadius: 999,
                      background: "#ECEAE3",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(item.value / maxTrend) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg, #1A6B4A 0%, #2E8B62 100%)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={sectionTitleStyle}>Atividade recente</h2>
              <p style={{ ...softText, margin: "6px 0 0" }}>
                Últimos registros úteis para operação
              </p>
            </div>
          </div>

          <div style={tableGridStyle}>
            <DataPanel title="Usuários recentes">
              {recentUsers.length === 0 ? (
                <EmptyState text="Nenhum usuário." />
              ) : (
                recentUsers.map((u) => (
                  <RowItem
                    key={u.id}
                    title={u.user_id}
                    subtitle={`Plano: ${u.plan || "-"} • Role: ${u.role || "-"}`}
                    meta={formatDate(u.created_at)}
                  />
                ))
              )}
            </DataPanel>

            <DataPanel title="Médicos recentes">
              {recentDoctors.length === 0 ? (
                <EmptyState text="Nenhum médico." />
              ) : (
                recentDoctors.map((d, i) => (
                  <RowItem
                    key={`${d.name}-${i}`}
                    title={d.name || "-"}
                    subtitle={`${d.specialty || "-"} • ${d.city || "-"} / ${d.uf || "-"}`}
                    meta={formatDate(d.created_at)}
                  />
                ))
              )}
            </DataPanel>

            <DataPanel title="Feedbacks recentes">
              {recentFeedback.length === 0 ? (
                <EmptyState text="Nenhum feedback." />
              ) : (
                recentFeedback.map((f) => (
                  <RowItem
                    key={f.id}
                    title={f.user_name || "-"}
                    subtitle={`${f.tipo || "-"} • ${f.user_email || "-"}`}
                    meta={formatDate(f.created_at)}
                    body={f.mensagem || "-"}
                  />
                ))
              )}
            </DataPanel>

            <DataPanel title="Solicitações de visita">
              {recentVisits.length === 0 ? (
                <EmptyState text="Nenhuma solicitação." />
              ) : (
                recentVisits.map((v) => (
                  <RowItem
                    key={v.id}
                    title={v.name || "-"}
                    subtitle={`${v.specialty || "-"} • ${v.city || "-"} / ${v.uf || "-"}`}
                    meta={`Status: ${v.status || "-"} • ${formatDate(v.created_at)}`}
                  />
                ))
              )}
            </DataPanel>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent = false,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(26,107,74,0.14), rgba(26,107,74,0.06))"
          : "rgba(255,255,255,0.88)",
        border: accent
          ? "1px solid rgba(26,107,74,0.20)"
          : "1px solid rgba(13,17,23,0.08)",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 24px rgba(13,17,23,0.05)",
      }}
    >
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1,
          color: accent ? "#1A6B4A" : "#0D1117",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 10 }}>
        {subtitle}
      </div>
    </div>
  );
}

function InsightBox({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(13,17,23,0.08)",
        background: "#FAFAF8",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          color: "#0D1117",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{helper}</div>
    </div>
  );
}

function DataPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.88)",
        border: "1px solid rgba(13,17,23,0.08)",
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 10px 30px rgba(13,17,23,0.05)",
      }}
    >
      <h3
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          margin: "0 0 12px",
          color: "#0D1117",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "grid", gap: 2 }}>{children}</div>
    </div>
  );
}

function RowItem({
  title,
  subtitle,
  meta,
  body,
}: {
  title: string;
  subtitle: string;
  meta: string;
  body?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 0",
        borderTop: "1px solid rgba(13,17,23,0.06)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{subtitle}</div>
      {body ? (
        <div style={{ fontSize: 12, color: "#111827", marginTop: 6 }}>{body}</div>
      ) : null}
      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>{meta}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ color: "#6B7280", fontSize: 13 }}>{text}</div>;
}