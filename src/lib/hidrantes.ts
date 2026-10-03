import { obtenerClientePublico } from "@/lib/supabase/publico";
import type { Hidrante, HidranteFila } from "@/types/hidrantes";

export function normalizarHidrante(fila: HidranteFila): Hidrante {
  if (
    !fila.id ||
    (fila.tipo !== "primario" && fila.tipo !== "secundario") ||
    !Number.isFinite(fila.latitud) ||
    !Number.isFinite(fila.longitud) ||
    !Number.isFinite(fila.gpm) ||
    Math.abs(fila.latitud) > 90 ||
    Math.abs(fila.longitud) > 180 ||
    fila.gpm < 0
  ) {
    throw new Error("Se recibio un hidrante con datos invalidos.");
  }

  return { ...fila, tipo: fila.tipo };
}

export async function consultarHidrantes(signal: AbortSignal): Promise<Hidrante[]> {
  const supabase = obtenerClientePublico();
  const hidrantes: Hidrante[] = [];
  const tamanoPagina = 500;
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("hidrantes")
      .select("id,latitud,longitud,tipo,gpm")
      .order("id", { ascending: true })
      .range(desde, desde + tamanoPagina - 1)
      .abortSignal(signal);

    if (error) throw new Error(error.message);
    if (signal.aborted) throw new Error("La consulta fue cancelada.");

    const pagina = data ?? [];
    hidrantes.push(...pagina.map(normalizarHidrante));
    if (pagina.length === 0) return hidrantes;

    // Continuar hasta una pagina vacia tambien admite limites menores del servidor.
    desde += pagina.length;
  }
}
