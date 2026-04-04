import axios, { AxiosInstance } from 'axios';
import {
  ChoferSalario,
  CreateSalarioDto,
  UpdateSalarioDto,
  GenerarSalariosDto,
  GenerarSalariosResponse,
  ViajeConComision,
  RegistrarPagoSalarioDto,
  SalarioPago,
} from '../types/salario';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class SalariosService {
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
   * Obtener todos los salarios (admin)
   */
  async getAll(): Promise<ChoferSalario[]> {
    const response = await this.api.get<unknown>('/salarios');
    return normalizeArrayResponse<ChoferSalario>(response.data, 'salarios');
  }

  /**
   * Obtener salarios de un chofer específico
   */
  async getByChofer(choferId: number): Promise<ChoferSalario[]> {
    const response = await this.api.get<unknown>(`/salarios/chofer/${choferId}`);
    return normalizeArrayResponse<ChoferSalario>(response.data, 'salarios');
  }

  /**
   * Obtener salarios por período (todos los choferes)
   */
  async getByPeriodo(anio: number, mes: number): Promise<ChoferSalario[]> {
    const response = await this.api.get<unknown>(`/salarios/periodo/${anio}/${mes}`);
    return normalizeArrayResponse<ChoferSalario>(response.data, 'salarios');
  }

  /**
   * Obtener salario específico de un chofer por período
   */
  async getSalarioChoferPeriodo(
    choferId: number,
    anio: number,
    mes: number,
  ): Promise<ChoferSalario> {
    const response = await this.api.get<unknown>(`/salarios/chofer/${choferId}/${anio}/${mes}`);
    return normalizeObjectResponse<ChoferSalario>(response.data, 'salario');
  }

  /**
   * Obtener detalle de viajes y comisiones
   */
  async getViajesConComisiones(
    choferId: number,
    anio: number,
    mes: number,
  ): Promise<{ viajes: ViajeConComision[]; totalComisiones: number }> {
    const response = await this.api.get<unknown>(`/salarios/chofer/${choferId}/${anio}/${mes}/detalle`);
    const payload = normalizeObjectResponse<{ viajes?: unknown; totalComisiones?: unknown }>(response.data);
    return {
      viajes: normalizeArrayResponse<ViajeConComision>(payload.viajes, 'viajes'),
      totalComisiones: Number(payload.totalComisiones) || 0,
    };
  }

  /**
   * Crear un nuevo registro de salario
   */
  async create(dto: CreateSalarioDto): Promise<ChoferSalario> {
    const response = await this.api.post('/salarios', dto);
    return response.data;
  }

  /**
   * Generar salarios masivamente
   */
  async generarSalariosMasivo(
    dto: GenerarSalariosDto,
  ): Promise<GenerarSalariosResponse> {
    const response = await this.api.post('/salarios/generar', dto);
    return response.data;
  }

  /**
   * Actualizar un salario
   */
  async update(id: number, dto: UpdateSalarioDto): Promise<ChoferSalario> {
    const response = await this.api.put(`/salarios/${id}`, dto);
    return response.data;
  }

  /**
   * Marcar salario como pagado
   */
  async marcarComoPagado(
    id: number,
    fechaPago: string,
    metodoPago: string,
    comprobante?: string,
  ): Promise<ChoferSalario> {
    const response = await this.api.put(
      `/salarios/${id}/pagar`,
      {
        fechaPago,
        metodoPago,
        comprobante,
      },
    );
    return response.data;
  }

  /**
   * Registrar pago parcial (adelanto/liquidación) para un salario
   */
  async registrarPago(id: number, dto: RegistrarPagoSalarioDto): Promise<ChoferSalario> {
    const response = await this.api.post(`/salarios/${id}/pagos`, dto);
    return response.data;
  }

  /**
   * Obtener pagos de un salario específico
   */
  async getPagosBySalario(id: number): Promise<SalarioPago[]> {
    const response = await this.api.get<unknown>(`/salarios/${id}/pagos`);
    return normalizeArrayResponse<SalarioPago>(response.data, 'pagos');
  }

  /**
   * Editar un pago de salario
   */
  async updatePago(
    salarioId: number,
    pagoId: number,
    dto: RegistrarPagoSalarioDto,
  ): Promise<ChoferSalario> {
    const response = await this.api.put(`/salarios/${salarioId}/pagos/${pagoId}`, dto);
    return response.data;
  }

  /**
   * Eliminar un pago de salario
   */
  async deletePago(salarioId: number, pagoId: number): Promise<void> {
    await this.api.delete(`/salarios/${salarioId}/pagos/${pagoId}`);
  }

  /**
   * Eliminar un salario
   */
  async delete(id: number): Promise<void> {
    await this.api.delete(`/salarios/${id}`);
  }
}

export const salariosService = new SalariosService();

export default salariosService;
