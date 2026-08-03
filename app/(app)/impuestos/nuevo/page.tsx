import { redirect } from "next/navigation";
import { ImpuestoForm } from "@/components/ImpuestoForm";
import { getHogarIdDelUsuario } from "@/lib/hogar";

export default async function NuevoImpuestoPage() {
  const hogarId = await getHogarIdDelUsuario();

  if (!hogarId) {
    redirect("/registro");
  }

  return (
    <div>
      <div className="border-b border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Nuevo impuesto</h2>
        <p className="text-sm text-zinc-500">
          Completá los datos y adjuntá el comprobante si lo tenés.
        </p>
      </div>
      <ImpuestoForm hogarId={hogarId} />
    </div>
  );
}
