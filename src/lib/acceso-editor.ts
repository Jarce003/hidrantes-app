import { obtenerClienteEditor } from "@/lib/supabase/editor";
import type { AccesoEditor } from "@/types/edicion";
import { CORREO_EDITOR } from "@/lib/cuenta-editor";

export async function comprobarAccesoEditor(signal?: AbortSignal): Promise<AccesoEditor> {
  const supabase = obtenerClienteEditor();
  const { data: identidad, error: errorIdentidad } = await supabase.auth.getUser();
  if (errorIdentidad) {
    if (errorIdentidad.name === "AuthSessionMissingError" || errorIdentidad.status === 401) {
      return { estado: "anonimo" };
    }
    throw new Error("No pudimos comprobar la sesión. Revisá la conexión y reintentá.");
  }
  if (!identidad.user) return { estado: "anonimo" };
  if (identidad.user.email?.toLowerCase() !== CORREO_EDITOR) {
    return { estado: "denegado", usuario: identidad.user };
  }
  let consulta = supabase.from("editores").select("usuario_id,activo").eq("usuario_id", identidad.user.id);
  if (signal) consulta = consulta.abortSignal(signal);
  const { data: editor, error } = await consulta.maybeSingle();
  if (error) throw new Error("No pudimos verificar los permisos de ingreso.");
  if (signal?.aborted) throw new Error("La verificación fue cancelada.");
  return editor?.activo === true
    ? { estado: "autorizado", usuario: identidad.user }
    : { estado: "denegado", usuario: identidad.user };
}

export async function exigirEditorActivo(): Promise<void> {
  const acceso = await comprobarAccesoEditor();
  if (acceso.estado !== "autorizado") {
    throw new Error("Tu sesión o permiso de ingreso ya no está activo. Volvé a iniciar sesión.");
  }
}

export async function cerrarSesionEditor(): Promise<void> {
  const { error } = await obtenerClienteEditor().auth.signOut({ scope: "local" });
  if (error) throw new Error("No pudimos cerrar la sesión. Reintentá.");
}
