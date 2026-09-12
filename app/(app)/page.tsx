import Link from "next/link";
import { redirect } from "next/navigation";
import { CodigoInvitacion } from "@/components/CodigoInvitacion";
import { ImpuestoList } from "@/components/ImpuestoList";
import { Alert } from "@/components/ui/form";
import { getHogarDelUsuario } from "@/lib/hogar";
import { createClient } from "@/lib/supabase/server";
import type { Impuesto } from "@/types/database";
import { formatMonto } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>;
}) {
  const params = await searchParams;
  const hogarData = await getHogarDelUsuario();

  if (!hogarData) {
    redirect("/registro");
  }

  const supabase = await createClient();
  const { data: impuestos } = await supabase
    .from("impuestos")
    .select("*")
    .eq("hogar_id", hogarData.hogar.id)
    .order("fecha_vencimiento", { ascending: true });

  const impuestosConUrl = await Promise.all(
    ((impuestos as Impuesto[]) ?? []).map(async (impuesto) => {
      if (!impuesto.archivo_url) {
        return { ...impuesto, archivoHref: null as string | null };
      }

      const { data, error } = await supabase.storage
        .from("impuestos-archivos")
        .createSignedUrl(impuesto.archivo_url, 60 * 60);

      return {
        ...impuesto,
        archivoHref: error || !data?.signedUrl ? null : data.signedUrl,
      };
    })
  );

  const impuestosPendientes = (impuestos ?? []).filter(
    (impuesto) => impuesto.estado === "pendiente"
  ).length;
  const impuestosPagados = (impuestos ?? []).filter(
    (impuesto) => impuesto.estado === "pagado"
  ).length;
  const montoTotalPendiente = (impuestos ?? [])
    .filter((impuesto) => impuesto.estado === "pendiente")
    .reduce((total, impuesto) => total + Number(impuesto.monto), 0);

  return (
    <div>
      <div className="space-y-4 p-4">
        {params.creado === "1" ? (
          <Alert variant="success">Impuesto guardado correctamente.</Alert>
        ) : null}

        {/* <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-zinc-50 p-5 text-center shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Hogar</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Mejia Guerrero
          </p>
        </div> */}

        {hogarData.rol === "admin" ? (
          <CodigoInvitacion codigo={hogarData.hogar.codigo_invitacion} />
        ) : null}
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-base font-semibold text-zinc-800">
          Impuestos ({impuestos?.length ?? 0})
        </h2>
        <p className="text-sm text-zinc-500">
          {impuestosPendientes} pendientes · {impuestosPagados} pagados
        </p>
      </div>

      <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2">
        <p className="truncate text-sm font-medium text-emerald-800">
          Monto total de impuestos pendientes
        </p>
        <p className="shrink-0 text-base font-bold text-emerald-900">
          {formatMonto(montoTotalPendiente)}
        </p>
      </div>

      <ImpuestoList impuestos={impuestosConUrl} />
    </div>
  );
}
