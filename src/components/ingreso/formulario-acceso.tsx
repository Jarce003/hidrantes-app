"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icono } from "@/components/mapa/icono";
import { obtenerClienteEditor } from "@/lib/supabase/editor";
import { correoParaUsuario } from "@/lib/cuenta-editor";

export function FormularioAcceso({ onIngresado }: { onIngresado: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setMensaje(null);
    try {
      const correo = correoParaUsuario(usuario);
      const { error } = await obtenerClienteEditor().auth.signInWithPassword({ email: correo, password: clave });
      if (error) {
        throw new Error(error.status === 429
          ? "Hay muchos intentos de ingreso. Esperá unos minutos y reintentá."
          : error.code === "email_not_confirmed"
            ? "La cuenta de ingreso todavía no está activada."
            : "No pudimos iniciar sesión. Revisá el usuario, la contraseña y la conexión.");
      }
      setClave("");
      onIngresado();
    } catch (error: unknown) {
      setMensaje(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="access-screen">
      <div className="access-card">
        <span className="access-symbol"><Icono nombre="hidrante" /></span>
        <div className="access-eyebrow">MAPA DE HIDRANTES</div>
        <h1>Ingreso de información</h1>
        <p>Estación de Tres Ríos · Administración de hidrantes.</p>
        <form onSubmit={ingresar} className="access-form">
          <label htmlFor="usuario-editor">Usuario</label>
          <input id="usuario-editor" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={usuario} onChange={(e) => setUsuario(e.target.value)} required disabled={ocupado} placeholder="tresrios" enterKeyHint="next" />
          <label htmlFor="clave-editor">Contraseña</label>
          <div className="password-field">
            <input id="clave-editor" type={mostrarClave ? "text" : "password"} autoComplete="current-password" enterKeyHint="go"
              value={clave} onChange={(e) => setClave(e.target.value)} required disabled={ocupado} />
            <button type="button" onClick={() => setMostrarClave((anterior) => !anterior)}
              aria-pressed={mostrarClave} disabled={ocupado}>{mostrarClave ? "Ocultar" : "Mostrar"}</button>
          </div>
          {mensaje ? <div className="editor-message editor-message--error" role="alert">{mensaje}</div> : null}
          <button type="submit" className="editor-button editor-button--primary" disabled={ocupado}>
            <Icono nombre="usuario" />{ocupado ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
        <Link href="/" className="access-public-link">Volver a la consulta pública</Link>
      </div>
    </main>
  );
}
