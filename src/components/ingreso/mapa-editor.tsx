"use client";

import { useEffect, useRef } from "react";
import { latLngBounds, type LatLngTuple, type Marker as MarcadorLeaflet } from "leaflet";
import { MapContainer, TileLayer, ZoomControl, ScaleControl, Marker, Tooltip, Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { iconosHidrantes, iconosBorrador } from "@/components/mapa/iconos-hidrantes";
import { formatearGpm } from "@/lib/mapa-utilidades";
import type { HidranteEditable, PosicionMapa, VistaEditor } from "@/types/edicion";
import type { TipoHidrante, UbicacionUsuario } from "@/types/hidrantes";

type Props = {
  hidrantes: HidranteEditable[]; ubicacion: UbicacionUsuario | null; vista: VistaEditor;
  versionMapa: number; borrador: PosicionMapa | null; tipoBorrador: TipoHidrante; idEditado: string | null;
  permitirUbicar: boolean; permitirSeleccionar: boolean;
  onSeleccionar: (hidrante: HidranteEditable) => void; onUbicar: (posicion: PosicionMapa) => void; onErrorMapa: () => void;
};

function InteraccionMapa({ permitirUbicar, onUbicar }: Pick<Props, "permitirUbicar" | "onUbicar">) {
  const mapa = useMapEvents({ click: (evento) => { if (permitirUbicar) onUbicar({ latitud: evento.latlng.lat, longitud: evento.latlng.lng }); } });
  useEffect(() => {
    const contenedor = mapa.getContainer();
    contenedor.classList.toggle("editor-map--placing", permitirUbicar);
    return () => contenedor.classList.remove("editor-map--placing");
  }, [mapa, permitirUbicar]);
  return null;
}

function CamaraEditor({ hidrantes, ubicacion, vista }: Pick<Props, "hidrantes" | "ubicacion" | "vista">) {
  const mapa = useMap();
  const ultimaVista = useRef(0);
  const ultimaUbicacion = useRef<UbicacionUsuario | null>(null);
  const mostroHidrantes = useRef(false);
  useEffect(() => {
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function centrar(posicion: PosicionMapa, zoom = 17) { mapa.flyTo([posicion.latitud, posicion.longitud], zoom, { animate, duration: 0.6 }); }
    function todos() {
      if (!hidrantes.length) return;
      const puntos: LatLngTuple[] = hidrantes.map((h) => [h.latitud, h.longitud]);
      mapa.fitBounds(latLngBounds(puntos), { padding: [45, 45], maxZoom: 17, animate });
      mostroHidrantes.current = true;
    }
    if (vista.numero !== ultimaVista.current) {
      ultimaVista.current = vista.numero;
      ultimaUbicacion.current = ubicacion;
      if (vista.destino === "hidrantes") todos(); else centrar(vista.destino);
    } else if (ubicacion && ubicacion !== ultimaUbicacion.current) {
      centrar(ubicacion, ubicacion.precision > 2000 ? 12 : 16); ultimaUbicacion.current = ubicacion;
    } else if (!ubicacion && !mostroHidrantes.current && hidrantes.length) todos();
  }, [mapa, hidrantes, ubicacion, vista]);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(() => mapa.invalidateSize({ pan: false }));
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}

export default function MapaEditor(props: Props) {
  return (
    <MapContainer center={[9.7489, -83.7534]} zoom={8} minZoom={3} maxZoom={19} zoomControl={false}
      className="hydrants-leaflet-map editor-leaflet-map" preferCanvas>
      <TileLayer key={props.versionMapa} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' eventHandlers={{ tileerror: props.onErrorMapa }} />
      <ZoomControl position="bottomright" /><ScaleControl position="bottomleft" metric imperial={false} />
      <CamaraEditor hidrantes={props.hidrantes} ubicacion={props.ubicacion} vista={props.vista} />
      <InteraccionMapa permitirUbicar={props.permitirUbicar} onUbicar={props.onUbicar} />
      {props.hidrantes.filter((h) => !props.borrador || h.id !== props.idEditado).map((h) => (
        <Marker key={h.id} position={[h.latitud, h.longitud]} icon={iconosHidrantes[h.tipo]} keyboard
          title={"Editar hidrante " + h.tipo + ": " + formatearGpm(h.gpm) + " GPM"}
          eventHandlers={{ click: () => { if (props.permitirSeleccionar) props.onSeleccionar(h); } }}>
          <Tooltip>{(h.tipo === "primario" ? "Primario" : "Secundario") + " · " + formatearGpm(h.gpm) + " GPM"}</Tooltip>
        </Marker>
      ))}
      {props.borrador ? <Marker position={[props.borrador.latitud, props.borrador.longitud]} icon={iconosBorrador[props.tipoBorrador]}
        draggable={props.permitirUbicar} title="Ubicación del hidrante · Sin guardar" keyboard
        eventHandlers={{ dragend: (evento) => {
          const posicion = (evento.target as MarcadorLeaflet).getLatLng();
          props.onUbicar({ latitud: posicion.lat, longitud: posicion.lng });
        } }}><Tooltip permanent direction="top" offset={[0, -48]} className="draft-location-label">Sin guardar</Tooltip></Marker> : null}
      {props.ubicacion ? <><Circle center={[props.ubicacion.latitud, props.ubicacion.longitud]} radius={props.ubicacion.precision}
        pathOptions={{ color: "#d99a24", weight: 1, fillColor: "#f3b64b", fillOpacity: 0.1 }} interactive={false} />
        <CircleMarker center={[props.ubicacion.latitud, props.ubicacion.longitud]} radius={7}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#e8a633", fillOpacity: 1 }} interactive={false} />
      </> : null}
    </MapContainer>
  );
}
