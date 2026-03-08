export interface ChoferSalario {
  id: number;
  choferId: number;
  mes: number;
  anio: number;
  salarioBase: number;
  totalComisiones: number;
  bonos: number;
  deducciones: number;
  salarioNeto: number;
  estado: EstadoSalario;
  fechaPago?: string;
  observaciones?: string;
  metodoPago?: string;
  comprobante?: string;
  createdAt: string;
  updatedAt: string;
  chofer?: {
    id: number;
    nombre: string;
    apellido: string;
    rut: string;
  };
}

export enum EstadoSalario {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  CANCELADO = 'cancelado',
}

export interface CreateSalarioDto {
  choferId: number;
  mes: number;
  anio: number;
  salarioBase?: number;
  totalComisiones?: number;
  bonos?: number;
  deducciones?: number;
  estado?: EstadoSalario;
  fechaPago?: string;
  metodoPago?: string;
  comprobante?: string;
  observaciones?: string;
}

export interface UpdateSalarioDto {
  salarioBase?: number;
  totalComisiones?: number;
  bonos?: number;
  deducciones?: number;
  estado?: EstadoSalario;
  fechaPago?: string;
  metodoPago?: string;
  comprobante?: string;
  observaciones?: string;
}

export interface GenerarSalariosDto {
  mes: number;
  anio: number;
}

export interface GenerarSalariosResponse {
  creados: number;
  errores: string[];
}

export interface SalarioDetalle {
  salario: ChoferSalario;
  viajes: ViajeConComision[];
  totalViajes: number;
}

export interface ViajeConComision {
  id: number;
  numeroViaje: string;
  fechaInicio: string;
  fechaFin: string;
  origen: string;
  destino: string;
  valorViaje: number;
  comisiones: ComisionDetalle[];
  totalComision: number;
}

export interface ComisionDetalle {
  id: number;
  tipo: string;
  concepto: string;
  montoBase: number;
  porcentaje: number;
  montoFijo: number;
  montoTotal: number;
  beneficiario: string;
  estado: string;
}

export const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export const getEstadoSalarioLabel = (estado: EstadoSalario): string => {
  const labels = {
    [EstadoSalario.PENDIENTE]: 'Pendiente',
    [EstadoSalario.PAGADO]: 'Pagado',
    [EstadoSalario.CANCELADO]: 'Cancelado',
  };
  return labels[estado] || estado;
};

export const getEstadoSalarioColor = (estado: EstadoSalario): string => {
  const colors = {
    [EstadoSalario.PENDIENTE]: '#FFA500', // Naranja
    [EstadoSalario.PAGADO]: '#28A745', // Verde
    [EstadoSalario.CANCELADO]: '#DC3545', // Rojo
  };
  return colors[estado] || '#6C757D';
};

export const formatMes = (mes: number): string => {
  const mesObj = MESES.find(m => m.value === mes);
  return mesObj ? mesObj.label : mes.toString();
};

export const formatPeriodo = (mes: number, anio: number): string => {
  return `${formatMes(mes)} ${anio}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};
