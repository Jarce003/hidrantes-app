import { divIcon } from "leaflet";
import type { TipoHidrante } from "@/types/hidrantes";

const dibujo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8v12H8zM7 20h10M7 8h10M8 5a4 4 0 0 1 8 0v1H8zM8 11H4v5h4M16 11h4v5h-4M12 10v7"/></svg>';

function crearIcono(tipo: TipoHidrante, borrador = false) {
  return divIcon({
    className: "hydrant-marker" + (borrador ? " hydrant-marker--draft" : ""),
    html: '<div class="hydrant-pin hydrant-pin--' + tipo + '">' + dibujo + "</div>",
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  });
}

export const iconosHidrantes = { primario: crearIcono("primario"), secundario: crearIcono("secundario") };
export const iconosBorrador = { primario: crearIcono("primario", true), secundario: crearIcono("secundario", true) };
