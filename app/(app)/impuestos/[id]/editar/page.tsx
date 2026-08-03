import { redirect } from "next/navigation";
import { ImpuestoForm } from "@/components/ImpuestoForm";
import { getHogarIdDelUsuario } from "@/lib/hogar";
import { createClient } from "@/lib/supabase/server";
import type { Impuesto } from "@/types/database";

type ImpuestoRow = Omit<Impuesto, "monto"> & { monto: string };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarImpuestoPage({ params }: Props) {
  const { id } = await params;
  const hogarId = await getHogarIdDelUsuario();

  if (!hogarId) {
    redirect("/registro");
  }

  const supabase = await createClient();
  const { data: impuesto, error } = await supabase
    .from("impuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !impuesto) {
    redirect("/");
  }

  const impuestoRow = impuesto as ImpuestoRow;

  if (impuestoRow.hogar_id !== hogarId) {
    redirect("/");
  }

  const impuestoConNumero: Impuesto = {
    ...impuestoRow,
    monto: Number(impuestoRow.monto),
  };

  return (
    <div>
      <div className="border-b border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Editar impuesto</h2>
        <p className="text-sm text-zinc-500">Modificá los campos y guardá los cambios.</p>
      </div>
      <ImpuestoForm hogarId={hogarId} impuesto={impuestoConNumero} />
    </div>
  );
}
