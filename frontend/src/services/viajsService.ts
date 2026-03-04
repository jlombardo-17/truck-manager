import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
}

export interface ViajRuta {
  id?: number;
  orden: number;
  latitud: number;
  longitud: number;
  direccion?: string;
  tiempo?: string;
  odometroKm?: number;
  notas?: string;
}

export interface ViajComision {
  id?: string;
  tipo: string;
  concepto?: string;
  montoBase?: number;
  porcentaje?: number;
  montoFijo?: number;
  montoTotal?: number;
  beneficiario?: string;
  estado?: string;
  notas?: string;
}

export const viajsService = {
  /**
   * Obtener todos los viajes
   */
  getAll: async (filters?: {
    estado?: string;
    camionId?: number;
    choferId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    try {
      let url = `${API_BASE_URL}/viajes`;
      const params = new URLSearchParams();

      if (filters) {
        if (filters.estado) params.append('estado', filters.estado);
        if (filters.camionId) params.append('camionId', filters.camionId.toString());
        if (filters.choferId) params.append('choferId', filters.choferId.toString());
        if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<Viaje[]>(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching viajes:', error);
      throw error;
    }
  },

  /**
   * Obtener un viaje por ID
   */
  getById: async (id: number) => {
    try {
      const response = await axios.get<Viaje>(`${API_BASE_URL}/viajes/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching viaje ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo viaje
   */
  create: async (viaje: Viaje) => {
    try {
      const response = await axios.post<Viaje>(`${API_BASE_URL}/viajes`, viaje, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating viaje:', error);
      throw error;
    }
  },

  /**
   * Actualizar un viaje
   */
  update: async (id: number, viaje: Partial<Viaje>) => {
    try {
      const response = await axios.patch<Viaje>(`${API_BASE_URL}/viajes/${id}`, viaje, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating viaje ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cambiar estado de un viaje
   */
  cambiarEstado: async (id: number, estado: string) => {
    try {
      const response = await axios.patch<Viaje>(
        `${API_BASE_URL}/viajes/${id}/estado`,
        { estado },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Error changing viaje ${id} status:`, error);
      throw error;
    }
  },

  /**
   * Obtener comisiones de un viaje
   */
  getComisiones: async (id: number) => {
    try {
      const response = await axios.get<ViajComision[]>(
        `${API_BASE_URL}/viajes/${id}/comisiones`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching comisiones for viaje ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener desglose económico de un viaje
   */
  getDesglose: async (id: number) => {
    try {
      const response = await axios.get<{
        valorViaje: number;
        costoCombustible: number;
        otrosGastos: number;
        totalComisiones: number;
        gananciaNeta: number;
      }>(`${API_BASE_URL}/viajes/${id}/desglose`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching desglose for viaje ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un viaje
   */
  delete: async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/viajes/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error(`Error deleting viaje ${id}:`, error);
      throw error;
    }
  },

  /**
   * Generar número de viaje (automático)
   */
  generateNroViaje: (): string => {
    const today = new Date();
    const yyyymmdd = today.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `VIAJE-${yyyymmdd}-${random}`;
  },
};
