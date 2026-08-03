# Impuestos del Hogar

Web app móvil para gestionar impuestos compartidos entre dos personas, construida con Next.js, Tailwind CSS y Supabase.

## Requisitos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com)

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (región South America recomendada).
2. En **SQL Editor**, ejecutá el contenido de [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
3. En **Authentication → Providers**, habilitá **Email** con contraseña.
4. Copiá **Project URL** y **anon public key** desde **Settings → API**.

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Flujo de uso

1. **Usuario 1** se registra sin código → se crea un hogar y aparece el código de invitación.
2. **Usuario 2** se registra ingresando ese código → se une al mismo hogar.
3. Cualquiera de los dos puede crear impuestos con comprobantes PDF o fotos.

## Estructura

- `app/(auth)/` — login y registro
- `app/(app)/` — dashboard y formulario de impuestos
- `components/ImpuestoForm.tsx` — formulario con upload a Storage
- `supabase/migrations/` — esquema PostgreSQL con RLS
