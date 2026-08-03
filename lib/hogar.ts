import { createClient } from "@/lib/supabase/server";
import type { Hogar, HogarConMembresia } from "@/types/database";

export async function getHogarDelUsuario(): Promise<HogarConMembresia | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membresia } = await supabase
    .from("hogar_miembros")
    .select("rol, hogares(*)")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!membresia?.hogares) return null;

  const hogar = Array.isArray(membresia.hogares)
    ? membresia.hogares[0]
    : membresia.hogares;

  if (!hogar) return null;

  return {
    hogar: hogar as Hogar,
    rol: membresia.rol,
  };
}

export async function getHogarIdDelUsuario(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mi_hogar_id");
  return data ?? null;
}
