export function formatMonto(monto: number, moneda = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}

export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fecha + "T12:00:00"));
}

export function diasHastaVencimiento(fecha: string | null | undefined): number | null {
  if (!fecha) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const vencimiento = new Date(anio, mes - 1, dia);
  vencimiento.setHours(0, 0, 0, 0);

  const diff = vencimiento.getTime() - hoy.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
