import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

export interface FotoSugerida {
  titulo: string;
  /** Miniatura para mostrar en la grilla de selección */
  thumbUrl: string;
  /** Imagen redimensionada (~1024px) que se guarda en el camión */
  url: string;
  /** Página de la imagen en Wikimedia Commons */
  paginaUrl: string;
  autor: string | null;
  licencia: string | null;
}

interface CommonsImageInfo {
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsResponse {
  query?: {
    pages?: Record<string, { title: string; index?: number; imageinfo?: CommonsImageInfo[] }>;
  };
}

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia exige un User-Agent identificable para clientes automatizados
const USER_AGENT = 'TruckManager/1.0 (https://github.com/jlombardo-17/truck-manager)';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIMES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PATRON_CAMION = /truck|lkw|cami[oó]n|caminh[aã]o|tractor|constellation|trailer/i;

@Injectable()
export class FotosVehiculoService {
  private readonly logger = new Logger(FotosVehiculoService.name);
  // Commons limita la tasa de pedidos (HTTP 429); cacheamos por consulta para no repetirlos
  private readonly cache = new Map<string, { expira: number; fotos: FotoSugerida[] }>();

  /**
   * Busca fotos para la consulta; si hay pocos resultados prueba variantes más laxas
   * (modelo normalizado, solo marca) porque los nombres comerciales varían mucho en Commons.
   */
  async buscar(query: string, limite = 12): Promise<FotoSugerida[]> {
    const q = query.trim();
    if (!q) return [];

    // Solo números de 3+ dígitos ("111", "250", "310"): los de 2 coinciden con fechas en los títulos
    const numerosModelo = q.match(/\d{3,}/g) ?? [];
    const puntaje = (foto: FotoSugerida) =>
      (numerosModelo.some((n) => foto.titulo.includes(n)) ? 2 : 0) + (PATRON_CAMION.test(foto.titulo) ? 1 : 0);

    const resultados: FotoSugerida[] = [];
    const vistas = new Set<string>();
    for (const variante of variantesDeBusqueda(q)) {
      let fotos: FotoSugerida[];
      try {
        fotos = await this.buscarEnCommonsCacheado(variante, limite);
      } catch (err) {
        // Si ya hay resultados de una variante anterior, devolvemos esos en vez de fallar
        if (resultados.length > 0) break;
        throw err;
      }
      for (const foto of fotos) {
        if (vistas.has(foto.url)) continue;
        vistas.add(foto.url);
        resultados.push(foto);
      }
      // Cortamos cuando ya hay suficientes resultados que mencionan el modelo
      if (resultados.filter((f) => puntaje(f) >= 2).length >= 4) break;
    }
    // sort es estable: dentro del mismo puntaje se respeta el orden de Commons
    return resultados.sort((a, b) => puntaje(b) - puntaje(a)).slice(0, limite);
  }

  private async buscarEnCommonsCacheado(q: string, limite: number): Promise<FotoSugerida[]> {
    const clave = `${q.toLowerCase()}|${limite}`;
    const cacheado = this.cache.get(clave);
    if (cacheado && cacheado.expira > Date.now()) return cacheado.fotos;
    const fotos = await this.buscarEnCommons(q, limite);
    if (this.cache.size >= 500) this.cache.clear();
    this.cache.set(clave, { expira: Date.now() + CACHE_TTL_MS, fotos });
    return fotos;
  }

  private async buscarEnCommons(q: string, limite: number): Promise<FotoSugerida[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrnamespace: '6', // namespace File:
      gsrsearch: `${q} filetype:bitmap`,
      gsrlimit: String(limite),
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '1024',
      iiextmetadatafilter: 'Artist|LicenseShortName',
    });

    let data: CommonsResponse;
    try {
      const res = await fetch(`${COMMONS_API}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()) as CommonsResponse;
    } catch (err) {
      this.logger.warn(`Búsqueda en Wikimedia Commons falló: ${(err as Error).message}`);
      throw new BadGatewayException('No se pudo consultar Wikimedia Commons');
    }

    const pages = Object.values(data.query?.pages ?? {});
    return pages
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .flatMap((page) => {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl || !info.mime || !MIMES_PERMITIDOS.has(info.mime)) return [];
        const meta = info.extmetadata ?? {};
        return [
          {
            titulo: page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
            thumbUrl: info.thumburl.replace(/\/1024px-/, '/320px-'),
            url: info.thumburl,
            paginaUrl: info.descriptionurl ?? '',
            autor: truncar(stripHtml(meta.Artist?.value), 120),
            licencia: truncar(stripHtml(meta.LicenseShortName?.value), 60),
          },
        ];
      });
  }
}

function stripHtml(value?: string): string | null {
  if (!value) return null;
  const text = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text || null;
}

function truncar(value: string | null, max: number): string | null {
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * "Scania 111lk truck" → ["Scania 111lk truck", "Scania 111 truck", "Scania 111", "Scania truck"]
 * "Volkswagen 24-250 truck" → [..., "Volkswagen 24.250 truck", "Volkswagen 24.250", "Volkswagen truck"]
 */
function variantesDeBusqueda(q: string): string[] {
  const tokens = q.split(/\s+/);
  const esSufijo = (t: string) => /^(truck|camion|camión)$/i.test(t);
  const sufijo = esSufijo(tokens[tokens.length - 1]) ? tokens.pop()! : 'truck';
  const normalizados = tokens.map((t) => t.replace(/^(\d+)[a-z]+$/i, '$1').replace(/(\d)-(\d)/g, '$1.$2'));
  const variantes = [q, `${normalizados.join(' ')} ${sufijo}`, normalizados.join(' ')];
  if (tokens.length > 1) variantes.push(`${tokens[0]} ${sufijo}`);
  return [...new Set(variantes)];
}
