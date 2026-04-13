import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

const PLAN_IDS: Record<string, string> = {
  mensal:    process.env.MP_PLAN_ID_MENSAL!,
  semestral: process.env.MP_PLAN_ID_SEMESTRAL!,
  anual:     process.env.MP_PLAN_ID_ANUAL!,
};

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!PLAN_IDS[plan]) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${PLAN_IDS[plan]}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const data = await response.json();
    console.log("MP PLAN RESPONSE:", data);

    if (!response.ok || !data?.init_point) {
      return NextResponse.json(
        { error: "Erro Mercado Pago", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ init_point: data.init_point });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar plano" }, { status: 500 });
  }
}
