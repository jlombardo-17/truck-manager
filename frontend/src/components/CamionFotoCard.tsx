import React, { useEffect, useRef, useState } from 'react';
import camionesService from '../services/camionesService';
import { Camion, FotoSugerida } from '../types/camion';
import '../styles/CamionFotoCard.css';

interface Props {
  camion: Camion;
  onUpdated: (camion: Camion) => void;
}

const MAX_LADO_PX = 1280;
const CALIDAD_JPEG = 0.82;

// Redimensiona en el navegador para no guardar fotos de varios MB en la DB
function redimensionarImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, MAX_LADO_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida'));
    };
    img.src = url;
  });
}

function creditoDeFoto(foto: FotoSugerida): string {
  return [foto.autor, foto.licencia, 'Wikimedia Commons'].filter(Boolean).join(' · ');
}

const CamionFotoCard: React.FC<Props> = ({ camion, onUpdated }) => {
  const [showBuscador, setShowBuscador] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guardarFoto = async (fotoUrl: string | null, fotoCredito: string | null) => {
    setIsSaving(true);
    setError(null);
    try {
      const actualizado = await camionesService.update(camion.id, { fotoUrl, fotoCredito });
      onUpdated(actualizado);
      return true;
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setError(msg || 'Error al guardar la foto');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await redimensionarImagen(file);
      await guardarFoto(dataUrl, null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuitar = () => {
    if (!window.confirm('¿Quitar la foto de este camión?')) return;
    guardarFoto(null, null);
  };

  const handleElegir = async (foto: FotoSugerida) => {
    if (await guardarFoto(foto.url, creditoDeFoto(foto))) setShowBuscador(false);
  };

  return (
    <div className="cf-card">
      {error && <div className="cv-error">{error}</div>}

      <div className="cf-body">
        <div className="cf-imagen-wrap">
          {camion.fotoUrl ? (
            <img src={camion.fotoUrl} alt={`${camion.marca} ${camion.modelo}`} className="cf-imagen" />
          ) : (
            <div className="cf-placeholder">
              <span className="cf-placeholder-icono">📷</span>
              <span>Sin foto del vehículo</span>
            </div>
          )}
        </div>

        <div className="cf-info">
          <p className="cf-modelo">
            {camion.marca} {camion.modelo} <span className="cf-anio">{camion.anio}</span>
          </p>
          {camion.fotoCredito && <p className="cf-credito">Foto: {camion.fotoCredito}</p>}

          <div className="cf-acciones">
            <button type="button" className="cv-btn-add" onClick={() => setShowBuscador(true)} disabled={isSaving}>
              🔍 Buscar foto del modelo
            </button>
            <button
              type="button"
              className="cv-btn-edit"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              ⬆️ Subir foto propia
            </button>
            {camion.fotoUrl && (
              <button type="button" className="cv-btn-delete" onClick={handleQuitar} disabled={isSaving}>
                Quitar
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleArchivo}
              hidden
            />
          </div>
          {isSaving && <p className="cf-estado">Guardando…</p>}
        </div>
      </div>

      {showBuscador && (
        <BuscadorFotos
          queryInicial={`${camion.marca} ${camion.modelo} truck`}
          isSaving={isSaving}
          onElegir={handleElegir}
          onClose={() => setShowBuscador(false)}
        />
      )}
    </div>
  );
};

// ─── Modal de búsqueda en Wikimedia Commons ─────────────────────────────────

interface BuscadorProps {
  queryInicial: string;
  isSaving: boolean;
  onElegir: (foto: FotoSugerida) => void;
  onClose: () => void;
}

const BuscadorFotos: React.FC<BuscadorProps> = ({ queryInicial, isSaving, onElegir, onClose }) => {
  const [query, setQuery] = useState(queryInicial);
  const [resultados, setResultados] = useState<FotoSugerida[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      setResultados(await camionesService.buscarFotos(q));
    } catch (err: any) {
      setError(err.message || 'Error al buscar fotos');
      setResultados(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Búsqueda inicial al abrir
  useEffect(() => {
    buscar(queryInicial);
  }, [queryInicial]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Buscar foto del modelo</h2>
          <button type="button" onClick={onClose} className="close-btn" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form
          className="cf-buscador-form"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(query);
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Scania 111 truck"
            aria-label="Buscar en Wikimedia Commons"
          />
          <button type="submit" className="cv-btn-add" disabled={isLoading}>
            Buscar
          </button>
        </form>
        <p className="cf-ayuda">
          Imágenes libres de Wikimedia Commons. Si no aparece el modelo, probá variantes (ej: "24.250" en vez de
          "24-250") o solo la marca y la serie.
        </p>

        {error && <div className="cv-error cf-modal-error">{error}</div>}

        <div className="cf-resultados">
          {isLoading && <p className="cf-estado">Buscando…</p>}
          {!isLoading && resultados?.length === 0 && <p className="cf-estado">Sin resultados para esa búsqueda.</p>}
          {!isLoading &&
            resultados?.map((foto) => (
              <button
                key={foto.url}
                type="button"
                className="cf-resultado"
                onClick={() => onElegir(foto)}
                disabled={isSaving}
                title={`Usar esta foto — ${creditoDeFoto(foto)}`}
              >
                <img src={foto.thumbUrl} alt={foto.titulo} loading="lazy" />
                <span className="cf-resultado-titulo">{foto.titulo}</span>
                {foto.licencia && <span className="cf-resultado-licencia">{foto.licencia}</span>}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CamionFotoCard;
