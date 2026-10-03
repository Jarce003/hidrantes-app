import type { SVGProps } from "react";

type NombreIcono = "hidrante" | "ubicacion" | "mapa" | "actualizar" | "flecha" | "aviso" |
  "usuario" | "salir" | "agregar" | "guardar" | "eliminar" | "cancelar";

export function Icono({
  nombre,
  ...props
}: SVGProps<SVGSVGElement> & { nombre: NombreIcono }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {nombre === "hidrante" ? (
        <>
          <path d="M8 8h8v12H8zM7 20h10M7 8h10M8 5a4 4 0 0 1 8 0v1H8z" />
          <path d="M8 11H4v5h4M16 11h4v5h-4M12 10v7" />
        </>
      ) : null}
      {nombre === "ubicacion" ? (
        <>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      ) : null}
      {nombre === "mapa" ? (
        <>
          <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16" />
        </>
      ) : null}
      {nombre === "actualizar" ? (
        <>
          <path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M18 18A8 8 0 0 1 5 15" />
        </>
      ) : null}
      {nombre === "flecha" ? (
        <>
          <path d="m4 11 16-7-7 16-2-7zM11 13l9-9" />
        </>
      ) : null}
      {nombre === "aviso" ? (
        <>
          <path d="m12 3 10 18H2zM12 9v4M12 17h.01" />
        </>
      ) : null}
      {nombre === "usuario" ? (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>) : null}
      {nombre === "salir" ? (<><path d="M9 3H4v18h5M10 12h11m-4-4 4 4-4 4" /></>) : null}
      {nombre === "agregar" ? <path d="M12 4v16M4 12h16" /> : null}
      {nombre === "guardar" ? <path d="M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7" /> : null}
      {nombre === "eliminar" ? <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /> : null}
      {nombre === "cancelar" ? <path d="m6 6 12 12M18 6 6 18" /> : null}
    </svg>
  );
}
