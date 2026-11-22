import { Logger } from '@nestjs/common';

/**
 * Precio del litro de gasoil 50-S en UYU (precio máximo de venta ANCAP).
 *
 * Fuente: serie histórica de datosUruguay.com (origen ANCAP, licencia CC-BY-4.0,
 * requiere atribución). Se descarga la serie completa (~400 puntos) y se cachea
 * 6 horas; los precios se ajustan como mucho una vez por mes.
 * Si la fuente falla se usa la última serie cacheada o, si no hay,
 * GASOIL_PRECIO_LITRO_UYU del entorno.
 */

export interface PrecioGasoilInfo {
  /** null si no hay fuente online ni fallback configurado */
  precioPorLitro: number | null;
  /** Fecha (YYYY-MM-DD) desde la que rige el precio devuelto */
  vigenteDesde: string | null;
  source: 'datosuruguay.com' | 'cache' | 'fallback-env' | 'sin-datos';
  attribution: { text: string; url: string } | null;
}

const API_URL = 'https://datosuruguay.com/api/v1/fuel-prices?limit=1000';
const SERIE_GASOIL = 'gasoil50s';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_ATTRIBUTION = { text: 'Datos de datosUruguay.com', url: 'https://datosuruguay.com/combustible' };

const logger = new Logger('PrecioGasoil');

type PuntoPrecio = { fecha: string; precio: number };
let serieCache: { puntos: PuntoPrecio[]; attribution: { text: string; url: string }; fetchedAtMs: number } | null =
  null;

async function descargarSerie(): Promise<{ puntos: PuntoPrecio[]; attribution: { text: string; url: string } }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(API_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ date?: unknown; series?: unknown; value?: unknown }>;
      meta?: { attribution?: { text?: unknown; url?: unknown } };
    };

    const puntos = (payload.data ?? [])
      .filter((p) => p.series === SERIE_GASOIL)
      .map((p) => ({ fecha: String(p.date ?? '').slice(0, 10), precio: Number(p.value) }))
      .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.fecha) && Number.isFinite(p.precio) && p.precio > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (puntos.length === 0) {
      throw new Error(`La respuesta no trae la serie ${SERIE_GASOIL}`);
    }

    const attr = payload.meta?.attribution;
    const attribution =
      typeof attr?.text === 'string' && typeof attr?.url === 'string'
        ? { text: attr.text, url: attr.url }
        : DEFAULT_ATTRIBUTION;

    return { puntos, attribution };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Precio vigente en `fecha` (YYYY-MM-DD): el último punto con fecha <= fecha. */
function precioVigente(puntos: PuntoPrecio[], fecha: string): PuntoPrecio | null {
  let vigente: PuntoPrecio | null = null;
  for (const punto of puntos) {
    if (punto.fecha > fecha) break;
    vigente = punto;
  }
  return vigente;
}

function getFallbackEnv(): number | null {
  const parsed = Number(process.env.GASOIL_PRECIO_LITRO_UYU);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * @param fecha YYYY-MM-DD; por defecto hoy. Para viajes pasados devuelve el precio que regía ese día.
 */
export async function getPrecioGasoilInfo(fecha?: string): Promise<PrecioGasoilInfo> {
  const fechaConsulta = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();
  let source: PrecioGasoilInfo['source'] = 'cache';

  if (!serieCache || nowMs - serieCache.fetchedAtMs >= CACHE_TTL_MS) {
    try {
      const { puntos, attribution } = await descargarSerie();
      serieCache = { puntos, attribution, fetchedAtMs: nowMs };
      source = 'datosuruguay.com';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`No se pudo obtener el precio del gasoil online (${message})`);
    }
  }

  if (serieCache) {
    const vigente = precioVigente(serieCache.puntos, fechaConsulta);
    if (vigente) {
      return {
        precioPorLitro: vigente.precio,
        vigenteDesde: vigente.fecha,
        source,
        attribution: serieCache.attribution,
      };
    }
  }

  const fallback = getFallbackEnv();
  return {
    precioPorLitro: fallback,
    vigenteDesde: null,
    source: fallback !== null ? 'fallback-env' : 'sin-datos',
    attribution: null,
  };
}
