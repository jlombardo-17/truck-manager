import { Logger } from '@nestjs/common';

/**
 * Cotización USD→UYU compartida (viajes, reportes).
 * Se consulta online y se cachea 15 minutos; si falla se usa USD_TO_UYU_RATE (default 40).
 */

export interface UsdUyuRateInfo {
  rate: number;
  source: string;
  fetchedAt: string;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const logger = new Logger('UsdUyuRate');
let rateCache: { rate: number; fetchedAtMs: number } | null = null;

export function getConfiguredUsdToUyuRate(): number {
  const parsed = Number(process.env.USD_TO_UYU_RATE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
}

export async function getUsdUyuRateInfo(): Promise<UsdUyuRateInfo> {
  const nowMs = Date.now();

  if (rateCache && nowMs - rateCache.fetchedAtMs < CACHE_TTL_MS) {
    return {
      rate: rateCache.rate,
      source: 'cache',
      fetchedAt: new Date(rateCache.fetchedAtMs).toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json() as { rates?: Record<string, unknown> };
    const rate = Number(payload?.rates?.UYU);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('Tipo de cambio UYU inválido en la respuesta externa');
    }

    rateCache = { rate, fetchedAtMs: nowMs };

    return {
      rate,
      source: 'open.er-api.com',
      fetchedAt: new Date(nowMs).toISOString(),
    };
  } catch (error) {
    const fallbackRate = getConfiguredUsdToUyuRate();
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`No se pudo obtener cotización online USD/UYU (${message}). Se usa fallback=${fallbackRate}`);
    return {
      rate: fallbackRate,
      source: 'fallback-env',
      fetchedAt: new Date(nowMs).toISOString(),
    };
  }
}
