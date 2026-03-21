import axios, { AxiosInstance } from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface RentabilidadPoint {
  periodo: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
  gananciaNeta: number;
  kmRecorridos: number;
  detalleGastos: {
    operativosViaje: number;
    comisionChofer: number;
    sueldoChofer: number;
    mantenimiento: number;
    documentosFijos: number;
  };
}

export interface RentabilidadResponse {
  filtrosAplicados: {
    granularidad: 'diaria' | 'semanal' | 'mensual';
    camionIds?: number[];
    choferIds?: number[];
    desde: string;
    hasta: string;
  };
  resumen: {
    totalIngresos: number;
    totalGastos: number;
    totalGananciaNeta: number;
  };
  series: RentabilidadPoint[];
}

export interface RentabilidadComparativaResponse {
  filtrosAplicados: {
    compararPor: 'camion' | 'chofer';
    camionIds?: number[];
    choferIds?: number[];
    desde: string;
    hasta: string;
  };
  comparativas: Array<{
    id: number;
    label: string;
    ingresos: number;
    gastos: number;
    gananciaNeta: number;
  }>;
}

export interface OperacionCamionResponse {
  filtrosAplicados: {
    camionId: number;
    granularidad: 'diaria' | 'semanal' | 'mensual';
    desde: string;
    hasta: string;
  };
  resumen: {
    totalKms: number;
    totalToneladas: number;
  };
  series: Array<{
    periodo: string;
    etiqueta: string;
    kms: number;
    toneladas: number;
  }>;
}

export interface DesempenoChoferesResponse {
  filtrosAplicados: {
    desde: string;
    hasta: string;
    choferIds?: number[];
  };
  desempenio: Array<{
    id: number;
    nombre: string;
    viajesCompletos: number;
    ingresos: number;
    comisiones: number;
    comisionPromedio: number;
  }>;
}

export interface GastosMantenimientoResponse {
  filtrosAplicados: {
    desde: string;
    hasta: string;
    camionIds?: number[];
  };
  resumenTotal: number;
  gastos: Array<{
    camionId: number;
    patente: string;
    registros: Array<{
      camionId: number;
      patente: string;
      tipoMantenimiento: string;
      fecha: string;
      costo: number;
      estado: string;
    }>;
    totalGastos: number;
    cantidadRegistros: number;
  }>;
}

export interface GastosDocumentalesResponse {
  filtrosAplicados: {
    desde: string;
    hasta: string;
    camionIds?: number[];
  };
  resumenTotalActual: number;
  resumenTotalProyectado: number;
  gastos: Array<{
    camionId: number;
    patente: string;
    cantidadDocumentos: number;
    totalCostoActual: number;
    totalCostoProyectado: number;
    documentos: Array<{
      documentoId: number;
      tipo: string;
      nombre: string;
      costoActual: number;
      coberturaDias: number;
      costoProyectado: number;
      fechaVencimiento?: string;
    }>;
  }>;
}

export interface IngresosMensualesResponse {
  filtrosAplicados: {
    desde: string;
    hasta: string;
    camionIds?: number[];
    choferIds?: number[];
  };
  resumen: {
    totalViajesCompletos: number;
    totalIngresos: number;
    totalGastos: number;
    totalGananciaNeta: number;
  };
  ingresos: Array<{
    mes: string;
    viajesCompletos: number;
    ingresos: number;
    gastos: number;
    gananciaNeta: number;
    rentabilidad: number;
  }>;
}

class ReportesService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getRentabilidad(filters: {
    granularidad: 'diaria' | 'semanal' | 'mensual';
    camionIds?: number[];
    choferIds?: number[];
    desde?: string;
    hasta?: string;
  }): Promise<RentabilidadResponse> {
    const response = await this.api.get<RentabilidadResponse>('/reportes/rentabilidad', {
      params: {
        granularidad: filters.granularidad,
        ...(filters.camionIds?.length ? { camionIds: filters.camionIds.join(',') } : {}),
        ...(filters.choferIds?.length ? { choferIds: filters.choferIds.join(',') } : {}),
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
      },
    });

    return response.data;
  }

  async getRentabilidadComparativa(filters: {
    compararPor: 'camion' | 'chofer';
    desde?: string;
    hasta?: string;
    camionIds?: number[];
    choferIds?: number[];
  }): Promise<RentabilidadComparativaResponse> {
    const response = await this.api.get<RentabilidadComparativaResponse>('/reportes/rentabilidad/comparativa', {
      params: {
        compararPor: filters.compararPor,
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
        ...(filters.camionIds?.length ? { camionIds: filters.camionIds.join(',') } : {}),
        ...(filters.choferIds?.length ? { choferIds: filters.choferIds.join(',') } : {}),
      },
    });

    return response.data;
  }

  async getOperacionCamion(filters: {
    camionId: number;
    granularidad: 'diaria' | 'semanal' | 'mensual';
    desde?: string;
    hasta?: string;
  }): Promise<OperacionCamionResponse> {
    const response = await this.api.get<OperacionCamionResponse>(`/reportes/operacion/camion/${filters.camionId}`, {
      params: {
        granularidad: filters.granularidad,
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
      },
    });

    return response.data;
  }

  // Reportes adicionales
  async getDesempenoChoferes(filters: {
    desde?: string;
    hasta?: string;
    choferIds?: number[];
  }): Promise<DesempenoChoferesResponse> {
    const response = await this.api.get<DesempenoChoferesResponse>('/reportes/desempenio-choferes', {
      params: {
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
        ...(filters.choferIds?.length ? { choferIds: filters.choferIds.join(',') } : {}),
      },
    });
    return response.data;
  }

  async getGastosMantenimiento(filters: {
    desde?: string;
    hasta?: string;
    camionIds?: number[];
  }): Promise<GastosMantenimientoResponse> {
    const response = await this.api.get<GastosMantenimientoResponse>('/reportes/gastos-mantenimiento', {
      params: {
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
        ...(filters.camionIds?.length ? { camionIds: filters.camionIds.join(',') } : {}),
      },
    });
    return response.data;
  }

  async getGastosDocumentales(filters: {
    desde?: string;
    hasta?: string;
    camionIds?: number[];
  }): Promise<GastosDocumentalesResponse> {
    const response = await this.api.get<GastosDocumentalesResponse>('/reportes/gastos-documentales', {
      params: {
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
        ...(filters.camionIds?.length ? { camionIds: filters.camionIds.join(',') } : {}),
      },
    });
    return response.data;
  }

  async getIngresosmensuales(filters: {
    desde?: string;
    hasta?: string;
    camionIds?: number[];
    choferIds?: number[];
  }): Promise<IngresosMensualesResponse> {
    const response = await this.api.get<IngresosMensualesResponse>('/reportes/ingresos-mensuales', {
      params: {
        ...(filters.desde ? { desde: filters.desde } : {}),
        ...(filters.hasta ? { hasta: filters.hasta } : {}),
        ...(filters.camionIds?.length ? { camionIds: filters.camionIds.join(',') } : {}),
        ...(filters.choferIds?.length ? { choferIds: filters.choferIds.join(',') } : {}),
      },
    });
    return response.data;
  }
}

const reportesService = new ReportesService();

export { reportesService };
export default reportesService;
