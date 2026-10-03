import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let cliente: SupabaseClient<Database> | undefined;

export function obtenerClienteEditor(): SupabaseClient<Database> {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error("Falta la configuración de conexión.");
  cliente = createClient<Database>(url, clave, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "hidrantes-editor-" + new URL(url).hostname.split(".")[0],
    },
  });
  return cliente;
}
