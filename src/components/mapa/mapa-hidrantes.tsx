"use client";

import { useEffect, useRef } from "react";
import { latLngBounds, type LatLngTuple } from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { Icono } from "@/components/mapa/icono";
import { iconosHidrantes } from "@/components/mapa/iconos-hidrantes";
import { crearEnlacesNavegacion, formatearGpm } from "@/lib/mapa-utilidades";
import type {
  Hidrante,
  SolicitudVista,
  UbicacionUsuario,
} from "@/types/hidrantes";

type Props = {
  hidrantes: Hidrante[];
  ubicacion: UbicacionUsuario | null;
  solicitudVista: SolicitudVista;
  versionMapa: number;
  onErrorMapa: () => void;
};

const CENTRO_COSTA_RICA: LatLngTuple = [9.7489, -83.7534];
function CamaraMapa({
  hidrantes,
  ubicacion,
  solicitudVista,
}: Pick<Props, "hidrantes" | "ubicacion" | "solicitudVista">) {
  const mapa = useMap();
  const ultimaUbicacion = useRef<UbicacionUsuario | null>(null);
  const vistaInicialHidrantes = useRef(false);
  const ultimaSolicitud = useRef(0);

  useEffect(() => {
    const animar = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const centrarUbicacion = () => {
      if (!ubicacion) return;
      mapa.flyTo(
        [ubicacion.latitud, ubicacion.longitud],
        ubicacion.precision > 2000 ? 12 : 16,
        { animate: animar, duration: 0.65 },
      );
      ultimaUbicacion.current = ubicacion;
    };

    const mostrarHidrantes = () => {
      if (hidrantes.length === 0) return;
      const posiciones: LatLngTuple[] = hidrantes.map((h) => [h.latitud, h.longitud]);
      mapa.fitBounds(latLngBounds(posiciones), {
        padding: [48, 48],
        maxZoom: 17,
        animate: animar,
      });
      vistaInicialHidrantes.current = true;
    };

    if (solicitudVista.numero !== ultimaSolicitud.current) {
      ultimaSolicitud.current = solicitudVista.numero;
      if (solicitudVista.destino === "ubicacion") centrarUbicacion();
      else mostrarHidrantes();
      return;
    }

    if (ubicacion && ubicacion !== ultimaUbicacion.current) {
      centrarUbicacion();
    } else if (!ubicacion && hidrantes.length > 0 && !vistaInicialHidrantes.current) {
      mostrarHidrantes();
    }
  }, [mapa, hidrantes, ubicacion, solicitudVista]);

  useEffect(() => {
    const contenedor = mapa.getContainer();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(() => mapa.invalidateSize({ pan: false }));
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, [mapa]);

  return null;
}

function FichaHidrante({ hidrante }: { hidrante: Hidrante }) {
  const enlaces = crearEnlacesNavegacion(hidrante);
  const tipo = hidrante.tipo === "primario" ? "Primario" : "Secundario";

  return (
    <article className="hydrant-card" aria-label={"Hidrante " + tipo.toLowerCase()}>
      <div className={"type-badge type-badge--" + hidrante.tipo}>
        <span className={"legend-dot legend-dot--" + hidrante.tipo} />
        Hidrante {tipo.toLowerCase()}
      </div>
      <div className="hydrant-flow">
        <strong>{formatearGpm(hidrante.gpm)}</strong>
        <span>GPM</span>
      </div>
      <div className="flow-caption">Caudal registrado</div>
      <div className="directions-label">Cómo llegar</div>
      <a className="directions-link" href={enlaces.google} target="_blank" rel="noopener noreferrer">
        <span>Google Maps</span>
        <Icono nombre="flecha" />
      </a>
      <a className="directions-link directions-link--waze" href={enlaces.waze} target="_blank" rel="noopener noreferrer">
        <span>Waze</span>
        <Icono nombre="flecha" />
      </a>
    </article>
  );
}

export default function MapaHidrantes({
  hidrantes,
  ubicacion,
  solicitudVista,
  versionMapa,
  onErrorMapa,
}: Props) {
  return (
    <MapContainer
      center={CENTRO_COSTA_RICA}
      zoom={8}
      minZoom={3}
      maxZoom={19}
      zoomControl={false}
      scrollWheelZoom
      preferCanvas
      className="hydrants-leaflet-map"
    >
      <TileLayer
        key={versionMapa}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
        eventHandlers={{ tileerror: onErrorMapa }}
      />
      <CamaraMapa hidrantes={hidrantes} ubicacion={ubicacion} solicitudVista={solicitudVista} />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" metric imperial={false} />

      {hidrantes.map((hidrante) => (
        <Marker
          key={hidrante.id + "-" + hidrante.tipo + "-" + hidrante.gpm}
          position={[hidrante.latitud, hidrante.longitud]}
          icon={iconosHidrantes[hidrante.tipo]}
          title={"Hidrante " + hidrante.tipo + ": " + formatearGpm(hidrante.gpm) + " GPM"}
          alt={"Hidrante " + hidrante.tipo}
          keyboard
        >
          <Popup minWidth={245} maxWidth={300} autoPanPadding={[20, 20]}>
            <FichaHidrante hidrante={hidrante} />
          </Popup>
        </Marker>
      ))}

      {ubicacion ? (
        <>
          <Circle
            center={[ubicacion.latitud, ubicacion.longitud]}
            radius={ubicacion.precision}
            pathOptions={{ color: "#d99a24", weight: 1, fillColor: "#f3b64b", fillOpacity: 0.12 }}
            interactive={false}
          />
          <CircleMarker
            center={[ubicacion.latitud, ubicacion.longitud]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#e8a633", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -9]} className="user-location-label">
              Tu ubicación
            </Tooltip>
          </CircleMarker>
        </>
      ) : null}
    </MapContainer>
  );
}
