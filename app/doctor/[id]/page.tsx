"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

type Doctor = {
  doctor_key: string;
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

export default function DoctorPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function loadDoctor() {
      if (!id) return;

      const { data, error } = await supabase
        .from("doctors_directory")
        .select("doctor_key,name,specialty,phone,clinic,address,city,uf,crm,crm_uf")
        .eq("doctor_key", id)
        .single();

      setData(data as Doctor | null);
      setError(error);
      setLoading(false);
    }

    loadDoctor();
  }, [id]);

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
        ID: {d.doctor_key}
      </div>
    </div>
  );
}