import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let cliente: SupabaseClient<Database> | undefined;

export function obtenerClientePublico(): SupabaseClient<Database> {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clave) {
    throw new Error("Falta la configuracion publica de Supabase.");
  }

  cliente = createClient<Database>(url, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cliente;
}
