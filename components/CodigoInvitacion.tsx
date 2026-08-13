"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/form";

export function CodigoInvitacion({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Alert variant="info">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Código de invitación</p>
          <p className="text-xs opacity-80">
            Compartilo con otra persona para llevar las cuentas del hogar juntos.
          </p>
        </div>
        <button
          type="button"
          onClick={copiar}
          className="cursor-pointer rounded-lg bg-white/80 px-3 py-2 font-mono text-sm font-bold tracking-widest"
        >
          {codigo}
        </button>
      </div>
      {copiado ? (
        <p className="mt-2 text-xs font-medium">¡Copiado al portapapeles!</p>
      ) : null}
    </Alert>
  );
}
