import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function resolvePlan(planId: string): string {
  const map: Record<string, string> = {
    [process.env.MP_PLAN_ID_MENSAL!]:    "mensal",
    [process.env.MP_PLAN_ID_SEMESTRAL!]: "semestral",
    [process.env.MP_PLAN_ID_ANUAL!]:     "anual",
  };
  return map[planId] ?? "mensal";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Webhook recebido:", JSON.stringify(body));

  const type = body.type;
  const resourceId = body.data?.id;

  if (!resourceId) return NextResponse.json({ ok: true });

  // ── Evento de assinatura (criação, cancelamento, suspensão) ──────────
  if (type === "subscription_preapproval") {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const sub = await res.json();
    console.log("Assinatura:", JSON.stringify(sub));

    const email = sub.payer_email;
    const status = sub.status; // "authorized" | "cancelled" | "paused"
    const preapprovalId = sub.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      console.warn("Usuário não encontrado para o email:", email);
      return NextResponse.json({ ok: true });
    }

    const userId = profile.user_id;

    if (status === "authorized") {
      await supabase.from("profiles").update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        plan: resolvePlan(sub.preapproval_plan_id),
        mp_subscription_id: preapprovalId,
      }).eq("user_id", userId);

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: resolvePlan(sub.preapproval_plan_id),
        status: "active",
        mp_subscription_id: preapprovalId,
        start_date: new Date().toISOString(),
      }, { onConflict: "mp_subscription_id" });

    } else if (status === "cancelled" || status === "paused") {
      await supabase.from("profiles").update({
        is_premium: false,
        plan: "free",
      }).eq("user_id", userId);

      await supabase.from("subscriptions").update({
        status: status === "cancelled" ? "cancelled" : "suspended",
      }).eq("mp_subscription_id", preapprovalId);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Evento de pagamento individual da assinatura (deduplicação) ──────
  if (type === "payment") {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await mpRes.json();
    console.log("Pagamento:", JSON.stringify(payment));

    if (payment.status === "approved") {
      const { data: existingPayment, error: existingPaymentError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("payment_id", String(resourceId))
        .maybeSingle();

      if (existingPaymentError) {
        console.error("Erro ao verificar payment_id:", existingPaymentError);
        return NextResponse.json({ ok: false }, { status: 500 });
      }

      if (existingPayment) {
        console.log("Pagamento já processado:", resourceId);
        return NextResponse.json({ ok: true });
      }

      await supabase.from("subscriptions").insert({
        payment_id: String(resourceId),
        status: "payment_approved",
        start_date: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
