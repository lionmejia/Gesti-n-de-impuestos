-- Impuestos del Hogar — esquema inicial
-- Ejecutar en Supabase SQL Editor después de crear el proyecto

create extension if not exists "pgcrypto";

-- Perfiles de usuario (extiende auth.users)
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Hogares compartidos
create table public.hogares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Mejia Guerrero',
  codigo_invitacion text not null unique default upper(substring(md5(random()::text) from 1 for 6)),
  created_at timestamptz not null default now()
);

-- Membresía usuario ↔ hogar
create table public.hogar_miembros (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('admin', 'miembro')),
  created_at timestamptz not null default now(),
  unique (hogar_id, usuario_id)
);

-- Impuestos del hogar
create table public.impuestos (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  nombre text not null,
  monto numeric(12, 2) not null check (monto > 0),
  fecha_vencimiento date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  archivo_url text,
  archivo_nombre text,
  creado_por uuid not null references public.usuarios (id),
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: verificar membresía
create or replace function public.es_miembro_hogar(hogar uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.hogar_miembros
    where hogar_id = hogar and usuario_id = auth.uid()
  );
$$;

-- Crear hogar (primer usuario)
create or replace function public.crear_hogar(nombre_hogar text default 'Mejia Guerrero')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_hogar_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if exists (select 1 from public.hogar_miembros where usuario_id = auth.uid()) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  insert into public.hogares (nombre)
  values (nombre_hogar)
  returning id into nuevo_hogar_id;

  insert into public.hogar_miembros (hogar_id, usuario_id, rol)
  values (nuevo_hogar_id, auth.uid(), 'admin');

  return nuevo_hogar_id;
end;
$$;

-- Unirse a hogar por código de invitación
create or replace function public.unirse_hogar(codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_hogar_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if exists (select 1 from public.hogar_miembros where usuario_id = auth.uid()) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  select id into target_hogar_id
  from public.hogares
  where upper(codigo_invitacion) = upper(trim(codigo));

  if target_hogar_id is null then
    raise exception 'Código de invitación inválido';
  end if;

  insert into public.hogar_miembros (hogar_id, usuario_id, rol)
  values (target_hogar_id, auth.uid(), 'miembro');

  return target_hogar_id;
end;
$$;

-- Obtener hogar del usuario autenticado
create or replace function public.mi_hogar_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select hogar_id
  from public.hogar_miembros
  where usuario_id = auth.uid()
  limit 1;
$$;

-- RLS
alter table public.usuarios enable row level security;
alter table public.hogares enable row level security;
alter table public.hogar_miembros enable row level security;
alter table public.impuestos enable row level security;

-- usuarios
create policy "usuarios_select_own" on public.usuarios
  for select using (id = auth.uid());

create policy "usuarios_select_hogar" on public.usuarios
  for select using (
    id in (
      select hm2.usuario_id
      from public.hogar_miembros hm1
      join public.hogar_miembros hm2 on hm1.hogar_id = hm2.hogar_id
      where hm1.usuario_id = auth.uid()
    )
  );

create policy "usuarios_update_own" on public.usuarios
  for update using (id = auth.uid());

-- hogares
create policy "hogares_select" on public.hogares
  for select using (public.es_miembro_hogar(id));

-- hogar_miembros
create policy "hogar_miembros_select" on public.hogar_miembros
  for select using (public.es_miembro_hogar(hogar_id));

-- impuestos
create policy "impuestos_select" on public.impuestos
  for select using (public.es_miembro_hogar(hogar_id));

create policy "impuestos_insert" on public.impuestos
  for insert with check (
    public.es_miembro_hogar(hogar_id) and creado_por = auth.uid()
  );

create policy "impuestos_update" on public.impuestos
  for update using (public.es_miembro_hogar(hogar_id));

create policy "impuestos_delete" on public.impuestos
  for delete using (public.es_miembro_hogar(hogar_id));

-- Storage bucket (privado)
insert into storage.buckets (id, name, public)
values ('impuestos-archivos', 'impuestos-archivos', false)
on conflict (id) do nothing;

-- Extraer hogar_id del path: {hogar_id}/{impuesto_id}/{filename}
create or replace function public.storage_hogar_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

create policy "storage_select" on storage.objects
  for select using (
    bucket_id = 'impuestos-archivos'
    and public.es_miembro_hogar(public.storage_hogar_id(name))
  );

create policy "storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'impuestos-archivos'
    and public.es_miembro_hogar(public.storage_hogar_id(name))
  );

create policy "storage_update" on storage.objects
  for update using (
    bucket_id = 'impuestos-archivos'
    and public.es_miembro_hogar(public.storage_hogar_id(name))
  );

create policy "storage_delete" on storage.objects
  for delete using (
    bucket_id = 'impuestos-archivos'
    and public.es_miembro_hogar(public.storage_hogar_id(name))
  );
