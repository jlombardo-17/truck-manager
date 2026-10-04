import React, { useEffect, useId, useState } from 'react';
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

const WHEEL_R = 10;
const GROUND_Y = 86;
const wheelCY = GROUND_Y - WHEEL_R;          // 76
const CHASSIS_Y = 60;
const CHASSIS_H = 5;
const DIAG_H = 102;

const COLOR = {
  frame: '#1f2937',
  steel: '#374151',
  steelLight: '#64748b',
  rubber: '#111827',
  cabEdge: '#7f1d1d',
  boxEdge: '#94a3b8',
  tail: '#dc2626',
  marker: '#f59e0b',
};

// Gradientes compartidos por todas las piezas del SVG; `uid` evita colisiones de id entre diagramas
const SvgDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <linearGradient id={`${uid}-cab`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ef4444" />
      <stop offset="0.55" stopColor="#c81e1e" />
      <stop offset="1" stopColor="#8f1d1d" />
    </linearGradient>
    <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#dbeafe" />
      <stop offset="0.45" stopColor="#60a5fa" />
      <stop offset="1" stopColor="#1e3a8a" />
    </linearGradient>
    <linearGradient id={`${uid}-box`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.7" stopColor="#f1f5f9" />
      <stop offset="1" stopColor="#cbd5e1" />
    </linearGradient>
    <linearGradient id={`${uid}-chrome`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#94a3b8" />
      <stop offset="0.45" stopColor="#f8fafc" />
      <stop offset="1" stopColor="#64748b" />
    </linearGradient>
    <linearGradient id={`${uid}-tank`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f1f5f9" />
      <stop offset="0.5" stopColor="#cbd5e1" />
      <stop offset="1" stopColor="#64748b" />
    </linearGradient>
    <linearGradient id={`${uid}-deck`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#b45309" />
      <stop offset="1" stopColor="#78350f" />
    </linearGradient>
    <radialGradient id={`${uid}-rim`} cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stopColor="#f8fafc" />
      <stop offset="0.6" stopColor="#cbd5e1" />
      <stop offset="1" stopColor="#64748b" />
    </radialGradient>
  </defs>
);

const WheelSvg: React.FC<{ cx: number; cy: number; uid: string }> = ({ cx, cy, uid }) => (
  <g>
    {/* Cubierta */}
    <circle cx={cx} cy={cy} r={WHEEL_R} fill="#1f2937" />
    <circle cx={cx} cy={cy} r={WHEEL_R - 0.8} fill="none" stroke="#0b1220" strokeWidth="1.2" strokeDasharray="1.4 1.1" />
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.72} fill="#111827" />
    {/* Llanta */}
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.58} fill={`url(#${uid}-rim)`} stroke="#475569" strokeWidth="0.5" />
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.25} fill="#64748b" />
    {/* Bulones */}
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <circle
          key={i}
          cx={cx + Math.cos(a) * WHEEL_R * 0.4}
          cy={cy + Math.sin(a) * WHEEL_R * 0.4}
          r="0.55"
          fill="#334155"
        />
      );
    })}
    <circle cx={cx} cy={cy} r={WHEEL_R * 0.1} fill="#1e293b" />
  </g>
);

/** Agrupa ejes contiguos (tándem/trídem) para dibujar un único guardabarros por grupo */
function agruparEjes(xs: number[]): number[][] {
  const grupos: number[][] = [];
  [...xs].sort((a, b) => a - b).forEach((x) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && x - ultimo[ultimo.length - 1] <= 24) ultimo.push(x);
    else grupos.push([x]);
  });
  return grupos;
}

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

// Cabina "cab-over" mirando a la izquierda. `largo` = largo de cabina; `dormitorio` agrega litera y deflector.
function renderCabina(uid: string, largo: number, dormitorio: boolean): JSX.Element {
  const L = largo;
  const top = dormitorio ? 8 : 12;
  return (
    <g>
      {/* Deflector de techo */}
      {dormitorio && (
        <path d={`M 20 ${top} L 34 2 L ${L - 2} 2 L ${L - 1} ${top} Z`} fill={`url(#${uid}-cab)`} stroke={COLOR.cabEdge} strokeWidth="0.5" />
      )}
      {/* Carrocería de cabina */}
      <path
        d={`M 5 57 L 4 ${top + 16} Q 4 ${top + 2} 11 ${top} L ${L} ${top} L ${L + 1} 57 Z`}
        fill={`url(#${uid}-cab)`}
        stroke={COLOR.cabEdge}
        strokeWidth="0.6"
      />
      {/* Brillo superior */}
      <path d={`M 11 ${top + 1.5} L ${L - 1} ${top + 1.5}`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      {/* Ventanilla lateral + parabrisas */}
      <path
        d={`M 13 ${top + 5} L ${L * 0.52} ${top + 5} L ${L * 0.52} ${top + 22} L 8 ${top + 22} Q 8 ${top + 11} 13 ${top + 5} Z`}
        fill={`url(#${uid}-glass)`}
        stroke="#1e293b"
        strokeWidth="0.6"
      />
      <path d={`M 5 ${top + 18} Q 5.5 ${top + 8} 11 ${top + 3}`} stroke="#93c5fd" strokeWidth="1.6" fill="none" />
      {/* Puerta */}
      <path d={`M 8 ${top + 3.5} L ${L * 0.55} ${top + 3.5} L ${L * 0.55} 55`} stroke={COLOR.cabEdge} strokeWidth="0.7" fill="none" />
      <rect x={L * 0.55 - 7} y={top + 26} width="5" height="1.4" rx="0.7" fill="#e5e7eb" />
      {/* Ventanilla de litera */}
      {dormitorio && <rect x={L * 0.66} y={top + 7} width={L * 0.2} height="6" rx="2" fill={`url(#${uid}-glass)`} opacity="0.8" />}
      {/* Franja decorativa */}
      <rect x="4.5" y="44" width={L - 3.5} height="1.6" fill="rgba(255,255,255,0.5)" />
      {/* Paragolpes, faro y parrilla */}
      <rect x="2" y="50" width="13" height="8" rx="1.5" fill={COLOR.steel} />
      <rect x="2.5" y="51.5" width="12" height="1" fill="#4b5563" />
      <rect x="3" y="46" width="4.5" height="3.2" rx="1" fill="#fef9c3" stroke="#a16207" strokeWidth="0.4" />
      {[34, 37, 40].map((y) => (
        <rect key={y} x="4.2" y={y} width="2.2" height="1.2" rx="0.4" fill={COLOR.cabEdge} />
      ))}
      {/* Espejo */}
      <rect x="1.2" y={top + 6} width="1.4" height="14" fill={COLOR.steel} />
      <rect x="0" y={top + 4} width="3.2" height="11" rx="1" fill="#1f2937" />
      {/* Escalones */}
      <rect x={L * 0.25} y="57" width={L * 0.22} height="1.8" rx="0.8" fill="#9ca3af" />
      <rect x={L * 0.27} y="61" width={L * 0.2} height="1.8" rx="0.8" fill="#9ca3af" />
    </g>
  );
}

function renderTanque(uid: string, x: number, w: number): JSX.Element {
  return (
    <g>
      <rect x={x} y="61" width={w} height="11" rx="5" fill={`url(#${uid}-tank)`} stroke="#64748b" strokeWidth="0.5" />
      <rect x={x + 3} y="61" width="1.4" height="11" fill="#94a3b8" />
      <rect x={x + w - 4.4} y="61" width="1.4" height="11" fill="#94a3b8" />
    </g>
  );
}

function renderCajaFurgon(uid: string, x0: number, x1: number, top: number, bottom: number): JSX.Element {
  const ribs: number[] = [];
  for (let x = x0 + 12; x < x1 - 8; x += 11) ribs.push(x);
  return (
    <g>
      <rect x={x0} y={top} width={x1 - x0} height={bottom - top} rx="1.5" fill={`url(#${uid}-box)`} stroke={COLOR.boxEdge} strokeWidth="0.8" />
      {ribs.map((x) => (
        <line key={x} x1={x} y1={top + 3} x2={x} y2={bottom - 4} stroke="rgba(100,116,139,0.28)" strokeWidth="0.8" />
      ))}
      {/* Rieles superior e inferior */}
      <rect x={x0} y={top} width={x1 - x0} height="2.5" rx="1" fill="#cbd5e1" />
      <rect x={x0} y={bottom - 4} width={x1 - x0} height="4" fill="#94a3b8" />
      {/* Puertas traseras con bisagras */}
      <rect x={x1 - 4} y={top + 2.5} width="3" height={bottom - top - 6.5} fill="#e2e8f0" stroke={COLOR.boxEdge} strokeWidth="0.5" />
      {[0.2, 0.5, 0.8].map((f) => (
        <rect key={f} x={x1 - 5} y={top + (bottom - top) * f} width="2" height="2" fill={COLOR.steelLight} />
      ))}
      {/* Luces de gálibo */}
      {ribs.filter((_, i) => i % 4 === 1).map((x) => (
        <rect key={x} x={x} y={bottom - 3.2} width="2.2" height="1.6" rx="0.5" fill={COLOR.marker} />
      ))}
    </g>
  );
}

function renderLanza(xEnganche: number, xFin: number): JSX.Element {
  return (
    <g>
      <line x1={xEnganche + 3} y1="68" x2={xFin} y2="62" stroke={COLOR.steel} strokeWidth="3" strokeLinecap="round" />
      <circle cx={xEnganche + 2} cy="68.5" r="3" fill="none" stroke={COLOR.steel} strokeWidth="2" />
    </g>
  );
}

/** Piezas que van detrás de las ruedas */
function renderVehicleBody(tipo: TipoSeccion, W: number, axleXs: number[], uid: string): JSX.Element {
  const cy = CHASSIS_Y;
  const primerEje = axleXs[0] ?? 30;

  switch (tipo) {
    case 'tractora': {
      const traseros = axleXs.slice(1);
      const quintaX = traseros.reduce((a, b) => a + b, 0) / Math.max(1, traseros.length) - 4;
      return (
        <g>
          <rect x="8" y={cy} width={W - 14} height={CHASSIS_H} rx="1.5" fill={COLOR.frame} />
          {/* Caño de escape */}
          <rect x="74" y="5" width="3.5" height={cy - 5} rx="1.5" fill={`url(#${uid}-chrome)`} />
          <rect x="73.2" y="3" width="5" height="4" rx="1" fill={COLOR.steel} />
          {renderCabina(uid, 72, true)}
          {renderTanque(uid, 46, 30)}
          {/* Quinta rueda */}
          <path d={`M ${quintaX - 17} ${cy} L ${quintaX - 13} ${cy - 4} L ${quintaX + 15} ${cy - 4} L ${quintaX + 17} ${cy} Z`} fill={COLOR.rubber} />
          <rect x={quintaX - 9} y={cy - 6} width="18" height="2.2" rx="1" fill={COLOR.steelLight} />
          <rect x={W - 7} y={cy - 4} width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    case 'camion': {
      const cajaX0 = 64;
      const segundoEje = axleXs[1] ?? W;
      const largoTanque = Math.min(24, segundoEje - primerEje - 40);
      return (
        <g>
          <rect x="6" y={cy} width={W - 12} height={CHASSIS_H} rx="1.5" fill={COLOR.frame} />
          {renderCabina(uid, 58, false)}
          <rect x={cajaX0 + 2} y="56" width={W - cajaX0 - 10} height="4" fill={COLOR.steel} />
          {renderCajaFurgon(uid, cajaX0, W - 5, 5, 57)}
          {axleXs.length > 1 && largoTanque > 10 && renderTanque(uid, primerEje + 13, largoTanque)}
          <rect x={W - 8} y={cy + 1} width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    case 'semirremolque': {
      const pataX = Math.max(42, Math.min(70, primerEje - 50));
      const largoProteccion = primerEje - 14 - (pataX + 10);
      return (
        <g>
          {renderCajaFurgon(uid, 6, W - 6, 6, 55)}
          {/* Bastidor bajo caja y perno rey */}
          <rect x={pataX - 6} y="55" width={W - pataX - 6} height="4" fill={COLOR.frame} />
          <rect x="20" y="55" width="4" height="6" rx="1" fill={COLOR.steel} />
          {/* Patas de apoyo */}
          <rect x={pataX} y="55" width="3.5" height="24" fill="#4b5563" />
          <rect x={pataX - 3} y="78" width="9.5" height="3" rx="1" fill={COLOR.steel} />
          <rect x={pataX + 3.5} y="63" width="5" height="1.6" rx="0.6" fill={COLOR.steelLight} />
          {/* Protección lateral */}
          {largoProteccion > 2 && (
            <>
              <rect x={pataX + 10} y="63" width={largoProteccion} height="1.8" fill={COLOR.steelLight} />
              <rect x={pataX + 10} y="68" width={largoProteccion} height="1.8" fill={COLOR.steelLight} />
            </>
          )}
          <rect x={W - 9} y="56" width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    case 'acoplado': {
      const largoProteccion = primerEje - 14 - 58;
      return (
        <g>
          {renderLanza(1, 30)}
          {renderCajaFurgon(uid, 24, W - 6, 8, 56)}
          <rect x="28" y="56" width={W - 38} height="5" fill={COLOR.frame} />
          {/* Plato giratorio delantero */}
          <rect x="30" y="61" width="22" height="3" rx="1" fill={COLOR.steel} />
          {largoProteccion > 2 && <rect x="58" y="65" width={largoProteccion} height="1.8" fill={COLOR.steelLight} />}
          <rect x={W - 9} y="57" width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    case 'zorra': {
      const estacas: number[] = [];
      for (let x = 24; x < W - 12; x += 18) estacas.push(x);
      return (
        <g>
          {renderLanza(1, 30)}
          {/* Viga principal */}
          <rect x="6" y="51" width={W - 12} height="7" fill={COLOR.steel} />
          <rect x="6" y="51" width={W - 12} height="1.2" fill={COLOR.steelLight} />
          {/* Piso de madera */}
          <rect x="6" y="47" width={W - 12} height="4" rx="0.6" fill={`url(#${uid}-deck)`} />
          {/* Cabezal delantero */}
          <rect x="8" y="30" width="4" height="17" fill={COLOR.steelLight} />
          {[33, 38, 43].map((y) => (
            <rect key={y} x="12" y={y} width="5" height="1.2" fill={COLOR.steelLight} />
          ))}
          {/* Portaestacas */}
          {estacas.map((x) => (
            <rect key={x} x={x} y="52.5" width="3" height="4" fill="#1f2937" />
          ))}
          {/* Plato giratorio */}
          {axleXs.length > 1 && <rect x={primerEje - 13} y="58" width="26" height="3" rx="1" fill={COLOR.frame} />}
          <rect x={W - 9} y="52" width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    case 'dolly': {
      const mx = axleXs.reduce((a, b) => a + b, 0) / Math.max(1, axleXs.length);
      return (
        <g>
          {renderLanza(1, 30)}
          <rect x="26" y={cy} width={W - 32} height={CHASSIS_H} rx="1.5" fill={COLOR.frame} />
          {/* Quinta rueda */}
          <path d={`M ${mx - 16} ${cy} L ${mx - 12} ${cy - 4} L ${mx + 14} ${cy - 4} L ${mx + 16} ${cy} Z`} fill={COLOR.rubber} />
          <rect x={mx - 8} y={cy - 6} width="16" height="2.2" rx="1" fill={COLOR.steelLight} />
          <rect x={W - 8} y={cy} width="3" height="3" rx="0.6" fill={COLOR.tail} />
        </g>
      );
    }
    default:
      return <g />;
  }
}

/** Piezas que van delante de las ruedas: guardabarros y barreros */
function renderGuardabarros(tipo: TipoSeccion, axleXs: number[]): JSX.Element {
  // En tractora y camión el eje delantero queda bajo la cabina
  const ejes = (tipo === 'tractora' || tipo === 'camion') && axleXs.length > 1 ? axleXs.slice(1) : axleXs;
  const curvo = tipo === 'tractora';
  return (
    <g>
      {agruparEjes(ejes).map((grupo) => {
        const a = grupo[0];
        const b = grupo[grupo.length - 1];
        return (
          <g key={a}>
            {curvo ? (
              <path
                d={`M ${a - 13} 75 Q ${a - 13} 63 ${a - 2} 63 L ${b + 2} 63 Q ${b + 13} 63 ${b + 13} 75`}
                fill="none"
                stroke={COLOR.rubber}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            ) : (
              <rect x={a - 12} y="62.5" width={b - a + 24} height="2.4" rx="1" fill={COLOR.rubber} />
            )}
            {/* Barrero */}
            <rect x={b + 11.5} y="64" width="2.4" height="18" rx="0.6" fill={COLOR.rubber} />
          </g>
        );
      })}
    </g>
  );
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
  const uid = `cv${useId().replace(/:/g, '')}`;
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
          <SvgDefs uid={uid} />
          {/* Sombra y piso */}
          <ellipse cx={W / 2} cy={GROUND_Y + 0.5} rx={W / 2 - 6} ry="2" fill="rgba(15,23,42,0.12)" />
          <line x1="2" y1={GROUND_Y} x2={W - 2} y2={GROUND_Y} stroke="#cbd5e1" strokeWidth="1" />
          {renderVehicleBody(seccion.tipo, W, axleXs, uid)}
          {/* Suspensión */}
          {axleXs.map((x, i) => (
            <rect key={i} x={x - 8} y={CHASSIS_Y + CHASSIS_H - 1} width="16" height="3" rx="1.2" fill={COLOR.steel} />
          ))}
          {axleXs.map((x, i) => (
            <WheelSvg key={i} cx={x} cy={wheelCY} uid={uid} />
          ))}
          {renderGuardabarros(seccion.tipo, axleXs)}
          {/* Per-axle weight label */}
          {tPerAxle !== null && axleXs.map((x, i) => (
            <text
              key={i}
              x={x}
              y={GROUND_Y + 12}
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
