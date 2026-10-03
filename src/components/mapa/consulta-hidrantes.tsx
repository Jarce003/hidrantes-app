"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icono } from "@/components/mapa/icono";
import { consultarHidrantes } from "@/lib/hidrantes";
import { formatearPrecision, obtenerUbicacion } from "@/lib/mapa-utilidades";
import type { Hidrante, SolicitudVista, UbicacionUsuario } from "@/types/hidrantes";

const MapaHidrantes = dynamic(() => import("./mapa-hidrantes"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <span className="loading-ring" />
      <p>Abriendo el mapa…</p>
    </div>
  ),
});

type EstadoConsulta = "cargando" | "lista" | "error";
type EstadoUbicacion = {
  estado: "buscando" | "lista" | "error";
  ubicacion: UbicacionUsuario | null;
  mensaje: string | null;
};

export function ConsultaHidrantes() {
  const [hidrantes, setHidrantes] = useState<Hidrante[]>([]);
  const [estadoConsulta, setEstadoConsulta] = useState<EstadoConsulta>("cargando");
  const [versionConsulta, setVersionConsulta] = useState(0);
  const [errorMapa, setErrorMapa] = useState(false);
  const [versionUbicacion, setVersionUbicacion] = useState(0);
  const [ubicacion, setUbicacion] = useState<EstadoUbicacion>({
    estado: "buscando",
    ubicacion: null,
    mensaje: null,
  });
  const [solicitudVista, setSolicitudVista] = useState<SolicitudVista>({
    numero: 0,
    destino: "ubicacion",
  });

  useEffect(() => {
    let activo = true;
    const controlador = new AbortController();
    const limiteTiempo = window.setTimeout(() => controlador.abort(), 20000);

    consultarHidrantes(controlador.signal)
      .then((datos) => {
        if (!activo) return;
        setHidrantes(datos);
        setEstadoConsulta("lista");
      })
      .catch((error: unknown) => {
        if (!activo) return;
        console.error("Consulta de hidrantes:", error instanceof Error ? error.message : "Error de consulta");
        setEstadoConsulta("error");
      })
      .finally(() => window.clearTimeout(limiteTiempo));

    return () => {
      activo = false;
      window.clearTimeout(limiteTiempo);
      controlador.abort();
    };
  }, [versionConsulta]);

  useEffect(() => {
    let activo = true;

    obtenerUbicacion()
      .then((posicion) => {
        if (!activo) return;
        setUbicacion({ estado: "lista", ubicacion: posicion, mensaje: null });
        setSolicitudVista((anterior) => ({
          numero: anterior.numero + 1,
          destino: "ubicacion",
        }));
      })
      .catch((error: unknown) => {
        if (!activo) return;
        setUbicacion({
          estado: "error",
          ubicacion: null,
          mensaje: error instanceof Error ? error.message : "No pudimos obtener tu ubicación.",
        });
      });

    return () => {
      activo = false;
    };
  }, [versionUbicacion]);

  const actualizar = () => {
    setEstadoConsulta("cargando");
    setErrorMapa(false);
    setVersionConsulta((anterior) => anterior + 1);
  };

  const localizar = () => {
    setUbicacion((anterior) => ({ ...anterior, estado: "buscando", mensaje: null }));
    setVersionUbicacion((anterior) => anterior + 1);
  };

  const mostrarHidrantes = () => {
    setSolicitudVista((anterior) => ({
      numero: anterior.numero + 1,
      destino: "hidrantes",
    }));
  };

  const informarErrorMapa = useCallback(() => setErrorMapa(true), []);
  const primarios = hidrantes.filter((h) => h.tipo === "primario").length;
  const secundarios = hidrantes.length - primarios;
  const consultaLista = estadoConsulta === "lista";
  const cantidad = hidrantes.length + (hidrantes.length === 1 ? " hidrante" : " hidrantes");

  return (
    <main className="hydrants-app">
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-symbol"><Icono nombre="hidrante" /></span>
          <div>
            <h1>Mapa de hidrantes</h1>
            <p>Consulta pública</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="hydrant-count" aria-live="polite">
            {estadoConsulta === "cargando" ? "Consultando…" : estadoConsulta === "error" ? "Consulta pendiente" : cantidad}
          </span>
          <Link href="/ingreso" prefetch={false} className="refresh-button public-access-link" title="Ingreso de información" aria-label="Ingreso de información">
            <Icono nombre="usuario" /><span>Ingreso</span>
          </Link>
          <button
            type="button"
            className="refresh-button"
            onClick={actualizar}
            disabled={estadoConsulta === "cargando"}
            aria-label="Actualizar hidrantes y mapa"
            title="Actualizar hidrantes y mapa"
          >
            <Icono nombre="actualizar" className={estadoConsulta === "cargando" ? "spin" : undefined} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      <section className="map-stage" aria-label="Mapa y controles de consulta">
        <MapaHidrantes
          hidrantes={hidrantes}
          ubicacion={ubicacion.ubicacion}
          solicitudVista={solicitudVista}
          versionMapa={versionConsulta}
          onErrorMapa={informarErrorMapa}
        />

        <div className="map-notices">
          {estadoConsulta === "cargando" ? (
            <div className="map-notice map-notice--subtle" role="status">
              <span className="mini-spinner" />
              Consultando hidrantes…
            </div>
          ) : null}

          {estadoConsulta === "error" ? (
            <div className="map-notice map-notice--warning" role="alert">
              <Icono nombre="aviso" />
              <div>
                <strong>No pudimos actualizar los hidrantes.</strong>
                <span>Revisá la conexión y tocá Actualizar.</span>
              </div>
            </div>
          ) : null}

          {consultaLista && hidrantes.length === 0 ? (
            <div className="map-notice" role="status">
              <Icono nombre="hidrante" />
              <div>
                <strong>Todavía no hay hidrantes registrados.</strong>
                <span>Aparecerán aquí cuando se ingresen.</span>
              </div>
            </div>
          ) : null}

          {ubicacion.estado === "buscando" ? (
            <div className="map-notice map-notice--subtle" role="status">
              <span className="mini-spinner" />
              Buscando tu ubicación…
            </div>
          ) : null}

          {ubicacion.estado === "error" ? (
            <div className="map-notice map-notice--warning" role="status">
              <Icono nombre="ubicacion" />
              <span>{ubicacion.mensaje}</span>
            </div>
          ) : null}

          {errorMapa ? (
            <div className="map-notice map-notice--warning" role="status">
              <Icono nombre="mapa" />
              <span>Algunas partes del mapa no cargaron. Revisá la conexión y tocá Actualizar.</span>
            </div>
          ) : null}
        </div>

        <div className="map-tools" role="group" aria-label="Controles del mapa">
          <button
            type="button"
            className="map-tool"
            onClick={localizar}
            disabled={ubicacion.estado === "buscando"}
            aria-label="Obtener y centrar mi ubicación"
            title="Mi ubicación"
          >
            <Icono nombre="ubicacion" />
            <span>Mi ubicación</span>
          </button>
          <button
            type="button"
            className="map-tool"
            onClick={mostrarHidrantes}
            disabled={hidrantes.length === 0}
            aria-label="Mostrar todos los hidrantes"
            title="Ver hidrantes"
          >
            <Icono nombre="mapa" />
            <span>Ver hidrantes</span>
          </button>
        </div>
      </section>

      <footer className="map-legend">
        <div className="legend-items" aria-label="Tipos de hidrante">
          <span className="legend-item">
            <span className="legend-dot legend-dot--primario" />
            Primarios <strong>{consultaLista ? primarios : "—"}</strong>
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-dot--secundario" />
            Secundarios <strong>{consultaLista ? secundarios : "—"}</strong>
          </span>
        </div>
        <div className="location-state" aria-live="polite">
          <span className={"location-dot" + (ubicacion.estado === "lista" ? " location-dot--ready" : "")} />
          {ubicacion.estado === "lista" && ubicacion.ubicacion
            ? "Tu ubicación · ±" + formatearPrecision(ubicacion.ubicacion.precision)
            : ubicacion.estado === "buscando" ? "Buscando ubicación" : "Consulta manual"}
        </div>
      </footer>
    </main>
  );
}
