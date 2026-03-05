export enum EstadoMantenimiento {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export interface MantenimientoTipo {
  id?: number;
  nombre: string;
  descripcion: string;
  intervaloBase: string;
  intervaloKm?: number;
  intervaloDias?: number;
  costoEstimado: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MantenimientoRegistro {
  id?: number;
  camionId: number;
  tipoId: number;
  estado: EstadoMantenimiento;
  fechaPrograma: Date | string;
  fechaRealizado?: Date | string;
  kmActual: number;
  proximoKm?: number;
  proximaFecha: Date | string;
  costoReal?: number;
  observaciones?: string;
  taller?: string;
  tipo?: MantenimientoTipo;
  createdAt?: string;
  updatedAt?: string;
}

export enum EstadoAlerta {
  VIGENTE = 'vigente',
  PROXIMO_VENCER = 'proximo_vencer',
  VENCIDO = 'vencido',
}

export interface AlertaMantenimiento {
  registroId: number;
  camionId: number;
  tipoNombre: string;
  estado: EstadoAlerta;
  proximaFecha: Date | string;
  diasFaltantes?: number;
}
