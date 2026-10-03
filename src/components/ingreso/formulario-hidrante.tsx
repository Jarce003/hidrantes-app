"use client";

import { type FormEvent } from "react";
import { Icono } from "@/components/mapa/icono";
import { obtenerPosicion } from "@/lib/validacion-hidrantes";
import type { FormularioHidrante } from "@/types/edicion";

type Props = {
  formulario: FormularioHidrante;
  ocupado: boolean;
  localizando: boolean;
  mensaje: string | null;
  onCambiar: (formulario: FormularioHidrante) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onEliminar: () => void;
  onUbicacion: () => void;
};

export function FormularioEdicion({ formulario, ocupado, localizando, mensaje, onCambiar, onGuardar, onCancelar, onEliminar, onUbicacion }: Props) {
  const posicionValida = obtenerPosicion(formulario) !== null;
  const enviar = (evento: FormEvent<HTMLFormElement>) => { evento.preventDefault(); onGuardar(); };
  return (
    <section className="editor-form-section" aria-label="Datos del hidrante">
      <div className="editor-section-heading">
        <div><span className="editor-eyebrow">{formulario.original ? "EDICIÓN" : "NUEVO REGISTRO"}</span>
          <h2>{formulario.original ? "Editar hidrante" : "Agregar hidrante"}</h2></div>
        <button type="button" className="editor-icon-button" onClick={onCancelar} disabled={ocupado || localizando}
          aria-label="Cerrar edición" title="Cerrar edición"><Icono nombre="cancelar" /></button>
      </div>
      <form className="hydrant-edit-form" onSubmit={enviar}>
        <fieldset disabled={ocupado || localizando} className="hydrant-fieldset">
          <legend>Tipo de hidrante</legend>
          <div className="type-options">
            <label className={"type-option" + (formulario.tipo === "primario" ? " type-option--selected" : "")}>
              <input type="radio" name="tipo" value="primario" checked={formulario.tipo === "primario"}
                onChange={() => onCambiar({ ...formulario, tipo: "primario" })} />
              <span className="legend-dot legend-dot--primario" />Primario
            </label>
            <label className={"type-option" + (formulario.tipo === "secundario" ? " type-option--selected" : "")}>
              <input type="radio" name="tipo" value="secundario" checked={formulario.tipo === "secundario"}
                onChange={() => onCambiar({ ...formulario, tipo: "secundario" })} />
              <span className="legend-dot legend-dot--secundario" />Secundario
            </label>
          </div>
        </fieldset>
        <label htmlFor="hidrante-gpm">Caudal · GPM</label>
        <input id="hidrante-gpm" type="text" inputMode="decimal" value={formulario.gpm} required
          onChange={(e) => onCambiar({ ...formulario, gpm: e.target.value })} disabled={ocupado || localizando}
          placeholder="Ej. 1250" aria-describedby="ayuda-gpm" />
        <div className="field-help" id="ayuda-gpm">Hasta dos decimales, con punto o coma. Sin separadores de miles.</div>
        <div className={"position-hint" + (posicionValida ? " position-hint--ready" : "")}>
          <Icono nombre="ubicacion" />
          <span>{posicionValida ? "Ubicación seleccionada. Podés arrastrar el marcador para ajustarla." : "Tocá el mapa para ubicar el hidrante."}</span>
        </div>
        <button type="button" className="editor-button editor-button--secondary" onClick={onUbicacion}
          disabled={ocupado || localizando}><Icono nombre="ubicacion" />{localizando ? "Obteniendo ubicación…" : "Usar mi ubicación"}</button>
        <details className="manual-coordinates">
          <summary>Coordenadas · ajuste manual</summary>
          <div className="coordinate-fields">
          <div><label htmlFor="hidrante-latitud">Latitud</label>
            <input id="hidrante-latitud" type="text" inputMode="text" value={formulario.latitud}
              onChange={(e) => onCambiar({ ...formulario, latitud: e.target.value })} disabled={ocupado || localizando} /></div>
          <div><label htmlFor="hidrante-longitud">Longitud</label>
            <input id="hidrante-longitud" type="text" inputMode="text" value={formulario.longitud}
              onChange={(e) => onCambiar({ ...formulario, longitud: e.target.value })} disabled={ocupado || localizando} /></div>
          </div>
        </details>
        <p className="save-help">Los cambios se aplican al pulsar Guardar.</p>
        {mensaje ? <div className="editor-message editor-message--error" role="alert">{mensaje}</div> : null}
        <div className="edit-actions">
          <button type="submit" className="editor-button editor-button--primary" disabled={ocupado || localizando}>
            <Icono nombre="guardar" />{ocupado ? "Procesando…" : "Guardar"}
          </button>
          <button type="button" className="editor-button" onClick={onCancelar} disabled={ocupado || localizando}>Cancelar</button>
        </div>
        {formulario.original ? <button type="button" className="editor-button editor-button--danger" onClick={onEliminar}
          disabled={ocupado || localizando}><Icono nombre="eliminar" />Eliminar hidrante</button> : null}
      </form>
    </section>
  );
}
