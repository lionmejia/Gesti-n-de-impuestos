"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn, diasHastaVencimiento, formatFecha, formatMonto } from "@/lib/utils";
import type { Impuesto } from "@/types/database";
import { deleteImpuesto } from "@/lib/actions/impuestos";

interface ImpuestoListProps {
  impuestos: Array<Impuesto & { archivoHref?: string | null }>;
}

function EstadoBadge({ estado }: { estado: Impuesto["estado"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
        estado === "pagado"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      )}
    >
      {estado}
    </span>
  );
}

type OrdenImpuestos = "vencimiento" | "pendientes" | "pagados";

function compararPorVencimiento(a: Impuesto, b: Impuesto) {
  const fechaA = a.fecha_vencimiento ? Date.parse(a.fecha_vencimiento) : Number.MAX_SAFE_INTEGER;
  const fechaB = b.fecha_vencimiento ? Date.parse(b.fecha_vencimiento) : Number.MAX_SAFE_INTEGER;

  if (!Number.isFinite(fechaA) || !Number.isFinite(fechaB)) {
    return a.nombre.localeCompare(b.nombre);
  }

  if (fechaA !== fechaB) {
    return fechaA - fechaB;
  }

  return a.nombre.localeCompare(b.nombre);
}

function ordenarImpuestos(impuestos: ImpuestoListProps["impuestos"], orden: OrdenImpuestos) {
  const copia = [...impuestos];

  if (orden === "pendientes") {
    return copia.sort((a, b) => {
      const prioridadA = a.estado === "pendiente" ? 0 : 1;
      const prioridadB = b.estado === "pendiente" ? 0 : 1;

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      return compararPorVencimiento(a, b);
    });
  }

  if (orden === "pagados") {
    return copia.sort((a, b) => {
      const prioridadA = a.estado === "pagado" ? 0 : 1;
      const prioridadB = b.estado === "pagado" ? 0 : 1;

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      return compararPorVencimiento(a, b);
    });
  }

  return copia.sort(compararPorVencimiento);
}

export function ImpuestoList({ impuestos }: ImpuestoListProps) {
  const [orden, setOrden] = useState<OrdenImpuestos>("vencimiento");
  const impuestosOrdenados = useMemo(() => ordenarImpuestos(impuestos, orden), [impuestos, orden]);
  if (impuestos.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-lg font-medium text-zinc-800">Sin impuestos aún</p>
        <p className="mt-2 text-sm text-zinc-500">
          Creá el primero con el botón &quot;Nuevo impuesto&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <label className="flex items-center justify-between gap-2 text-sm text-zinc-600">
          <span className="font-medium text-zinc-700">Ordenar por</span>
          <select
            value={orden}
            onChange={(event) => setOrden(event.target.value as OrdenImpuestos)}
            className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700"
          >
            <option value="vencimiento">Vencimiento</option>
            <option value="pendientes">Pendientes primero</option>
            <option value="pagados">Pagados primero</option>
          </select>
        </label>
      </div>

      {impuestosOrdenados.map((impuesto) => {
        const dias = diasHastaVencimiento(impuesto.fecha_vencimiento);
        const proximo =
          impuesto.estado === "pendiente" && dias != null && dias >= 0 && dias <= 7;

        return (
          <article
            key={impuesto.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50",
              proximo ? "border-amber-300" : "border-zinc-200"
            )}
          >
            <Link
              href={`/impuestos/${impuesto.id}/editar`}
              aria-label={`Editar ${impuesto.nombre}`}
              className="absolute inset-0 z-0"
            >
              <span className="sr-only">Editar {impuesto.nombre}</span>
            </Link>

            <div className="pointer-events-none relative z-10 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-zinc-900">{impuesto.nombre}</h3>
                  <p className="mt-0.5 text-base font-bold text-emerald-700">
                    {formatMonto(Number(impuesto.monto))}
                  </p>
                </div>
              </div>
              <div className="pointer-events-auto">
                <EstadoBadge estado={impuesto.estado} />
              </div>
            </div>

            <div className="pointer-events-none relative z-10 mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                <span className="rounded-full bg-zinc-50 px-2 py-0.5">
                  📅 {formatFecha(impuesto.fecha_vencimiento)}
                </span>
                {impuesto.cuotas_totales != null || impuesto.cuota_actual != null ? (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
                    {impuesto.cuotas_totales != null && impuesto.cuota_actual != null
                      ? `Cuota ${impuesto.cuota_actual}/${impuesto.cuotas_totales}`
                      : impuesto.cuotas_totales != null
                        ? `${impuesto.cuotas_totales} cuotas`
                        : `Cuota ${impuesto.cuota_actual}`}
                  </span>
                ) : null}
                {proximo ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                    {dias === 0 ? "Vence hoy" : `En ${dias} día${dias === 1 ? "" : "s"}`}
                  </span>
                ) : null}
                {impuesto.archivoHref ? (
                  <a
                    href={impuesto.archivoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 underline decoration-dotted underline-offset-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {impuesto.archivo_nombre ?? "Abrir comprobante"}
                  </a>
                ) : impuesto.archivo_nombre ? (
                  <span className="pointer-events-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                    {impuesto.archivo_nombre}
                  </span>
                ) : null}
              </div>

              <div className="pointer-events-auto relative z-20 flex items-center gap-2">
                <form action={deleteImpuesto} className="pointer-events-auto">
                  <input type="hidden" name="impuestoId" value={impuesto.id} />
                  <button
                    type="submit"
                    aria-label={`Eliminar ${impuesto.nombre}`}
                    className="pointer-events-auto relative z-20 cursor-pointer rounded-full border border-rose-200 bg-rose-50 p-1.5 text-rose-700 shadow-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      const confirmed = window.confirm(
                        `¿Seguro que querés eliminar el impuesto “${impuesto.nombre}”?`
                      );
                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    🗑️
                  </button>
                </form>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
