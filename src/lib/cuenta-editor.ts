export const USUARIO_EDITOR = "tresrios";
export const CORREO_EDITOR = "tresrios@hidrantes.invalid";

export function correoParaUsuario(usuario: string): string {
  if (usuario.trim().toLowerCase() !== USUARIO_EDITOR) {
    throw new Error("Revisá el usuario y la contraseña.");
  }
  return CORREO_EDITOR;
}
