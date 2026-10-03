import { obtenerClienteEditor } from "@/lib/supabase/editor";
import { exigirEditorActivo } from "@/lib/acceso-editor";
import { normalizarHidrante } from "@/lib/hidrantes";
import type { DatosHidrante, HidranteEditable } from "@/types/edicion";
import type { Tables } from "@/types/database";

const CAMPOS = "id,latitud,longitud,tipo,gpm,actualizado_en" as const;
type FilaEditable = Pick<Tables<"hidrantes">, "id" | "latitud" | "longitud" | "tipo" | "gpm" | "actualizado_en">;

function normalizarEditable(fila: FilaEditable): HidranteEditable {
  if (!Number.isFinite(Date.parse(fila.actualizado_en))) throw new Error("Se recibió un hidrante con fecha inválida.");
  return { ...normalizarHidrante(fila), actualizado_en: fila.actualizado_en };
}

function mensajeOperacion(error: { code?: string }): string {
  return error.code === "42501" || error.code === "PGRST301"
    ? "Tu sesión o permiso de ingreso ya no está activo. Volvé a iniciar sesión."
    : "No pudimos confirmar la operación. Actualizá el mapa antes de volver a intentarlo.";
}

export async function consultarHidrantesEditor(signal: AbortSignal): Promise<HidranteEditable[]> {
  const supabase = obtenerClienteEditor();
  const resultados: HidranteEditable[] = [];
  let desde = 0;
  while (true) {
    const { data, error } = await supabase.from("hidrantes").select(CAMPOS)
      .order("id", { ascending: true }).range(desde, desde + 499).abortSignal(signal);
    if (error) throw new Error("No pudimos consultar los hidrantes. Revisá la conexión.");
    if (signal.aborted) throw new Error("La consulta fue cancelada.");
    const pagina = data ?? [];
    resultados.push(...pagina.map(normalizarEditable));
    if (pagina.length === 0) return resultados;
    desde += pagina.length;
  }
}

export async function guardarHidrante(datos: DatosHidrante, original: HidranteEditable | null): Promise<HidranteEditable> {
  await exigirEditorActivo();
  const supabase = obtenerClienteEditor();
  // Escribir solamente los campos que permiten los grants de la base.
  const valores = { latitud: datos.latitud, longitud: datos.longitud, tipo: datos.tipo, gpm: datos.gpm };
  const consulta = original
    ? supabase.from("hidrantes").update(valores).eq("id", original.id).eq("actualizado_en", original.actualizado_en)
    : supabase.from("hidrantes").insert(valores);
  const { data, error } = await consulta.select(CAMPOS).maybeSingle();
  if (error) throw new Error(mensajeOperacion(error));
  if (!data) throw new Error("El hidrante cambió o ya no está disponible para editar. Actualizá el mapa.");
  return normalizarEditable(data);
}

export async function eliminarHidrante(original: HidranteEditable): Promise<void> {
  await exigirEditorActivo();
  const { data, error } = await obtenerClienteEditor().from("hidrantes").delete()
    .eq("id", original.id).eq("actualizado_en", original.actualizado_en).select("id").maybeSingle();
  if (error) throw new Error(mensajeOperacion(error));
  if (!data) throw new Error("El hidrante cambió o ya no está disponible para eliminar. Actualizá el mapa.");
}
