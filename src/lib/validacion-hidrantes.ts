import type { DatosHidrante, FormularioHidrante, HidranteEditable, PosicionMapa } from "@/types/edicion";

export function crearFormulario(hidrante?: HidranteEditable): FormularioHidrante {
  return {
    original: hidrante ?? null,
    tipo: hidrante?.tipo ?? "primario",
    gpm: hidrante ? String(hidrante.gpm) : "",
    latitud: hidrante ? String(hidrante.latitud) : "",
    longitud: hidrante ? String(hidrante.longitud) : "",
  };
}

function leerNumero(texto: string, campo: string): number {
  const limpio = texto.trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(limpio)) {
    throw new Error("Ingresá un número válido en " + campo + ".");
  }
  const numero = Number(limpio.replace(",", "."));
  if (!Number.isFinite(numero)) throw new Error("Revisá el valor de " + campo + ".");
  return numero;
}

export function obtenerPosicion(formulario: Pick<FormularioHidrante, "latitud" | "longitud">): PosicionMapa | null {
  try {
    const latitud = leerNumero(formulario.latitud, "latitud");
    const longitud = leerNumero(formulario.longitud, "longitud");
    if (Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return null;
    return { latitud, longitud };
  } catch {
    return null;
  }
}

export function validarFormulario(formulario: FormularioHidrante): DatosHidrante {
  const posicion = obtenerPosicion(formulario);
  if (!posicion) throw new Error("Elegí una ubicación válida en el mapa o revisá las coordenadas.");
  if (formulario.tipo !== "primario" && formulario.tipo !== "secundario") {
    throw new Error("Elegí un tipo de hidrante válido.");
  }
  const gpm = leerNumero(formulario.gpm, "GPM");
  if (gpm < 0 || gpm > 99999999.99) {
    throw new Error("El caudal debe estar entre 0 y 99.999.999,99 GPM.");
  }
  if ((formulario.gpm.trim().split(/[.,]/)[1]?.length ?? 0) > 2) {
    throw new Error("El caudal permite hasta dos decimales.");
  }
  return { ...posicion, tipo: formulario.tipo, gpm };
}

export function tieneCambios(formulario: FormularioHidrante): boolean {
  const inicial = crearFormulario(formulario.original ?? undefined);
  return formulario.tipo !== inicial.tipo || formulario.gpm !== inicial.gpm ||
    formulario.latitud !== inicial.latitud || formulario.longitud !== inicial.longitud;
}
