import axios from 'axios';
import { getTodayLocalInputValue, toDateInputValue } from '../utils/dateUtils';
import { Cliente } from '../types/cliente';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDateString = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = toDateInputValue(value);
  return normalized || undefined;
};

const normalizeArrayResponse = <T>(value: unknown, fieldName?: string): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (fieldName && Array.isArray(record[fieldName])) {
      return record[fieldName] as T[];
    }

    const commonArrayFields = ['data', 'items', 'results'];
    for (const key of commonArrayFields) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeArrayResponse<T>(parsed, fieldName);
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeMonedaTarifa = (value: unknown): 'UYU' | 'USD' | null =>
  value === 'USD' ? 'USD' : value ? 'UYU' : null;

const normalizeViajeResponse = (value: unknown): Viaje => {
  const viaje = (value || {}) as Viaje & Record<string, unknown>;
  return {
    ...viaje,
    moneda: viaje.moneda === 'USD' ? 'USD' : 'UYU',
    valorViajeUyu: toNumberOrUndefined(viaje.valorViajeUyu) ?? toNumberOrUndefined(viaje.valor_viaje_uyu),
    cotizacionUsdUyu:
      toNumberOrUndefined(viaje.cotizacionUsdUyu) ?? toNumberOrUndefined(viaje.cotizacion_usd_uyu),
    tarifaPorTonelada:
      toNumberOrUndefined(viaje.tarifaPorTonelada) ?? toNumberOrUndefined(viaje.tarifa_por_tonelada) ?? null,
    monedaTarifa: normalizeMonedaTarifa(viaje.monedaTarifa ?? viaje.moneda_tarifa),
    camionId: toNumberOrUndefined(viaje.camionId) ?? toNumberOrUndefined((viaje.camion as { id?: unknown } | undefined)?.id) ?? 0,
    choferId: toNumberOrUndefined(viaje.choferId) ?? toNumberOrUndefined((viaje.chofer as { id?: unknown } | undefined)?.id) ?? 0,
    clienteId: toNumberOrUndefined(viaje.clienteId) ?? toNumberOrUndefined(viaje.cliente?.id) ?? null,
    rutas: normalizeArrayResponse<ViajRuta>(viaje.rutas, 'rutas'),
    comisiones: normalizeArrayResponse<ViajComision>(viaje.comisiones, 'comisiones'),
  };
};

const sanitizeComisiones = (
  comisiones?: ViajComision[],
  options?: { includeEstado?: boolean },
): ViajComision[] | undefined => {
  if (!comisiones || comisiones.length === 0) return undefined;

  return comisiones.map((comision) => ({
    tipo: comision.tipo,
    concepto: comision.concepto,
    montoBase: toNumberOrUndefined(comision.montoBase),
    porcentaje: toNumberOrUndefined(comision.porcentaje),
    montoFijo: toNumberOrUndefined(comision.montoFijo),
    moneda: comision.moneda === 'USD' ? 'USD' : 'UYU',
    beneficiario: comision.beneficiario,
    choferId: comision.choferId ?? undefined,
    ...(options?.includeEstado ? { estado: comision.estado } : {}),
    notas: comision.notas,
  }));
};

const sanitizeViajePayload = (
  viaje: Partial<Viaje>,
  options?: { includeEstado?: boolean },
): Partial<Viaje> => {
  const payload: Partial<Viaje> = {
    numeroViaje: viaje.numeroViaje,
    origen: viaje.origen,
    destino: viaje.destino,
    descripcionCarga: viaje.descripcionCarga,
    documentoDescarga: viaje.documentoDescarga,
    documentoDescargaNombre: viaje.documentoDescargaNombre,
    documentoDescargaAdjunto: viaje.documentoDescargaAdjunto,
    documentosDescargaAdjuntos: viaje.documentosDescargaAdjuntos,
    notas: viaje.notas,
    fechaInicio: toDateString(viaje.fechaInicio),
    fechaFin: toDateString(viaje.fechaFin),
    fechaPago: toDateString(viaje.fechaPago),
    moneda: viaje.moneda === 'USD' ? 'USD' : 'UYU',
    camionId: toNumberOrUndefined(viaje.camionId),
    choferId: toNumberOrUndefined(viaje.choferId),
    // null desasigna el cliente; undefined (sin la clave) lo deja como está
    clienteId: viaje.clienteId === undefined ? undefined : toNumberOrUndefined(viaje.clienteId) ?? null,
    valorViaje: toNumberOrUndefined(viaje.valorViaje),
    kmRecorridos: toNumberOrUndefined(viaje.kmRecorridos),
    consumoCombustible: toNumberOrUndefined(viaje.consumoCombustible),
    costoCombustible: toNumberOrUndefined(viaje.costoCombustible),
    otrosGastos: toNumberOrUndefined(viaje.otrosGastos),
    pesoCargaKg: toNumberOrUndefined(viaje.pesoCargaKg),
    // null explícito para poder borrar la tarifa al editar
    tarifaPorTonelada: toNumberOrUndefined(viaje.tarifaPorTonelada) ?? null,
    monedaTarifa:
      toNumberOrUndefined(viaje.tarifaPorTonelada) != null
        ? viaje.monedaTarifa === 'USD' ? 'USD' : 'UYU'
        : null,
    latitudOrigen: toNumberOrUndefined(viaje.latitudOrigen),
    longitudOrigen: toNumberOrUndefined(viaje.longitudOrigen),
    latitudDestino: toNumberOrUndefined(viaje.latitudDestino),
    longitudDestino: toNumberOrUndefined(viaje.longitudDestino),
    comisiones: sanitizeComisiones(viaje.comisiones, {
      includeEstado: Boolean(options?.includeEstado),
    }),
  };

  if (options?.includeEstado) {
    payload.estado = viaje.estado;
  }

  return payload;
};

export interface ViajeDocumentoAdjunto {
  nombre: string;
  adjunto: string; // data URL (base64)
}

export interface Viaje {
  id?: number;
  numeroViaje: string;
  camionId: number;
  choferId: number;
  clienteId?: number | null;
  cliente?: Pick<Cliente, 'id' | 'nombre'> | null;
  fechaInicio: string;
  fechaFin?: string;
  fechaPago?: string;
  origen: string;
  destino: string;
  latitudOrigen?: number;
  longitudOrigen?: number;
  latitudDestino?: number;
  longitudDestino?: number;
  descripcionCarga?: string;
  documentoDescarga?: string;
  documentoDescargaNombre?: string;
  documentoDescargaAdjunto?: string;
  documentosDescargaAdjuntos?: ViajeDocumentoAdjunto[];
  pesoCargaKg?: number;
  tarifaPorTonelada?: number | null;
  monedaTarifa?: 'UYU' | 'USD' | null;
  valorViaje: number;
  moneda?: 'UYU' | 'USD';
  valorViajeUyu?: number;
  cotizacionUsdUyu?: number;
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
  /** Moneda de montoBase/montoFijo. montoTotal siempre en UYU. */
  moneda?: 'UYU' | 'USD';
  montoTotal?: number;
  beneficiario?: string;
  choferId?: number | null;
  estado?: string;
  notas?: string;
}

export interface PrecioGasoilInfo {
  /** UYU por litro; null si no hay fuente disponible */
  precioPorLitro: number | null;
  /** YYYY-MM-DD desde la que rige el precio */
  vigenteDesde: string | null;
  source: 'datosuruguay.com' | 'cache' | 'fallback-env' | 'sin-datos';
  attribution: { text: string; url: string } | null;
}

export const viajsService = {
  /** Precio del litro de gasoil 50-S (ANCAP) vigente en `fecha` (YYYY-MM-DD). */
  getPrecioGasoil: async (fecha?: string): Promise<PrecioGasoilInfo> => {
    const response = await axios.get<PrecioGasoilInfo>(`${API_BASE_URL}/viajes/combustible/precio-gasoil`, {
      params: fecha ? { fecha } : undefined,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    return response.data;
  },

  getUsdUyuRate: async (): Promise<{ rate: number; source: string; fetchedAt: string }> => {
    const response = await axios.get<{ rate: number; source: string; fetchedAt: string }>(
      `${API_BASE_URL}/viajes/tipo-cambio/usd-uyu`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Obtener todos los viajes
   */
  getAll: async (filters?: {
    estado?: string;
    camionId?: number;
    choferId?: number;
    clienteId?: number;
    /** YYYY-MM-DD: rango sobre la fecha de inicio del viaje (inclusive) */
    fechaDesde?: string;
    fechaHasta?: string;
  }) => {
    try {
      let url = `${API_BASE_URL}/viajes`;
      const params = new URLSearchParams();

      if (filters) {
        if (filters.estado) params.append('estado', filters.estado);
        if (filters.camionId) params.append('camionId', filters.camionId.toString());
        if (filters.choferId) params.append('choferId', filters.choferId.toString());
        if (filters.clienteId) params.append('clienteId', filters.clienteId.toString());
        if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
        if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<unknown>(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return normalizeArrayResponse<Viaje>(response.data).map(normalizeViajeResponse);
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
      const response = await axios.get<unknown>(`${API_BASE_URL}/viajes/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return normalizeViajeResponse(response.data);
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
      const payload = sanitizeViajePayload(viaje, { includeEstado: true });
      const response = await axios.post<Viaje>(`${API_BASE_URL}/viajes`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
      const payload = sanitizeViajePayload(viaje, { includeEstado: true });
      const response = await axios.patch<Viaje>(`${API_BASE_URL}/viajes/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
      const response = await axios.get<unknown>(
        `${API_BASE_URL}/viajes/${id}/comisiones`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        },
      );
      return normalizeArrayResponse<ViajComision>(response.data, 'comisiones');
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
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
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
    const yyyymmdd = getTodayLocalInputValue().replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `VIAJE-${yyyymmdd}-${random}`;
  },

  /**
   * Obtener las rutas de un viaje
   */
  getRoutes: async (viajeId: number): Promise<ViajRuta[]> => {
    try {
      const response = await axios.get<unknown>(`${API_BASE_URL}/viajes/${viajeId}/rutas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return normalizeArrayResponse<ViajRuta>(response.data, 'rutas');
    } catch (error) {
      console.error(`Error fetching rutas for viaje ${viajeId}:`, error);
      throw error;
    }
  },

  /**
   * Guardar/actualizar las rutas de un viaje
   */
  saveRoutes: async (
    viajeId: number,
    rutas: ViajRuta[],
    kmRecorridos?: number,
  ): Promise<ViajRuta[]> => {
    try {
      const sanitizedRutas = rutas.map((ruta, index) => ({
        orden: Number(ruta.orden) || index + 1,
        latitud: Number(ruta.latitud),
        longitud: Number(ruta.longitud),
        direccion: ruta.direccion,
        odometroKm: toNumberOrUndefined(ruta.odometroKm),
        notas: ruta.notas,
      }));

      const response = await axios.post<ViajRuta[]>(
        `${API_BASE_URL}/viajes/${viajeId}/rutas`,
        {
          rutas: sanitizedRutas,
          kmRecorridos: toNumberOrUndefined(kmRecorridos),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return normalizeArrayResponse<ViajRuta>(response.data, 'rutas');
    } catch (error) {
      console.error(`Error saving rutas for viaje ${viajeId}:`, error);
      throw error;
    }
  },
};
