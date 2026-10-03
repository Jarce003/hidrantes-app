import type { Hidrante, UbicacionUsuario } from "@/types/hidrantes";

const formatoNumero = new Intl.NumberFormat("es-CR", {
  maximumFractionDigits: 2,
});

export function formatearGpm(gpm: number): string {
  return formatoNumero.format(gpm);
}

export function formatearPrecision(metros: number): string {
  return metros >= 1000
    ? formatoNumero.format(Math.round(metros / 100) / 10) + " km"
    : Math.max(1, Math.round(metros)) + " m";
}

export function crearEnlacesNavegacion(hidrante: Pick<Hidrante, "latitud" | "longitud">) {
  const destino = hidrante.latitud + "," + hidrante.longitud;
  const google = new URL("https://www.google.com/maps/dir/");
  google.searchParams.set("api", "1");
  google.searchParams.set("destination", destino);
  google.searchParams.set("travelmode", "driving");
  google.searchParams.set("dir_action", "navigate");

  const waze = new URL("https://waze.com/ul");
  waze.searchParams.set("ll", destino);
  waze.searchParams.set("navigate", "yes");
  waze.searchParams.set("utm_source", "hidrantes_app");

  return { google: google.toString(), waze: waze.toString() };
}

export function obtenerUbicacion(): Promise<UbicacionUsuario> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(new Error("Para usar tu ubicación, abrí el mapa mediante HTTPS."));
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("Este navegador no permite obtener tu ubicación. Podés recorrer el mapa manualmente."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          !Number.isFinite(coords.latitude) ||
          !Number.isFinite(coords.longitude) ||
          !Number.isFinite(coords.accuracy) ||
          Math.abs(coords.latitude) > 90 ||
          Math.abs(coords.longitude) > 180 ||
          coords.accuracy < 0
        ) {
          reject(new Error("No recibimos una ubicación válida. Podés reintentar."));
          return;
        }

        resolve({
          latitud: coords.latitude,
          longitud: coords.longitude,
          precision: coords.accuracy,
        });
      },
      (error) => {
        const mensajes: Record<number, string> = {
          1: "El permiso de ubicación está desactivado. Podés habilitarlo en tu navegador o recorrer el mapa manualmente.",
          2: "No pudimos obtener tu ubicación. Podés reintentar o recorrer el mapa.",
          3: "La ubicación está tardando. Tocá Mi ubicación para reintentar.",
        };
        reject(new Error(mensajes[error.code] ?? "No pudimos obtener tu ubicación."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}
