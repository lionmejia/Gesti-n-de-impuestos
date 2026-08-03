alter table public.impuestos
add column if not exists cuotas_totales integer,
add column if not exists cuota_actual integer;
