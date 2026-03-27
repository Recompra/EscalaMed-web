import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const {
    doctorName,
    doctorPhone,
    crmUf,
    existingUf,
    userName,
    userEmail,
    existingDoctorId,
    currentDoctorId,
    isEditing,
  } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // se estiver editando o mesmo registro, não envia e-mail
  if (
    isEditing === true &&
    existingDoctorId &&
    currentDoctorId &&
    existingDoctorId === currentDoctorId
  ) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "same_record_edit",
    });
  }

  // se não houver mudança real de UF, não envia
  if (!crmUf || !existingUf || crmUf === existingUf) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "same_uf",
    });
  }

  const { data: relatedUsers, error: rpcError } = await supabase.rpc(
    "find_users_same_doctor",
    {
      doctor_name: doctorName,
      doctor_phone: doctorPhone,
    }
  );

  if (rpcError) {
    return NextResponse.json(
      { error: rpcError.message },
      { status: 500 }
    );
  }

  if (!relatedUsers || relatedUsers.length === 0) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "no_users_found",
    });
  }

  const recipientEmails =
    relatedUsers
      .map((u: { email: string }) => u.email)
      .filter((email: string) => email && email !== userEmail);

  if (recipientEmails.length === 0) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "no_recipients",
    });
  }

  const { error } = await resend.emails.send({
    from: "EscalaMed <noreply@escalamed.app.br>",
    to: recipientEmails,
    subject: `⚠️ Alerta de Duplicidade — ${doctorName}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #F5F3EE; border-radius: 16px;">
        
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Syne', Arial, sans-serif; color: #1A6B4A; font-size: 24px; margin: 0;">EscalaMed</h1>
          <p style="color: #8A9BB0; font-size: 13px; margin-top: 4px;">Sua escala mais inteligente e segura</p>
        </div>

        <div style="background: #fff; border-radius: 14px; padding: 24px; border: 1px solid rgba(13,17,23,0.08); box-shadow: 0 4px 16px rgba(13,17,23,0.06);">
          
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="background: #FFF3DC; border: 1.5px solid rgba(212,130,10,0.30); border-radius: 10px; padding: 10px 16px;">
              <span style="font-size: 20px;">⚠️</span>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 16px; color: #0D1117; font-family: 'Syne', Arial, sans-serif;">Alerta de Cadastro Duplicado</h2>
              <p style="margin: 4px 0 0; font-size: 12px; color: #8A9BB0;">Um médico já cadastrado foi registrado em nova UF</p>
            </div>
          </div>

          <div style="background: #F5F3EE; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #8A9BB0; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 4px;">Médico</td>
                <td style="font-size: 14px; font-weight: 700; color: #0D1117;">${doctorName}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #8A9BB0; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0 4px;">CRM / UF</td>
                <td style="font-size: 14px; font-weight: 700; color: #0D1117;">${crmUf}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #8A9BB0; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0 4px;">UF já cadastrada</td>
                <td style="font-size: 14px; font-weight: 700; color: #D4820A;">${existingUf}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #8A9BB0; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0 4px;">Cadastrado por</td>
                <td style="font-size: 14px; font-weight: 700; color: #0D1117;">${userName} (${userEmail})</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #4A5568; line-height: 1.6; margin: 0 0 16px;">
            O propagandista optou por prosseguir com o cadastro mesmo após o alerta exibido na plataforma.
            Recomendamos verificar se este é um cadastro legítimo em nova região ou se trata-se de uma duplicidade que requer atenção.
          </p>

          <div style="border-left: 3px solid #1A6B4A; padding-left: 12px; margin-top: 16px;">
            <p style="font-size: 12px; color: #1A6B4A; margin: 0; line-height: 1.6;">
              O EscalaMed está comprometido com a qualidade e integridade das informações da sua base.
              Este alerta faz parte do nosso sistema de monitoramento para garantir que você tenha sempre dados confiáveis e atualizados.
            </p>
          </div>

        </div>

        <p style="text-align: center; font-size: 11px; color: #8A9BB0; margin-top: 24px;">
          EscalaMed · escalamed.app.br<br/>
          Este é um e-mail automático de monitoramento interno.
        </p>

      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}