"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Icono } from "@/components/mapa/icono";
import { FormularioEdicion } from "@/components/ingreso/formulario-hidrante";
import { consultarHidrantesEditor, guardarHidrante, eliminarHidrante } from "@/lib/edicion-hidrantes";
import { crearFormulario, obtenerPosicion, tieneCambios, validarFormulario } from "@/lib/validacion-hidrantes";
import { obtenerUbicacion, formatearGpm, formatearPrecision } from "@/lib/mapa-utilidades";
import { USUARIO_EDITOR } from "@/lib/cuenta-editor";
import type { FormularioHidrante, HidranteEditable, PosicionMapa, VistaEditor } from "@/types/edicion";
import type { UbicacionUsuario } from "@/types/hidrantes";

const MapaEditor = dynamic(() => import("./mapa-editor"), {
  ssr: false,
  loading: () => <div className="map-loading" role="status"><span className="loading-ring" /><p>Abriendo el mapa…</p></div>,
});

type Props = { onSalir: () => Promise<void>; saliendo: boolean; errorSalida: string | null };
type Geo = { ocupado: boolean; ubicacion: UbicacionUsuario | null; mensaje: string | null };

export function PanelIngreso({ onSalir, saliendo, errorSalida }: Props) {
  const [hidrantes, setHidrantes] = useState<HidranteEditable[]>([]);
  const [estadoDatos, setEstadoDatos] = useState<"cargando" | "lista" | "error">("cargando");
  const [versionDatos, setVersionDatos] = useState(0);
  const [formulario, setFormulario] = useState<FormularioHidrante | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorMapa, setErrorMapa] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [geo, setGeo] = useState<Geo>({ ocupado: true, ubicacion: null, mensaje: null });
  const [vista, setVista] = useState<VistaEditor>({ numero: 0, destino: "hidrantes" });

  useEffect(() => {
    let activo = true;
    const controlador = new AbortController();
    const limite = window.setTimeout(() => controlador.abort(), 20000);
    consultarHidrantesEditor(controlador.signal)
      .then((datos) => { if (activo) { setHidrantes(datos); setEstadoDatos("lista"); } })
      .catch(() => { if (activo) setEstadoDatos("error"); })
      .finally(() => window.clearTimeout(limite));
    return () => { activo = false; window.clearTimeout(limite); controlador.abort(); };
  }, [versionDatos]);

  useEffect(() => {
    let activo = true;
    obtenerUbicacion()
      .then((ubicacion) => {
        if (!activo) return;
        setGeo({ ocupado: false, ubicacion, mensaje: null });
      })
      .catch((error: unknown) => {
        if (activo) setGeo({ ocupado: false, ubicacion: null, mensaje: error instanceof Error ? error.message : "No pudimos obtener tu ubicación." });
      });
    return () => { activo = false; };
  }, []);

  const cambiosPendientes = formulario ? tieneCambios(formulario) : false;
  useEffect(() => {
    if (!cambiosPendientes && !ocupado) return;
    const proteger = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ""; };
    window.addEventListener("beforeunload", proteger);
    return () => window.removeEventListener("beforeunload", proteger);
  }, [cambiosPendientes, ocupado]);

  function permitirCambio() {
    if (ocupado || geo.ocupado || saliendo) return false;
    return !cambiosPendientes || window.confirm("Tenés cambios sin guardar. ¿Querés descartarlos?");
  }
  function centrar(posicion: PosicionMapa | "hidrantes") {
    setVista((anterior) => ({ numero: anterior.numero + 1, destino: posicion }));
  }
  function agregar() {
    if (!permitirCambio()) return;
    setFormulario(crearFormulario()); setErrorFormulario(null); setAviso(null);
    setPanelAbierto(true);
  }
  function seleccionar(hidrante: HidranteEditable) {
    if (formulario?.original?.id === hidrante.id) {
      const posicion = obtenerPosicion(formulario);
      if (posicion) centrar(posicion);
      setPanelAbierto(true);
      return;
    }
    if (!permitirCambio()) return;
    setFormulario(crearFormulario(hidrante)); setErrorFormulario(null); setAviso(null);
    setPanelAbierto(true);
    centrar(hidrante);
  }
  function cancelar() {
    if (!permitirCambio()) return;
    setFormulario(null); setErrorFormulario(null);
    setPanelAbierto(false);
  }
  function actualizar() {
    if (!permitirCambio()) return;
    setFormulario(null); setErrorFormulario(null); setAviso(null); setErrorMapa(false);
    setEstadoDatos("cargando"); setVersionDatos((anterior) => anterior + 1);
  }
  const cambiarPosicion = useCallback((posicion: PosicionMapa) => {
    setFormulario((anterior) => anterior ? {
      ...anterior, latitud: posicion.latitud.toFixed(6), longitud: posicion.longitud.toFixed(6),
    } : anterior);
    setErrorFormulario(null);
  }, []);
  async function localizar(usarEnHidrante = false) {
    if (geo.ocupado || ocupado || saliendo) return;
    setGeo((anterior) => ({ ...anterior, ocupado: true, mensaje: null }));
    try {
      const ubicacion = await obtenerUbicacion();
      setGeo({ ocupado: false, ubicacion, mensaje: null });
      centrar(ubicacion);
      if (usarEnHidrante) {
        cambiarPosicion(ubicacion);
        setAviso("Ubicación aproximada · ±" + formatearPrecision(ubicacion.precision) + ". Ajustá el marcador antes de guardar.");
      }
    } catch (error: unknown) {
      setGeo((anterior) => ({ ...anterior, ocupado: false, mensaje: error instanceof Error ? error.message : "No pudimos obtener tu ubicación." }));
    }
  }
  async function guardar() {
    if (!formulario || ocupado || geo.ocupado || saliendo) return;
    setErrorFormulario(null);
    let datos;
    try { datos = validarFormulario(formulario); }
    catch (error: unknown) { setErrorFormulario(error instanceof Error ? error.message : "Revisá los datos."); setPanelAbierto(true); return; }
    setOcupado(true);
    try {
      const guardado = await guardarHidrante(datos, formulario.original);
      setHidrantes((anteriores) => [...anteriores.filter((h) => h.id !== guardado.id), guardado].sort((a, b) => a.id.localeCompare(b.id)));
      setFormulario(null); setAviso("Hidrante guardado. Ya está disponible en la consulta pública.");
      setPanelAbierto(false);
      centrar(guardado);
    } catch (error: unknown) {
      setErrorFormulario(error instanceof Error ? error.message : "No pudimos confirmar el guardado. Actualizá el mapa antes de reintentar.");
      setPanelAbierto(true);
    } finally { setOcupado(false); }
  }
  async function eliminar() {
    if (!formulario?.original || ocupado || geo.ocupado || saliendo) return;
    if (!window.confirm("¿Eliminar este hidrante? Dejará de aparecer en la consulta pública.")) return;
    const original = formulario.original;
    setOcupado(true); setErrorFormulario(null);
    try {
      await eliminarHidrante(original);
      setHidrantes((anteriores) => anteriores.filter((h) => h.id !== original.id));
      setFormulario(null); setAviso("Hidrante eliminado.");
      setPanelAbierto(false);
    } catch (error: unknown) { setErrorFormulario(error instanceof Error ? error.message : "No pudimos eliminar el hidrante."); }
    finally { setOcupado(false); }
  }
  function abrirConsulta(evento: MouseEvent<HTMLAnchorElement>) {
    if (!permitirCambio()) evento.preventDefault();
  }
  async function salir() { if (permitirCambio()) await onSalir(); }

  const primarios = hidrantes.filter((h) => h.tipo === "primario").length;
  const visibles = filtro === "todos" ? hidrantes : hidrantes.filter((h) => h.tipo === filtro);
  const borrador = formulario ? obtenerPosicion(formulario) : null;
  const informarErrorMapa = useCallback(() => setErrorMapa(true), []);

  return (
    <main className="editor-app">
      <header className="app-header editor-header">
        <div className="app-brand"><span className="brand-symbol"><Icono nombre="hidrante" /></span>
          <div><h1>Ingreso de hidrantes</h1><p className="editor-account">{USUARIO_EDITOR} · Tres Ríos</p></div></div>
        <div className="header-actions">
          <Link href="/" className="refresh-button public-access-link" onClick={abrirConsulta} aria-disabled={ocupado || geo.ocupado || saliendo}
            aria-label="Abrir consulta pública" title="Consulta pública">
            <Icono nombre="mapa" /><span>Consulta pública</span></Link>
          <button type="button" className="refresh-button" onClick={salir} disabled={ocupado || geo.ocupado || saliendo}
            aria-label="Cerrar sesión" title="Cerrar sesión"><Icono nombre="salir" /><span>{saliendo ? "Saliendo…" : "Salir"}</span></button>
        </div>
      </header>

      <div className={"editor-workspace" + (panelAbierto ? " editor-workspace--panel-abierto" : "")}>
        <aside id="panel-hidrantes" className="editor-sidebar" aria-label="Gestión de hidrantes">
          <div className="editor-mobile-panel-heading">
            <strong>{formulario ? "Datos del hidrante" : "Hidrantes registrados"}</strong>
            <button type="button" className="editor-button" onClick={() => setPanelAbierto(false)}>
              <Icono nombre="mapa" />Ver mapa
            </button>
          </div>
          {errorSalida ? <div className="editor-message editor-message--error" role="alert">{errorSalida}</div> : null}
          {aviso ? <div className="editor-message editor-message--success" role="status">{aviso}</div> : null}
          <div className="editor-sidebar-top">
            <button type="button" className="editor-button editor-button--primary" onClick={agregar}
              disabled={ocupado || geo.ocupado || saliendo || estadoDatos !== "lista"}><Icono nombre="agregar" />Agregar hidrante</button>
            <button type="button" className="editor-icon-button" onClick={actualizar} title="Actualizar hidrantes y mapa" aria-label="Actualizar hidrantes y mapa"
              disabled={ocupado || geo.ocupado || saliendo || estadoDatos === "cargando"}><Icono nombre="actualizar" /></button>
          </div>
          {formulario ? <FormularioEdicion formulario={formulario} ocupado={ocupado || saliendo} localizando={geo.ocupado} mensaje={errorFormulario}
            onCambiar={(nuevo) => { setFormulario(nuevo); setErrorFormulario(null); }} onGuardar={guardar} onCancelar={cancelar}
            onEliminar={eliminar} onUbicacion={() => localizar(true)} /> : null}

          <section className="editor-list-section" aria-label="Hidrantes registrados">
            <div className="editor-section-heading"><h2>Registrados <span>{estadoDatos === "lista" ? hidrantes.length : "—"}</span></h2>
              <select aria-label="Filtrar hidrantes por tipo" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="todos">Todos</option><option value="primario">Primarios</option><option value="secundario">Secundarios</option>
              </select></div>
            {estadoDatos === "cargando" ? <p className="editor-empty" role="status">Consultando hidrantes…</p> : null}
            {estadoDatos === "error" ? <div className="editor-message editor-message--error" role="alert">No pudimos actualizar los hidrantes. Revisá la conexión y tocá Actualizar.</div> : null}
            {estadoDatos === "lista" && visibles.length === 0 ? <p className="editor-empty">{hidrantes.length === 0 ? "Agregá el primer hidrante para mostrarlo en el mapa público." : "No hay hidrantes de este tipo."}</p> : null}
            <ul className="editor-hydrant-list">
              {visibles.map((hidrante) => <li key={hidrante.id}>
                <button type="button" className={"editor-list-item" + (formulario?.original?.id === hidrante.id ? " editor-list-item--selected" : "")}
                  onClick={() => seleccionar(hidrante)} disabled={ocupado || geo.ocupado || saliendo}
                  aria-label={"Editar hidrante " + hidrante.tipo + " de " + formatearGpm(hidrante.gpm) + " GPM"}>
                  <span className={"legend-dot legend-dot--" + hidrante.tipo} />
                  <span className="editor-list-details"><strong>{hidrante.tipo === "primario" ? "Primario" : "Secundario"}</strong>
                    <span>{hidrante.latitud.toFixed(6)}, {hidrante.longitud.toFixed(6)}</span></span>
                  <span className="editor-list-flow">{formatearGpm(hidrante.gpm)}<small>GPM</small></span>
                </button></li>)}
            </ul>
          </section>
        </aside>

        <section className="editor-map-wrapper" aria-label="Mapa de edición de hidrantes">
          <MapaEditor hidrantes={hidrantes} ubicacion={geo.ubicacion} vista={vista} versionMapa={versionDatos}
            borrador={borrador} tipoBorrador={formulario?.tipo ?? "primario"} idEditado={formulario?.original?.id ?? null}
            permitirUbicar={Boolean(formulario) && !ocupado && !geo.ocupado && !saliendo}
            permitirSeleccionar={!ocupado && !geo.ocupado && !saliendo}
            onSeleccionar={seleccionar} onUbicar={cambiarPosicion} onErrorMapa={informarErrorMapa} />
          <div className="map-notices editor-map-notices">
            {errorSalida ? <div className="map-notice map-notice--warning editor-mobile-notice" role="alert">{errorSalida}</div> : null}
            {aviso ? <div className="map-notice editor-mobile-notice" role="status">{aviso}</div> : null}
            {estadoDatos === "error" ? <div className="map-notice map-notice--warning editor-mobile-notice" role="alert">No pudimos consultar los hidrantes. Tocá Hidrantes y Actualizar.</div> : null}
            {formulario ? <div className="map-notice"><Icono nombre="ubicacion" /><span>{borrador ? "Arrastrá el marcador o tocá otro punto. Guardá para aplicar los cambios." : "Tocá el mapa para elegir la ubicación del hidrante."}</span></div> : null}
            {geo.ocupado ? <div className="map-notice map-notice--subtle" role="status"><span className="mini-spinner" />Buscando tu ubicación…</div> : null}
            {geo.mensaje ? <div className="map-notice map-notice--warning" role="status">{geo.mensaje}</div> : null}
            {errorMapa ? <div className="map-notice map-notice--warning" role="status">Algunas partes del mapa no cargaron. Revisá la conexión y tocá Actualizar.</div> : null}
          </div>
          <div className="map-tools" role="group" aria-label="Controles del mapa">
            <button type="button" className="map-tool" onClick={() => localizar()} disabled={geo.ocupado || ocupado || saliendo}
              aria-label="Centrar mi ubicación"><Icono nombre="ubicacion" /><span>Mi ubicación</span></button>
            <button type="button" className="map-tool" onClick={() => centrar("hidrantes")} disabled={hidrantes.length === 0}
              aria-label="Mostrar todos los hidrantes"><Icono nombre="mapa" /><span>Ver hidrantes</span></button>
          </div>
        </section>
      </div>

      <nav className="editor-mobile-toolbar" aria-label="Herramientas de ingreso">
        <button type="button" className={!panelAbierto ? "editor-mobile-tab editor-mobile-tab--active" : "editor-mobile-tab"}
          onClick={() => setPanelAbierto(false)} aria-controls="panel-hidrantes" aria-expanded={panelAbierto}>
          <Icono nombre="mapa" />Mapa
        </button>
        <button type="button" className={formulario && panelAbierto ? "editor-mobile-tab editor-mobile-tab--active" : "editor-mobile-tab"}
          onClick={() => formulario ? setPanelAbierto(true) : agregar()}
          disabled={ocupado || geo.ocupado || saliendo || estadoDatos !== "lista"} aria-controls="panel-hidrantes">
          <Icono nombre={formulario ? "guardar" : "agregar"} />{formulario ? "Datos" : "Agregar"}
        </button>
        <button type="button" className={!formulario && panelAbierto ? "editor-mobile-tab editor-mobile-tab--active" : "editor-mobile-tab"}
          onClick={() => setPanelAbierto(true)} aria-controls="panel-hidrantes" aria-expanded={panelAbierto}>
          <Icono nombre="hidrante" />Hidrantes
        </button>
      </nav>

      <footer className="map-legend editor-legend">
        <div className="legend-items"><span className="legend-item"><span className="legend-dot legend-dot--primario" />Primarios <strong>{primarios}</strong></span>
          <span className="legend-item"><span className="legend-dot legend-dot--secundario" />Secundarios <strong>{hidrantes.length - primarios}</strong></span></div>
        <div className="location-state">{borrador ? "Marcador con borde amarillo · Sin guardar" : geo.ubicacion ? "Tu ubicación · ±" + formatearPrecision(geo.ubicacion.precision) : "Selección manual en el mapa"}</div>
      </footer>
    </main>
  );
}
