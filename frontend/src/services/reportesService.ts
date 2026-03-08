import axios, { AxiosInstance } from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
  };
}

export interface RentabilidadResponse {
  filtrosAplicados: {
    granularidad: 'diaria' | 'mensual';
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
    granularidad: 'diaria' | 'semanal';
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
    granularidad: 'diaria' | 'mensual';
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
    granularidad: 'diaria' | 'semanal';
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
}

export default new ReportesService();
