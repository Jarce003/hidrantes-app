import type { Hidrante, TipoHidrante } from "@/types/hidrantes";
import type { User } from "@supabase/supabase-js";

export type HidranteEditable = Hidrante & { actualizado_en: string };
export type DatosHidrante = Pick<Hidrante, "latitud" | "longitud" | "tipo" | "gpm">;
export type FormularioHidrante = {
  original: HidranteEditable | null;
  tipo: TipoHidrante;
  gpm: string;
  latitud: string;
  longitud: string;
};
export type PosicionMapa = { latitud: number; longitud: number };
export type VistaEditor = {
  numero: number;
  destino: "hidrantes" | PosicionMapa;
};
export type AccesoEditor =
  | { estado: "comprobando" }
  | { estado: "anonimo" }
  | { estado: "autorizado"; usuario: User }
  | { estado: "denegado"; usuario: User }
  | { estado: "error"; mensaje: string };
