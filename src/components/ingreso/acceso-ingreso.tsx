"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormularioAcceso } from "@/components/ingreso/formulario-acceso";
import { PanelIngreso } from "@/components/ingreso/panel-ingreso";
import { comprobarAccesoEditor, cerrarSesionEditor } from "@/lib/acceso-editor";
import { obtenerClienteEditor } from "@/lib/supabase/editor";
import type { AccesoEditor } from "@/types/edicion";

export function AccesoIngreso() {
  const [acceso, setAcceso] = useState<AccesoEditor>({ estado: "comprobando" });
  const [version, setVersion] = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const [errorSalida, setErrorSalida] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let numero = 0;
    let temporizador: number | undefined;
    let controlador: AbortController | undefined;

    const programar = () => {
      window.clearTimeout(temporizador);
      controlador?.abort();
      const actual = ++numero;
      // Salir del callback de Auth antes de hacer otras llamadas al cliente.
      temporizador = window.setTimeout(() => {
        controlador = new AbortController();
        comprobarAccesoEditor(controlador.signal)
          .then((resultado) => { if (activo && actual === numero) setAcceso(resultado); })
          .catch((error: unknown) => {
            if (activo && actual === numero) setAcceso({ estado: "error", mensaje: error instanceof Error ? error.message : "No pudimos verificar el acceso." });
          });
      }, 0);
    };

    const supabase = obtenerClienteEditor();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (!activo) return;
      if (evento === "SIGNED_OUT") {
        numero++;
        controlador?.abort();
        window.clearTimeout(temporizador);
        setAcceso({ estado: "anonimo" });
      } else {
        programar();
      }
    });
    programar();
    window.addEventListener("focus", programar);
    return () => {
      activo = false;
      numero++;
      controlador?.abort();
      window.clearTimeout(temporizador);
      window.removeEventListener("focus", programar);
      subscription.unsubscribe();
    };
  }, [version]);

  const reintentar = () => { setErrorSalida(null); setAcceso({ estado: "comprobando" }); setVersion((anterior) => anterior + 1); };
  async function salir() {
    setSaliendo(true);
    setErrorSalida(null);
    try { await cerrarSesionEditor(); }
    catch (error: unknown) { setErrorSalida(error instanceof Error ? error.message : "No pudimos cerrar la sesión."); }
    finally { setSaliendo(false); }
  }

  if (acceso.estado === "autorizado") {
    return <PanelIngreso key={acceso.usuario.id}
      onSalir={salir} saliendo={saliendo} errorSalida={errorSalida} />;
  }
  if (acceso.estado === "anonimo") return <FormularioAcceso onIngresado={reintentar} />;

  return (
    <main className="access-screen">
      <div className="access-card access-card--status">
        {acceso.estado === "comprobando" ? (
          <><span className="loading-ring" /><h1>Comprobando acceso…</h1></>
        ) : acceso.estado === "denegado" ? (
          <><h1>Cuenta sin permiso de ingreso</h1>
            <p>Tu cuenta necesita autorización para administrar hidrantes.</p>
            <button type="button" className="editor-button" onClick={salir} disabled={saliendo}>
              {saliendo ? "Cerrando sesión…" : "Ingresar con otra cuenta"}
            </button></>
        ) : (
          <><h1>No pudimos verificar el acceso</h1><p role="alert">{acceso.mensaje}</p>
            <button type="button" className="editor-button" onClick={reintentar}>Reintentar</button></>
        )}
        {errorSalida ? <div className="editor-message editor-message--error" role="alert">{errorSalida}</div> : null}
        <Link href="/" className="access-public-link">Volver a la consulta pública</Link>
      </div>
    </main>
  );
}
