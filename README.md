# Hidrantes · Tres Ríos

Aplicación móvil y web de consulta pública de hidrantes de una estación.

La ruta `/` muestra el mapa sin iniciar sesión, solicita ubicación con permiso y permite consultar GPM y abrir Google Maps o Waze. Primarios en azul y secundarios en verde.

La ruta `/ingreso` permite agregar, editar, mover y eliminar hidrantes a la única cuenta autorizada. En celular, Mapa, Agregar e Hidrantes abren y cierran el panel sin perder el borrador. Los datos se guardan solo al tocar Guardar.

## Desarrollo

Requisitos: Node.js 22 y npm. Ejecutar `npm ci`, configurar `.env.local` a partir de `.env.example` con la clave publishable del proyecto y ejecutar `npm run dev`. Abrir localhost manualmente.

Comprobaciones: `npm run lint`, `npx --no-install next typegen`, `npx --no-install tsc --noEmit` y `npm run build`.

## Cuenta única

En Supabase, proyecto hidrantes-app (`kiwuokhbeoatjiztmgwh`), Authentication > Users > crear usuario directamente:

- Correo interno: `tresrios@hidrantes.invalid`.
- Contraseña: definirla en Supabase, al menos seis caracteres; recomendado ocho o más.
- Auto Confirm: activado. No enviar invitación al correo interno.
- Usuario visible en el ingreso: `tresrios`.

Ejecutar `supabase/habilitar-tresrios.sql` en SQL Editor del mismo proyecto. Debe devolver un editor activo. La aplicación no ofrece registro de usuarios. Las operaciones de escritura requieren el permiso activo en `public.editores` mediante RLS.

## GitHub y Vercel

1. Crear un repositorio privado vacío `Jarce003/hidrantes-app`, sin README, licencia ni gitignore iniciales. Ejecutar el bloque completo `scripts/08_Subir_Github.ps1` en PowerShell. Si GitHub CLI está instalado y autenticado, el bloque puede crear el repositorio privado.
2. Ejecutar el bloque completo `scripts/09_Publicar_Vercel.ps1`. Requiere sesión de Vercel CLI. Vincula exclusivamente hidrantes-app, verifica el equipo, copia las dos variables públicas desde `.env.local`, conecta el Git remoto y despliega a producción. Usar el enlace HTTPS que devuelve.
3. Cambios posteriores se despliegan al publicar en main mediante la integración Git de Vercel. Aprobar cada futura subida a main según el flujo de trabajo del proyecto.

El dominio propio se puede conectar después. Probar en el teléfono con el enlace HTTPS de Vercel; geolocalización requiere permiso del navegador.

La contraseña y las claves secretas no van en el código, los scripts, el repositorio ni las variables NEXT_PUBLIC. Conservar `.env.local` fuera de Git.
