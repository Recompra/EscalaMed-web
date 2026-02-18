import { createClient } from "@supabase/supabase-js";

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  clinic: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
  crm: string | null;
  crm_uf: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("doctors")
    .select("id,name,specialty,phone,clinic,address,city,uf,crm,crm_uf")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Ficha do Médico</h1>
        <p>ID: {id}</p>
        <p style={{ opacity: 0.8 }}>Não encontrado no banco.</p>
      </div>
    );
  }

  const d = data as Doctor;

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 6 }}>{(d.name ?? "").toUpperCase()}</h1>

      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        {(d.specialty ?? "-").toUpperCase()}
        {d.phone ? ` • ${d.phone}` : ""}
      </div>

      <div style={{ marginBottom: 10, opacity: 0.9 }}>
        <strong>CRM:</strong> {d.crm ?? "-"} / {(d.crm_uf ?? "-").toUpperCase()}
      </div>

      <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
        <div>
          <strong>Clínica:</strong> {d.clinic ?? "-"}
        </div>
        <div>
          <strong>Endereço:</strong> {d.address ?? "-"}
        </div>
        <div>
          <strong>Cidade/UF:</strong> {(d.city ?? "-").toUpperCase()} /{" "}
          {(d.uf ?? "-").toUpperCase()}
        </div>
      </div>

      <div style={{ marginTop: 18, opacity: 0.6, fontSize: 12 }}>
        ID: {d.id}
      </div>
    </div>
  );
}