import axios from 'axios';
import {
  ChoferSalario,
  CreateSalarioDto,
  UpdateSalarioDto,
  GenerarSalariosDto,
  GenerarSalariosResponse,
  ViajeConComision,
} from '../types/salario';

const API_BASE_URL = 'http://localhost:3000/api/salarios';

export const salariosService = {
  /**
   * Obtener todos los salarios (admin)
   */
  getAll: async (): Promise<ChoferSalario[]> => {
    const response = await axios.get(API_BASE_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Obtener salarios de un chofer específico
   */
  getByChofer: async (choferId: number): Promise<ChoferSalario[]> => {
    const response = await axios.get(`${API_BASE_URL}/chofer/${choferId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Obtener salarios por período (todos los choferes)
   */
  getByPeriodo: async (anio: number, mes: number): Promise<ChoferSalario[]> => {
    const response = await axios.get(`${API_BASE_URL}/periodo/${anio}/${mes}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Obtener salario específico de un chofer por período
   */
  getSalarioChoferPeriodo: async (
    choferId: number,
    anio: number,
    mes: number,
  ): Promise<ChoferSalario> => {
    const response = await axios.get(
      `${API_BASE_URL}/chofer/${choferId}/${anio}/${mes}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Obtener detalle de viajes y comisiones
   */
  getViajesConComisiones: async (
    choferId: number,
    anio: number,
    mes: number,
  ): Promise<{ viajes: ViajeConComision[]; totalComisiones: number }> => {
    const response = await axios.get(
      `${API_BASE_URL}/chofer/${choferId}/${anio}/${mes}/detalle`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Crear un nuevo registro de salario
   */
  create: async (dto: CreateSalarioDto): Promise<ChoferSalario> => {
    const response = await axios.post(API_BASE_URL, dto, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Generar salarios masivamente
   */
  generarSalariosMasivo: async (
    dto: GenerarSalariosDto,
  ): Promise<GenerarSalariosResponse> => {
    const response = await axios.post(`${API_BASE_URL}/generar`, dto, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Actualizar un salario
   */
  update: async (id: number, dto: UpdateSalarioDto): Promise<ChoferSalario> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, dto, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Marcar salario como pagado
   */
  marcarComoPagado: async (
    id: number,
    fechaPago: string,
    metodoPago: string,
    comprobante?: string,
  ): Promise<ChoferSalario> => {
    const response = await axios.put(
      `${API_BASE_URL}/${id}/pagar`,
      {
        fechaPago,
        metodoPago,
        comprobante,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Eliminar un salario
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

export default salariosService;
