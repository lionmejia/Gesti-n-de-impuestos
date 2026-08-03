export type EstadoImpuesto = "pendiente" | "pagado";
export type RolHogar = "admin" | "miembro";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  created_at: string;
}

export interface Hogar {
  id: string;
  nombre: string;
  codigo_invitacion: string;
  created_at: string;
}

export interface HogarMiembro {
  id: string;
  hogar_id: string;
  usuario_id: string;
  rol: RolHogar;
  created_at: string;
}

export interface Impuesto {
  id: string;
  hogar_id: string;
  nombre: string;
  monto: number;
  cuotas_totales: number | null;
  cuota_actual: number | null;
  fecha_vencimiento: string | null;
  estado: EstadoImpuesto;
  emoji: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  creado_por: string;
  created_at: string;
}

export interface HogarConMembresia {
  hogar: Hogar;
  rol: RolHogar;
}
