-- Ejecutar solo en el proyecto hidrantes-app despues de crear su usuario.
-- La cuenta interna es tresrios@hidrantes.invalid; el ingreso muestra tresrios.
do $$
declare
  cuenta uuid;
begin
  select id into strict cuenta from auth.users
  where lower(email) = 'tresrios@hidrantes.invalid'
    and email_confirmed_at is not null;

  if exists (select 1 from public.editores where activo and usuario_id <> cuenta) then
    raise exception 'Existe otro editor activo. Revisar antes de habilitar la cuenta unica.';
  end if;

  insert into public.editores (usuario_id, activo) values (cuenta, true)
  on conflict (usuario_id) do update set activo = true;
exception
  when no_data_found then
    raise exception 'Primero crea tresrios@hidrantes.invalid con Auto Confirm en Authentication > Users.';
end;
$$;

select count(*) as editores_activos from public.editores where activo;
