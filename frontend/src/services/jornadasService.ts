import axios, { AxiosInstance } from 'axios';
import {
  BulkJornadaDto,
  ChoferJornada,
  JornadasRango,
  ResumenJornadasChofer,
  SalarioAfectado,
  UpsertJornadaDto,
  ViajeSugerido,
} from '../types/jornada';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class JornadasService {
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

  /**
   * Jornadas de los choferes en el rango, más días sugeridos a partir de viajes
   */
  async getByRango(choferIds: number[], desde: string, hasta: string): Promise<JornadasRango> {
    const response = await this.api.get<unknown>('/jornadas', {
      params: { choferIds: choferIds.join(','), desde, hasta },
    });
    return {
      jornadas: normalizeArrayResponse<ChoferJornada>(response.data, 'jornadas'),
      viajesSugeridos: normalizeArrayResponse<ViajeSugerido>(response.data, 'viajesSugeridos'),
    };
  }

  /**
   * Resumen mensual por chofer: días por categoría y total de viáticos
   */
  async getResumen(choferIds: number[], anio: number, mes: number): Promise<ResumenJornadasChofer[]> {
    const response = await this.api.get<unknown>('/jornadas/resumen', {
      params: { choferIds: choferIds.join(','), anio, mes },
    });
    return normalizeArrayResponse<ResumenJornadasChofer>(response.data);
  }

  /**
   * Crear o actualizar la jornada de un chofer en una fecha
   */
  async upsert(dto: UpsertJornadaDto): Promise<{ jornada: ChoferJornada; salario: SalarioAfectado | null }> {
    const response = await this.api.put<unknown>('/jornadas', dto);
    const data = normalizeObjectResponse<{ jornada: ChoferJornada; salario: SalarioAfectado | null }>(response.data);
    return { jornada: data.jornada, salario: data.salario ?? null };
  }

  /**
   * Aplicar una categoría a varios choferes en un rango de fechas
   */
  async bulk(dto: BulkJornadaDto): Promise<{ procesadas: number; salarios: SalarioAfectado[] }> {
    const response = await this.api.post<unknown>('/jornadas/bulk', dto);
    const data = normalizeObjectResponse<{ procesadas: number }>(response.data);
    return {
      procesadas: data.procesadas ?? 0,
      salarios: normalizeArrayResponse<SalarioAfectado>(response.data, 'salarios'),
    };
  }

  async delete(id: number): Promise<{ salario: SalarioAfectado | null }> {
    const response = await this.api.delete<unknown>(`/jornadas/${id}`);
    const data = normalizeObjectResponse<{ salario: SalarioAfectado | null }>(response.data);
    return { salario: data.salario ?? null };
  }
}

export const jornadasService = new JornadasService();

export default jornadasService;
