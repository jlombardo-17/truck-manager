export interface Viaje {
  id?: number;
  numeroViaje: string;
  camionId: number;
  choferId: number;
  fechaInicio: string;
  fechaFin?: string;
  origen: string;
  destino: string;
  latitudOrigen?: number;
  longitudOrigen?: number;
  latitudDestino?: number;
  longitudDestino?: number;
  descripcionCarga?: string;
  pesoCargaKg?: number;
  valorViaje: number;
  kmRecorridos?: number;
  consumoCombustible?: number;
  costoCombustible?: number;
  otrosGastos?: number;
  estado?: string;
  notas?: string;
  rutas?: ViajRuta[];
  comisiones?: ViajComision[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ViajRuta {
  id?: number;
  viajeId?: number;
  orden: number;
  latitud: number;
  longitud: number;
  direccion?: string;
  tiempo?: string;
  odometroKm?: number;
  notas?: string;
  createdAt?: string;
}

export interface ViajComision {
  id?: string;
  viajeId?: number;
  tipo: string;
  concepto?: string;
  montoBase?: number;
  porcentaje?: number;
  montoFijo?: number;
  montoTotal?: number;
  beneficiario?: string;
  estado?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ViajDesglose {
  valorViaje: number;
  costoCombustible: number;
  otrosGastos: number;
  totalComisiones: number;
  gananciaNeta: number;
}
