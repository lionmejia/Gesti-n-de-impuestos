"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteImpuesto(formData: FormData) {
  const impuestoId = formData.get("impuestoId")?.toString();
  if (!impuestoId) return;

  const supabase = await createClient();

  const { data: impuesto, error: fetchError } = await supabase
    .from("impuestos")
    .select("archivo_url")
    .eq("id", impuestoId)
    .single();

  if (!fetchError && impuesto?.archivo_url) {
    await supabase.storage.from("impuestos-archivos").remove([impuesto.archivo_url]);
  }

  const { error } = await supabase.from("impuestos").delete().eq("id", impuestoId);

  if (!error) {
    revalidatePath("/");
  }
}
