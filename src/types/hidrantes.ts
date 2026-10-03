import type { Tables } from "@/types/database";

export type TipoHidrante = "primario" | "secundario";
export type HidranteFila = Pick<
  Tables<"hidrantes">,
  "id" | "latitud" | "longitud" | "tipo" | "gpm"
>;
export type Hidrante = Omit<HidranteFila, "tipo"> & { tipo: TipoHidrante };

export type UbicacionUsuario = {
  latitud: number;
  longitud: number;
  precision: number;
};

export type SolicitudVista = {
  numero: number;
  destino: "ubicacion" | "hidrantes";
};
