"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, InputField, SelectField } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import type { EstadoImpuesto, Impuesto } from "@/types/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function parseFechaValue(value: string | null | undefined) {
  if (!value) return { dia: "", mes: "", anio: "" };

  const [anio, mes, dia] = value.split("-");
  return { dia: dia ?? "", mes: mes ?? "", anio: anio ?? "" };
}

function buildIsoDate(dia: string, mes: string, anio: string): string {
  if (!dia || !mes || !anio) return "";

  return `${anio.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function isValidDateParts(dia: string, mes: string, anio: string): boolean {
  if (!dia || !mes || !anio) return false;

  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));

  return (
    fecha.getFullYear() === Number(anio) &&
    fecha.getMonth() === Number(mes) - 1 &&
    fecha.getDate() === Number(dia)
  );
}

interface ImpuestoFormProps {
  hogarId: string;
  impuesto?: Impuesto | null;
}

export function ImpuestoForm({ hogarId, impuesto: impuestoProp }: ImpuestoFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(impuestoProp?.nombre ?? "");
  const [monto, setMonto] = useState(
    impuestoProp?.monto != null ? String(impuestoProp.monto) : ""
  );
  const [cuotasTotales, setCuotasTotales] = useState(
    impuestoProp?.cuotas_totales != null ? String(impuestoProp.cuotas_totales) : ""
  );
  const [cuotaActual, setCuotaActual] = useState(
    impuestoProp?.cuota_actual != null ? String(impuestoProp.cuota_actual) : ""
  );
  const { dia: initialDia, mes: initialMes, anio: initialAnio } = parseFechaValue(
    impuestoProp?.fecha_vencimiento ?? ""
  );
  const [fechaDia, setFechaDia] = useState(initialDia);
  const [fechaMes, setFechaMes] = useState(initialMes);
  const [fechaAnio, setFechaAnio] = useState(initialAnio);
  const [estado, setEstado] = useState<EstadoImpuesto>(
    impuestoProp?.estado ?? "pendiente"
  );
  const [archivo, setArchivo] = useState<File | null>(null);
  const [removerArchivo, setRemoverArchivo] = useState(false);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [archivoHref, setArchivoHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres.";
    }

    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      errors.monto = "Ingresá un monto mayor a 0.";
    }

    const cuotasTotalesNum = cuotasTotales ? parseInt(cuotasTotales, 10) : null;
    const cuotaActualNum = cuotaActual ? parseInt(cuotaActual, 10) : null;

    if (cuotasTotales && (Number.isNaN(cuotasTotalesNum) || (cuotasTotalesNum ?? 0) <= 0)) {
      errors.cuotasTotales = "Ingresá una cantidad válida de cuotas.";
    }

    if (cuotaActual && (Number.isNaN(cuotaActualNum) || (cuotaActualNum ?? 0) <= 0)) {
      errors.cuotaActual = "Ingresá una cuota válida.";
    }

    if (cuotasTotalesNum != null && cuotaActualNum != null && cuotaActualNum > cuotasTotalesNum) {
      errors.cuotaActual = "La cuota actual no puede ser mayor que el total de cuotas.";
    }

    const fechaVencimientoIso = buildIsoDate(fechaDia, fechaMes, fechaAnio);

    if (fechaDia || fechaMes || fechaAnio) {
      if (!fechaVencimientoIso || !isValidDateParts(fechaDia, fechaMes, fechaAnio)) {
        errors.fechaVencimiento = "Ingresá una fecha válida en formato DD/MM/AAAA.";
      }
    }

    if (archivo) {
      if (!ALLOWED_TYPES.includes(archivo.type)) {
        errors.archivo = "Formato no permitido. Usá PDF, JPG, PNG o WEBP.";
      } else if (archivo.size > MAX_FILE_SIZE) {
        errors.archivo = "El archivo no puede superar 10 MB.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  useEffect(() => {
    let isActive = true;

    async function loadArchivoHref() {
      if (!impuestoProp?.archivo_url) {
        setArchivoHref(null);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("impuestos-archivos")
        .createSignedUrl(impuestoProp.archivo_url, 60 * 60);

      if (!isActive) return;

      if (!error && data?.signedUrl) {
        setArchivoHref(data.signedUrl);
      } else {
        setArchivoHref(null);
      }
    }

    loadArchivoHref();

    return () => {
      isActive = false;
    };
  }, [impuestoProp?.archivo_url]);

  function handleFileChange(file: File | null) {
    setArchivo(file);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.archivo;
      return next;
    });
  }

  async function handleRemoveExistingAttachment() {
    if (!impuestoProp?.archivo_url) return;

    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este comprobante?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error: storageError } = await supabase.storage
        .from("impuestos-archivos")
        .remove([impuestoProp.archivo_url]);

      if (storageError) {
        throw new Error("No se pudo eliminar el archivo del storage.");
      }

      const { error: updateError } = await supabase
        .from("impuestos")
        .update({ archivo_url: null, archivo_nombre: null })
        .eq("id", impuestoProp.id);

      if (updateError) {
        throw new Error("No se pudo actualizar el impuesto.");
      }

      setRemoverArchivo(true);
      setConfirmarEliminacion(false);
      setArchivoHref(null);
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el comprobante.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    const fechaVencimientoIso = buildIsoDate(fechaDia, fechaMes, fechaAnio);
    const cuotasTotalesNum = cuotasTotales ? parseInt(cuotasTotales, 10) : null;
    const cuotaActualNum = cuotaActual ? parseInt(cuotaActual, 10) : null;

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada. Volvé a iniciar sesión.");
      setLoading(false);
      return;
    }

    // Si viene `impuestoProp`, estamos en modo edición: hacemos UPDATE
    if (impuestoProp) {
      const baseUpdate = {
        nombre: nombre.trim(),
        monto: parseFloat(monto),
        cuotas_totales: cuotasTotalesNum ?? null,
        cuota_actual: cuotaActualNum ?? null,
        fecha_vencimiento: fechaVencimientoIso || null,
        estado,
      };

      const { error: updateError } = await supabase
        .from("impuestos")
        .update(baseUpdate)
        .eq("id", impuestoProp.id);

      if (updateError) {
        const needsEmojiFallback =
          updateError.message?.includes("emoji") &&
          updateError.message?.includes("schema cache");

        if (needsEmojiFallback) {
          const { error: fallbackError } = await supabase
            .from("impuestos")
            .update(baseUpdate)
            .eq("id", impuestoProp.id);

          if (fallbackError) {
            setError("No se pudo actualizar el impuesto.");
            setLoading(false);
            return;
          }
        } else {
          setError("No se pudo actualizar el impuesto.");
          setLoading(false);
          return;
        }
      }

      const shouldRemoveAttachment = removerArchivo && Boolean(impuestoProp.archivo_url);
      const shouldUploadAttachment = Boolean(archivo);

      if (shouldRemoveAttachment) {
        await supabase.storage.from("impuestos-archivos").remove([impuestoProp.archivo_url!]);

        if (!shouldUploadAttachment) {
          const { error: clearError } = await supabase
            .from("impuestos")
            .update({ archivo_url: null, archivo_nombre: null })
            .eq("id", impuestoProp.id);

          if (clearError) {
            setError("No se pudo quitar el comprobante.");
            setLoading(false);
            return;
          }
        }
      }

      if (shouldUploadAttachment) {
        const extension = archivo!.name.split(".").pop() ?? "bin";
        const storagePath = `${hogarId}/${impuestoProp.id}/comprobante.${extension}`;

        if (impuestoProp.archivo_url && impuestoProp.archivo_url !== storagePath) {
          const oldExt = impuestoProp.archivo_url.split(".").pop() ?? "";
          if (oldExt !== extension) {
            await supabase.storage.from("impuestos-archivos").remove([impuestoProp.archivo_url]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("impuestos-archivos")
          .upload(storagePath, archivo!, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          setError("Error al subir el archivo. Intentá de nuevo.");
          setLoading(false);
          return;
        }

        const { error: bindError } = await supabase
          .from("impuestos")
          .update({ archivo_url: storagePath, archivo_nombre: archivo!.name })
          .eq("id", impuestoProp.id);

        if (bindError) {
          setError("El impuesto se actualizó pero no se pudo vincular el archivo.");
          setLoading(false);
          return;
        }
      }

      router.push("/");
      router.refresh();
      return;
    }

    // Modo creación (sin impuestoProp)
    const baseInsert = {
      hogar_id: hogarId,
      nombre: nombre.trim(),
      monto: parseFloat(monto),
      cuotas_totales: cuotasTotalesNum ?? null,
      cuota_actual: cuotaActualNum ?? null,
      fecha_vencimiento: fechaVencimientoIso || null,
      estado,
      creado_por: user.id,
    };

    const { data: impuesto, error: insertError } = await supabase
      .from("impuestos")
      .insert(baseInsert)
      .select("id")
      .single();

    if (insertError || !impuesto) {
      const needsEmojiFallback =
        insertError?.message?.includes("emoji") &&
        insertError.message?.includes("schema cache");

      if (needsEmojiFallback) {
        const { data: fallbackImpuesto, error: fallbackError } = await supabase
          .from("impuestos")
          .insert(baseInsert)
          .select("id")
          .single();

        if (fallbackError || !fallbackImpuesto) {
          setError(fallbackError?.message ?? "No se pudo guardar el impuesto.");
          setLoading(false);
          return;
        }

        const impuestoGuardado = fallbackImpuesto;
        if (archivo) {
          const extension = archivo.name.split(".").pop() ?? "bin";
          const storagePath = `${hogarId}/${impuestoGuardado.id}/${Date.now()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("impuestos-archivos")
            .upload(storagePath, archivo, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            await supabase.from("impuestos").delete().eq("id", impuestoGuardado.id);
            setError("Error al subir el archivo. Intentá de nuevo.");
            setLoading(false);
            return;
          }

          const { error: updateError2 } = await supabase
            .from("impuestos")
            .update({
              archivo_url: storagePath,
              archivo_nombre: archivo.name,
            })
            .eq("id", impuestoGuardado.id);

          if (updateError2) {
            setError("El impuesto se guardó pero no se pudo vincular el archivo.");
            setLoading(false);
            return;
          }
        }

        router.push("/?creado=1");
        router.refresh();
        return;
      }

      setError(insertError?.message ?? "No se pudo guardar el impuesto.");
      setLoading(false);
      return;
    }

    if (archivo) {
      const extension = archivo.name.split(".").pop() ?? "bin";
      const storagePath = `${hogarId}/${impuesto.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("impuestos-archivos")
        .upload(storagePath, archivo, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        await supabase.from("impuestos").delete().eq("id", impuesto.id);
        setError("Error al subir el archivo. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      const { error: updateError2 } = await supabase
        .from("impuestos")
        .update({
          archivo_url: storagePath,
          archivo_nombre: archivo.name,
        })
        .eq("id", impuesto.id);

      if (updateError2) {
        setError("El impuesto se guardó pero no se pudo vincular el archivo.");
        setLoading(false);
        return;
      }
    }

    router.push("/?creado=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pb-28">
      <InputField
        label="Nombre del impuesto"
        type="text"
        placeholder="Ej: ABL, Expensas, Patente"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={fieldErrors.nombre}
      />

      <InputField
        label="Monto"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        error={fieldErrors.monto}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Cuotas</span>
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Total"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Ej: 6"
              value={cuotasTotales}
              onChange={(e) => setCuotasTotales(e.target.value)}
              error={fieldErrors.cuotasTotales}
            />
            <InputField
              label="Cuota actual"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Ej: 2"
              value={cuotaActual}
              onChange={(e) => setCuotaActual(e.target.value)}
              error={fieldErrors.cuotaActual}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Útil para obligaciones con tarjeta de crédito.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">
            Fecha de vencimiento (opcional)
          </span>
        <div className="grid grid-cols-3 gap-2">
          <SelectField
            label="Día"
            value={fechaDia}
            onChange={(e) => setFechaDia(e.target.value)}
          >
            <option value="">Día</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={String(day)}>
                {String(day).padStart(2, "0")}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Mes"
            value={fechaMes}
            onChange={(e) => setFechaMes(e.target.value)}
          >
            <option value="">Mes</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={String(month)}>
                {String(month).padStart(2, "0")}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Año"
            value={fechaAnio}
            onChange={(e) => setFechaAnio(e.target.value)}
          >
            <option value="">Año</option>
            {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() + index).map(
              (year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              )
            )}
          </SelectField>
        </div>
        {fieldErrors.fechaVencimiento ? (
          <span className="text-sm text-red-600">{fieldErrors.fechaVencimiento}</span>
        ) : null}
        </div>
      </div>

      <SelectField
        label="Estado"
        value={estado}
        onChange={(e) => setEstado(e.target.value as EstadoImpuesto)}
      >
        <option value="pendiente">Pendiente</option>
        <option value="pagado">Pagado</option>
      </SelectField>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">
          Comprobante (PDF o foto)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {!impuestoProp?.archivo_url ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-4 text-sm text-zinc-600"
          >
            {archivo ? "Cambiar archivo" : "Seleccionar PDF o foto"}
          </button>
        ) : null}
        {archivo ? (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
            <span>{archivo.type === "application/pdf" ? "📄" : "🖼️"}</span>
            <span className="truncate">{archivo.name}</span>
          </div>
        ) : null}
        {impuestoProp?.archivo_url ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-700">Comprobante actual</p>
                <p className="truncate text-sm text-zinc-600">{impuestoProp.archivo_nombre ?? "Archivo adjunto"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-700"
                  aria-label="Cambiar comprobante actual"
                >
                  ✎
                </button>
                <a
                  href={archivoHref ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    if (!archivoHref) {
                      event.preventDefault();
                    }
                  }}
                  className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-700"
                  aria-label="Abrir comprobante actual"
                >
                  ↗
                </a>
                <button
                  type="button"
                  onClick={handleRemoveExistingAttachment}
                  className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700"
                  aria-label="Quitar comprobante actual"
                >
                  ×
                </button>
              </div>
            </div>
            {removerArchivo ? (
              <p className="mt-2 text-xs text-rose-600">
                El comprobante se eliminó correctamente.
              </p>
            ) : null}
          </div>
        ) : null}
        {fieldErrors.archivo ? (
          <span className="text-sm text-red-600">{fieldErrors.archivo}</span>
        ) : null}
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="fixed bottom-16 left-1/2 z-20 w-full max-w-lg -translate-x-1/2 px-4">
        <Button type="submit" disabled={loading} className="w-full shadow-lg">
          {loading ? "Guardando..." : impuestoProp ? "Guardar cambios" : "Guardar impuesto"}
        </Button>
      </div>
    </form>
  );
}
