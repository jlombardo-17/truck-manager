import React, { useEffect, useState } from 'react';
import {
  ConfiguracionVehicular,
  ICONO_SECCION,
  LABELS_COMBINACION,
  LABELS_SECCION,
  PLANTILLAS_COMBINACION,
  SeccionVehicular,
  TIPOS_COMBINACION,
  TIPOS_SECCION,
  TipoCombinacion,
  TipoSeccion,
} from '../types/configuracionVehicular';
import { configuracionVehicularService } from '../services/configuracionVehicularService';
import '../styles/ConfiguracionVehicularTab.css';

interface Props {
  camionId: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function calcTotales(secciones: SeccionVehicular[]) {
  const pesoVacioTotal = secciones.reduce((s, sec) => s + (sec.pesoVacioKg ?? 0), 0);
  const capacidadTotal = secciones.reduce((s, sec) => s + (sec.capacidadCargaKg ?? 0), 0);
  const pbvTotal = pesoVacioTotal + capacidadTotal;
  return { pesoVacioTotal, capacidadTotal, pbvTotal };
}

function fmt(n: number) {
  return n.toLocaleString('es-AR');
}
// ─── SVG Diagrama de ejes (perfil lateral) ────────────────────────────────

const WHEEL_R = 9;
const GROUND_Y = 84;
const wheelCY = GROUND_Y - WHEEL_R;          // 75
const CHASSIS_Y = 52;
const CHASSIS_H = 6;
const chassisBottom = CHASSIS_Y + CHASSIS_H; // 58
const DIAG_H = 96;

const WheelSvg: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <circle cx={cx} cy={cy} r={WHEEL_R} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.46} fill="#94a3b8" />
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.18} fill="#334155" />
  </g>
);

function getSvgWidth(tipo: TipoSeccion, ejes: number): number {
  const rearExtra = (n: number) => Math.max(0, n - 1) * 20; // gap per extra rear axle
  switch (tipo) {
    case 'tractora':      return Math.max(165, 148 + rearExtra(Math.max(1, ejes - 1)));
    case 'camion':        return Math.max(200, 185 + rearExtra(Math.max(1, ejes - 1)));
    case 'dolly':         return Math.max(118, 80 + ejes * 23);
    case 'zorra':         return Math.max(215, 195 + rearExtra(Math.max(1, ejes - 1)));
    case 'semirremolque':
    case 'acoplado':
    default:              return Math.max(215, 195 + rearExtra(ejes));
  }
}

function getAxleXs(tipo: TipoSeccion, ejes: number, W: number): number[] {
  const GAP = 20;

  if (tipo === 'tractora') {
    // 1 front steering axle + the rest are rear drive
    const frontX = 33;
    const rearBase = 115;
    const rearCount = Math.max(1, ejes - 1);
    return [frontX, ...Array.from({ length: rearCount }, (_, i) => rearBase + i * GAP)];
  }

  if (tipo === 'camion') {
    if (ejes <= 1) {
      // single axle: rear only
      return [W - 40];
    }
    // ejes >= 2: 1 front steering + (ejes-1) rear drive
    const frontX = 31;
    const rearBase = W - 40 - (ejes - 2) * GAP;
    return [frontX, ...Array.from({ length: ejes - 1 }, (_, i) => rearBase + i * GAP)];
  }

  if (tipo === 'zorra') {
    if (ejes <= 1) {
      // single axle: rear only
      return [W - 30];
    }
    // ejes >= 2: 1 front steering + (ejes-1) rear
    const frontX = 42;
    const rearBase = W - 30 - (ejes - 2) * GAP;
    return [frontX, ...Array.from({ length: ejes - 1 }, (_, i) => rearBase + i * GAP)];
  }

  if (tipo === 'dolly') {
    // all axles grouped at rear
    const lastX = W - 28;
    return Array.from({ length: ejes }, (_, i) => lastX - (ejes - 1 - i) * GAP);
  }

  // semirremolque, acoplado: all axles at rear
  const lastX = W - 26;
  return Array.from({ length: ejes }, (_, i) => lastX - (ejes - 1 - i) * GAP);
}

function renderVehicleBody(tipo: TipoSeccion, W: number): JSX.Element {
  const cy = CHASSIS_Y;
  switch (tipo) {
    case 'tractora':
      return (
        <g>
          {/* Chassis */}
          <rect x="8" y={cy} width={W - 16} height={CHASSIS_H} rx="2" fill="#1e293b" />
          {/* Cab block */}
          <rect x="8" y="9" width="87" height={cy - 9} rx="3" fill="#3b4a6b" />
          {/* Windshield */}
          <rect x="11" y="12" width="81" height="24" rx="2" fill="#60a5fa" opacity="0.45" />
          {/* Rear side window */}
          <rect x="73" y="14" width="18" height="16" rx="1.5" fill="#60a5fa" opacity="0.28" />
          {/* Front bumper */}
          <rect x="8" y={cy - 6} width="14" height="10" rx="1.5" fill="#374151" />
          {/* Mirror arm */}
          <rect x="2" y="25" width="9" height="3" rx="1" fill="#475569" />
          {/* Mirror glass */}
          <rect x="0" y="21" width="6" height="9" rx="1" fill="#64748b" />
          {/* Door handle */}
          <rect x="38" y={cy - 17} width="12" height="2" rx="1" fill="#64748b" />
          {/* 5th wheel saddle */}
          <rect x="74" y={cy - 5} width="32" height="7" rx="2.5" fill="#475569" />
          <ellipse cx="90" cy={cy + 1} rx="14" ry="3.5" fill="#64748b" />
        </g>
      );
    case 'camion':
      return (
        <g>
          {/* Chassis */}
          <rect x="8" y={cy} width={W - 16} height={CHASSIS_H} rx="2" fill="#1e293b" />
          {/* Cab */}
          <rect x="8" y="12" width="72" height={cy - 12} rx="3" fill="#3b4a6b" />
          {/* Windshield */}
          <rect x="11" y="15" width="66" height="20" rx="2" fill="#60a5fa" opacity="0.45" />
          {/* Side window */}
          <rect x="55" y="15" width="20" height="14" rx="1.5" fill="#60a5fa" opacity="0.28" />
          {/* Bumper */}
          <rect x="8" y={cy - 5} width="12" height="9" rx="1.5" fill="#374151" />
          {/* Mirror arm */}
          <rect x="2" y="26" width="8" height="2.5" rx="1" fill="#475569" />
          {/* Mirror */}
          <rect x="0" y="22" width="6" height="7" rx="1" fill="#64748b" />
          {/* Cargo box — starts at x=82, ends near rear */}
          <rect x="82" y="9" width={W - 94} height={cy - 9} rx="2" fill="#4a5568" />
          {/* Box panel lines spaced evenly */}
          {Array.from({ length: Math.floor((W - 110) / 24) }, (_, i) => 108 + i * 24)
            .filter(x => x < W - 16)
            .map((x, i) => (
              <line key={i} x1={x} y1="10" x2={x} y2={cy - 1} stroke="#5a6880" strokeWidth="0.8" />
          ))}
          {/* Rear door */}
          <rect x={W - 14} y="10" width="4" height={cy - 10} rx="1" fill="#374151" />
        </g>
      );
    case 'semirremolque':
      return (
        <g>
          {/* Chassis */}
          <rect x="30" y={cy} width={W - 38} height={CHASSIS_H} rx="2" fill="#1e293b" />
          {/* Body with kingpin cutout front-bottom */}
          <polygon points={`30,9 ${W - 13},9 ${W - 13},${cy} 48,${cy} 48,41 30,41`} fill="#4a5568" />
          {/* Top edge highlight */}
          <line x1="30" y1="10" x2={W - 13} y2="10" stroke="#334155" strokeWidth="1.5" />
          {/* Panel dividers */}
          {[68, 98, 128, 158, 188].filter(x => x < W - 17).map((x, i) => (
            <line key={i} x1={x} y1="11" x2={x} y2={cy - 1} stroke="#5a6880" strokeWidth="0.8" />
          ))}
          {/* Rear door */}
          <rect x={W - 19} y="10" width="5" height={cy - 10} rx="1" fill="#374151" />
          {/* Kingpin shaft */}
          <rect x="32" y="39" width="9" height="21" rx="2.5" fill="#374151" />
        </g>
      );
    case 'acoplado':
      return (
        <g>
          {/* Chassis */}
          <rect x="10" y={cy} width={W - 18} height={CHASSIS_H} rx="2" fill="#1e293b" />
          {/* Box body */}
          <rect x="24" y="9" width={W - 36} height={cy - 9} rx="2" fill="#4a5568" />
          {/* Top rail */}
          <line x1="24" y1="10" x2={W - 14} y2="10" stroke="#334155" strokeWidth="1.5" />
          {/* Panel lines */}
          {[50, 80, 110, 140, 170].filter(x => x < W - 18).map((x, i) => (
            <line key={i} x1={x} y1="10" x2={x} y2={cy - 1} stroke="#5a6880" strokeWidth="0.8" />
          ))}
          {/* Rear door */}
          <rect x={W - 18} y="10" width="4" height={cy - 10} rx="1" fill="#374151" />
          {/* Drawbar arm */}
          <rect x="10" y={cy - 10} width="18" height="5" rx="2" fill="#375569" />
          {/* Coupling ring */}
          <circle cx="10" cy={cy - 7} r="6" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="10" cy={cy - 7} r="2.5" fill="#334155" />
        </g>
      );
    case 'zorra':
      return (
        <g>
          {/* Chassis */}
          <rect x="8" y={cy} width={W - 16} height={CHASSIS_H} rx="2" fill="#1e293b" />
          {/* Low flatbed platform */}
          <rect x="8" y={cy - 14} width={W - 16} height="14" rx="1" fill="#4a5568" />
          {/* Front steering-axle housing / neck piece */}
          <rect x="8" y="25" width="42" height={cy - 25} rx="2" fill="#374151" />
          {/* Neck highlight */}
          <rect x="10" y="27" width="38" height={cy - 29} rx="1" fill="#475569" />
          {/* Kingpin / coupling ring */}
          <circle cx="18" cy={cy - 6} r="7" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="18" cy={cy - 6} r="3" fill="#334155" />
          {/* Flatbed body starts after steering section */}
          <rect x="50" y="10" width={W - 62} height={cy - 14} rx="1" fill="#4a5568" />
          {/* Rear stop */}
          <rect x={W - 17} y="14" width="7" height={cy - 16} rx="1.5" fill="#374151" />
          {/* Floor plank lines */}
          {[68, 90, 112, 134, 156, 178].filter(x => x < W - 20).map((x, i) => (
            <line key={i} x1={x} y1={cy - 13} x2={x} y2={cy - 1} stroke="#5a6880" strokeWidth="0.8" />
          ))}
          {/* Side stakes */}
          {[68, 99, 130, 161].filter(x => x < W - 22).map((x, i) => (
            <line key={i} x1={x} y1={cy - 26} x2={x} y2={cy - 14} stroke="#475569" strokeWidth="2" />
          ))}
          {/* Top rail */}
          <line x1="50" y1={cy - 26} x2={W - 10} y2={cy - 26} stroke="#64748b" strokeWidth="1.5" />
        </g>
      );
    case 'dolly':
      return (
        <g>
          {/* Frame */}
          <rect x="10" y={cy - 4} width={W - 20} height={CHASSIS_H + 4} rx="2" fill="#1e293b" />
          {/* Turntable (front kingpin coupling) */}
          <circle cx="26" cy={cy - 11} r="14" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="26" cy={cy - 11} r="7" fill="#64748b" />
          <circle cx="26" cy={cy - 11} r="2.5" fill="#334155" />
          {/* Frame bar */}
          <rect x="14" y={cy - 15} width={W - 28} height="8" rx="2" fill="#374151" />
          {/* 5th wheel platform (rear, for next trailer) */}
          <rect x={W - 38} y={cy - 4} width="28" height="6" rx="2" fill="#475569" />
          <ellipse cx={W - 24} cy={cy + 2} rx="13" ry="3.5" fill="#64748b" />
        </g>
      );
    default:
      return <g />;
  }
}
// ─── Bloque visual de sección ────────────────────────────────────────────────

interface SeccionBlockProps {
  seccion: SeccionVehicular;
  index: number;
}

const SeccionBlock: React.FC<SeccionBlockProps> = ({ seccion }) => {
  const esCabeza = seccion.tipo === 'tractora' || seccion.tipo === 'camion';
  const capacidad = seccion.capacidadCargaKg ?? 0;
  const pesoVacio = seccion.pesoVacioKg ?? 0;
  const usoPct = capacidad > 0 ? Math.min(100, Math.round((pesoVacio / (pesoVacio + capacidad)) * 100)) : 0;
  const pbvKg = pesoVacio + capacidad;
  const W = getSvgWidth(seccion.tipo, seccion.ejes);
  const axleXs = getAxleXs(seccion.tipo, seccion.ejes, W);
  const tPerAxle = pbvKg > 0 && seccion.ejes > 0 ? pbvKg / seccion.ejes / 1000 : null;

  return (
    <div className={`cv-seccion-block ${esCabeza ? 'cv-seccion-cabeza' : 'cv-seccion-trailer'}`}>
      {/* Tipo header */}
      <div className="cv-seccion-tipo">
        <span className="cv-seccion-icono">{ICONO_SECCION[seccion.tipo]}</span>
        <span className="cv-seccion-nombre">{LABELS_SECCION[seccion.tipo]}</span>
      </div>

      {/* SVG vehicle side-profile diagram */}
      <div className="cv-diagrama-wrap">
        <svg
          viewBox={`0 0 ${W} ${DIAG_H}`}
          width="100%"
          className="cv-diagrama-svg"
          aria-label={`${LABELS_SECCION[seccion.tipo]} – ${seccion.ejes} ${seccion.ejes === 1 ? 'eje' : 'ejes'}`}
        >
          {/* Ground dashed line */}
          <line x1="4" y1={GROUND_Y} x2={W - 4} y2={GROUND_Y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,4" />
          {/* Vehicle body silhouette */}
          {renderVehicleBody(seccion.tipo, W)}
          {/* Axle rods (chassis → wheel) */}
          {axleXs.map((x, i) => (
            <rect
              key={i}
              x={x - 1.5}
              y={chassisBottom}
              width="3"
              height={wheelCY - WHEEL_R - chassisBottom}
              rx="1.5"
              fill="#475569"
            />
          ))}
          {/* Wheel circles */}
          {axleXs.map((x, i) => (
            <WheelSvg key={i} cx={x} cy={wheelCY} />
          ))}
          {/* Per-axle weight label */}
          {tPerAxle !== null && axleXs.map((x, i) => (
            <text
              key={i}
              x={x}
              y={GROUND_Y + 11}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="500"
            >
              {tPerAxle.toFixed(1)}t
            </text>
          ))}
        </svg>
      </div>

      {/* Dimensiones */}
      {(seccion.largoM || seccion.anchoM || seccion.altoM) && (
        <div className="cv-dimensiones">
          {seccion.largoM && <span title="Largo">↔ {seccion.largoM}m</span>}
          {seccion.anchoM && <span title="Ancho">↕ {seccion.anchoM}m</span>}
          {seccion.altoM  && <span title="Alto">⬆ {seccion.altoM}m</span>}
        </div>
      )}

      {/* Pesos */}
      <div className="cv-pesos">
        <div className="cv-peso-item">
          <span className="cv-peso-label">Vacío</span>
          <span className="cv-peso-valor">{pesoVacio > 0 ? `${fmt(pesoVacio)} kg` : '—'}</span>
        </div>
        <div className="cv-peso-item">
          <span className="cv-peso-label">Cap. carga</span>
          <span className="cv-peso-valor cv-capacidad">
            {capacidad > 0 ? `${fmt(capacidad)} kg` : '—'}
          </span>
        </div>
      </div>

      {/* Barra distribución */}
      {(pesoVacio > 0 || capacidad > 0) && (
        <div className="cv-barra-wrap">
          <div className="cv-barra-vacio" style={{ width: `${usoPct}%` }} title={`Peso vacío: ${usoPct}% del PBV`} />
          <div className="cv-barra-carga" style={{ width: `${100 - usoPct}%` }} title={`Capacidad: ${100 - usoPct}% del PBV`} />
        </div>
      )}
    </div>
  );
};

// ─── Formulario de edición de sección ────────────────────────────────────────

interface SeccionFormProps {
  seccion: SeccionVehicular;
  index: number;
  onChange: (index: number, field: keyof SeccionVehicular, value: string | number) => void;
}

const SeccionForm: React.FC<SeccionFormProps> = ({ seccion, index, onChange }) => {
  const numField = (
    label: string,
    field: keyof SeccionVehicular,
    unit: string,
    required?: boolean,
  ) => (
    <div className="cv-form-field">
      <label>
        {label} {required && <span className="required">*</span>}
        <span className="cv-field-unit">{unit}</span>
      </label>
      <input
        type="number"
        min={field === 'ejes' ? 1 : 0}
        step={field === 'ejes' ? 1 : 0.01}
        value={(seccion[field] as number | undefined) ?? ''}
        onChange={(e) =>
          onChange(index, field, e.target.value === '' ? 0 : parseFloat(e.target.value))
        }
        required={required}
      />
    </div>
  );

  return (
    <div className="cv-seccion-form-card">
      <div className="cv-seccion-form-header">
        <span className="cv-seccion-icono">{ICONO_SECCION[seccion.tipo]}</span>
        <select
          value={seccion.tipo}
          onChange={(e) => onChange(index, 'tipo', e.target.value)}
          className="cv-tipo-select"
        >
          {TIPOS_SECCION.map((t) => (
            <option key={t} value={t}>
              {LABELS_SECCION[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="cv-form-grid">
        {numField('Ejes', 'ejes', 'unid', true)}
        {numField('Largo', 'largoM', 'm')}
        {numField('Ancho', 'anchoM', 'm')}
        {numField('Alto', 'altoM', 'm')}
        {numField('Peso vacío', 'pesoVacioKg', 'kg')}
        {numField('Cap. carga', 'capacidadCargaKg', 'kg')}
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ConfiguracionVehicularTab: React.FC<Props> = ({ camionId }) => {
  const [config, setConfig] = useState<ConfiguracionVehicular | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [formTipo, setFormTipo] = useState<TipoCombinacion>('tractor_semirremolque');
  const [formSecciones, setFormSecciones] = useState<SeccionVehicular[]>([]);
  const [formNotas, setFormNotas] = useState('');

  useEffect(() => {
    loadConfig();
  }, [camionId]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await configuracionVehicularService.getByCamion(camionId);
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = () => {
    if (config) {
      setFormTipo(config.tipoCombinacion as TipoCombinacion);
      setFormSecciones(JSON.parse(JSON.stringify(config.secciones)));
      setFormNotas(config.notas ?? '');
    } else {
      const tipo: TipoCombinacion = 'tractor_semirremolque';
      setFormTipo(tipo);
      setFormSecciones(JSON.parse(JSON.stringify(PLANTILLAS_COMBINACION[tipo])));
      setFormNotas('');
    }
    setIsEditing(true);
  };

  const handleTipoCombinacionChange = (tipo: TipoCombinacion) => {
    setFormTipo(tipo);
    setFormSecciones(JSON.parse(JSON.stringify(PLANTILLAS_COMBINACION[tipo])));
  };

  const handleSeccionChange = (
    index: number,
    field: keyof SeccionVehicular,
    value: string | number,
  ) => {
    setFormSecciones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await configuracionVehicularService.upsert(camionId, {
        tipoCombinacion: formTipo,
        secciones: formSecciones,
        notas: formNotas || undefined,
      });
      setConfig(saved);
      setIsEditing(false);
    } catch (err: any) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : err.message || 'Error al guardar';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar la configuración vehicular de este camión?')) return;
    try {
      await configuracionVehicularService.remove(camionId);
      setConfig(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  if (isLoading) {
    return <div className="cv-loading">Cargando configuración…</div>;
  }

  // ── Vista de edición ──────────────────────────────────────────────────────
  if (isEditing) {
    const totales = calcTotales(formSecciones);

    return (
      <div className="cv-edit-container">
        {error && <div className="cv-error">{error}</div>}

        <div className="cv-edit-header">
          <h3>Configurar combinación vehicular</h3>
        </div>

        {/* Selector de tipo de combinación */}
        <div className="cv-combo-selector">
          <label>Tipo de combinación</label>
          <div className="cv-combo-options">
            {TIPOS_COMBINACION.map((t) => (
              <button
                key={t}
                type="button"
                className={`cv-combo-btn ${formTipo === t ? 'active' : ''}`}
                onClick={() => handleTipoCombinacionChange(t)}
              >
                {LABELS_COMBINACION[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Vista previa en tiempo real */}
        <div className="cv-preview-label">Vista previa</div>
        <div className="cv-vista-horizontal">
          {formSecciones.map((sec, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="cv-conector">⊕</div>}
              <SeccionBlock seccion={sec} index={i} />
            </React.Fragment>
          ))}
        </div>

        {/* Totales live */}
        <div className="cv-totales-bar cv-totales-bar--edit">
          <span>⚖️ Vacío total: <strong>{fmt(totales.pesoVacioTotal)} kg</strong></span>
          <span>📦 Capacidad total: <strong>{fmt(totales.capacidadTotal)} kg</strong></span>
          <span>🚛 PBV: <strong>{fmt(totales.pbvTotal)} kg</strong></span>
        </div>

        {/* Formularios por sección */}
        <div className="cv-secciones-forms">
          {formSecciones.map((sec, i) => (
            <SeccionForm
              key={i}
              seccion={sec}
              index={i}
              onChange={handleSeccionChange}
            />
          ))}
        </div>

        {/* Notas */}
        <div className="cv-form-field cv-notas-field">
          <label>Notas adicionales</label>
          <textarea
            value={formNotas}
            onChange={(e) => setFormNotas(e.target.value)}
            rows={2}
            placeholder="Observaciones, características especiales, etc."
          />
        </div>

        {/* Acciones */}
        <div className="cv-edit-actions">
          <button
            type="button"
            className="cv-btn-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando…' : '💾 Guardar configuración'}
          </button>
          <button
            type="button"
            className="cv-btn-cancel"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Vista de lectura ──────────────────────────────────────────────────────
  if (!config) {
    return (
      <div className="cv-empty">
        <p>Este camión aún no tiene configuración vehicular definida.</p>
        <button type="button" className="cv-btn-add" onClick={openEdit}>
          ➕ Agregar configuración
        </button>
      </div>
    );
  }

  const { pesoVacioTotal, capacidadTotal, pbvTotal } = calcTotales(config.secciones);

  return (
    <div className="cv-view-container">
      {error && <div className="cv-error">{error}</div>}

      <div className="cv-view-header">
        <div>
          <h3 className="cv-titulo-combinacion">
            {LABELS_COMBINACION[config.tipoCombinacion as TipoCombinacion] ?? config.tipoCombinacion}
          </h3>
          {config.notas && <p className="cv-notas-text">📝 {config.notas}</p>}
        </div>
        <div className="cv-view-actions">
          <button type="button" className="cv-btn-edit" onClick={openEdit}>✏️ Editar</button>
          <button type="button" className="cv-btn-delete" onClick={handleDelete}>🗑️ Eliminar</button>
        </div>
      </div>

      {/* Diagrama horizontal */}
      <div className="cv-vista-horizontal">
        {config.secciones.map((sec, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="cv-conector">⊕</div>}
            <SeccionBlock seccion={sec} index={i} />
          </React.Fragment>
        ))}
      </div>

      {/* Totales */}
      <div className="cv-totales-bar">
        <div className="cv-total-item">
          <span className="cv-total-label">⚖️ Peso vacío total</span>
          <span className="cv-total-valor">{fmt(pesoVacioTotal)} kg</span>
        </div>
        <div className="cv-total-item">
          <span className="cv-total-label">📦 Capacidad de carga</span>
          <span className="cv-total-valor cv-total-cap">{fmt(capacidadTotal)} kg</span>
        </div>
        <div className="cv-total-item cv-total-pbv">
          <span className="cv-total-label">🚛 Peso Bruto Vehicular</span>
          <span className="cv-total-valor">{fmt(pbvTotal)} kg</span>
        </div>
      </div>

      {/* Distribución por sección */}
      {config.secciones.some((s) => s.pesoVacioKg || s.capacidadCargaKg) && (
        <div className="cv-distribucion">
          <p className="cv-dist-titulo">Distribución de peso por sección (vacío / capacidad)</p>
          {config.secciones.map((sec, i) => {
            const vacio = sec.pesoVacioKg ?? 0;
            const cap = sec.capacidadCargaKg ?? 0;
            const pbvSec = vacio + cap;
            const pctVacio = pbvSec > 0 ? (vacio / pbvSec) * 100 : 0;
            return (
              <div key={i} className="cv-dist-row">
                <span className="cv-dist-label">
                  {ICONO_SECCION[sec.tipo]} {LABELS_SECCION[sec.tipo]}
                </span>
                <div className="cv-dist-barra-wrap">
                  <div
                    className="cv-barra-vacio"
                    style={{ width: `${pctVacio}%` }}
                    title={`Vacío: ${fmt(vacio)} kg`}
                  />
                  <div
                    className="cv-barra-carga"
                    style={{ width: `${100 - pctVacio}%` }}
                    title={`Capacidad: ${fmt(cap)} kg`}
                  />
                </div>
                <span className="cv-dist-nums">
                  {fmt(vacio)} / {fmt(cap)} kg
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConfiguracionVehicularTab;
