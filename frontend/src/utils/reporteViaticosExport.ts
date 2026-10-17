import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetalleViatico, ReporteViaticosChofer, TipoViatico, tipoViaticoLabels } from '../types/jornada';
import { formatDateForDisplay } from './dateUtils';

const formatUYU = (monto: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(monto);

const nombreChofer = (r: ReporteViaticosChofer) => `${r.nombre.trim()} ${r.apellido.trim()}`;

const TIPOS = Object.values(TipoViatico);

const cantidadTipo = (r: ReporteViaticosChofer, tipo: TipoViatico) => r.porTipo?.[tipo]?.cantidad ?? 0;

// El tipo se aclara solo cuando el concepto no lo dice ya
export const describirItem = (d: DetalleViatico) => {
  const tipo = tipoViaticoLabels[d.tipo];
  const concepto = d.concepto === tipo ? d.concepto : `${d.concepto} (${tipo})`;
  return `${d.cantidad} × ${concepto} de ${formatUYU(d.montoUnitario)}`;
};

const describirDetalle = (detalle: DetalleViatico[]) => detalle.map(describirItem).join('\n');

const describirPorTipo = (r: ReporteViaticosChofer) =>
  TIPOS.filter((t) => cantidadTipo(r, t) > 0)
    .map((t) => `${cantidadTipo(r, t)} ${tipoViaticoLabels[t]}`)
    .join(', ');

// autoTable aplica columnStyles solo al body: el pie necesita su propia alineación
const centro = (content: string | number) => ({ content: String(content), styles: { halign: 'center' as const } });
const derecha = (content: string) => ({ content, styles: { halign: 'right' as const } });

const lastY = (doc: jsPDF, fallback: number) =>
  (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallback;

/**
 * PDF: resumen por chofer y, para cada chofer con viáticos, el desglose por día.
 */
export const buildReporteViaticosPdf = (reporte: ReporteViaticosChofer[], desde: string, hasta: string): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(16);
  doc.text('Reporte de viáticos', 14, 16);
  doc.setFontSize(10);
  doc.text(`Período: ${formatDateForDisplay(desde, 'es-UY')} al ${formatDateForDisplay(hasta, 'es-UY')}`, 14, 22);
  doc.text(`Emitido: ${new Date().toLocaleString('es-UY')}`, 14, 27);

  const totalMonto = reporte.reduce((acc, r) => acc + r.total, 0);
  const columnaMonto = TIPOS.length + 2;

  autoTable(doc, {
    startY: 33,
    head: [['Chofer', 'Días con viáticos', ...TIPOS.map((t) => tipoViaticoLabels[t]), 'Monto total']],
    body: reporte.map((r) => [
      nombreChofer(r),
      r.dias.length,
      ...TIPOS.map((t) => cantidadTipo(r, t) || '—'),
      formatUYU(r.total),
    ]),
    foot: [
      [
        'Total',
        centro(reporte.reduce((acc, r) => acc + r.dias.length, 0)),
        ...TIPOS.map((t) => centro(reporte.reduce((acc, r) => acc + cantidadTipo(r, t), 0))),
        derecha(formatUYU(totalMonto)),
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 115, 209] },
    footStyles: { fillColor: [224, 231, 239], textColor: [44, 62, 80] },
    columnStyles: {
      ...Object.fromEntries(
        Array.from({ length: TIPOS.length + 1 }, (_, i) => [i + 1, { halign: 'center' as const }]),
      ),
      [columnaMonto]: { halign: 'right' },
    },
  });

  let y = lastY(doc, 33) + 10;

  for (const r of reporte.filter((c) => c.dias.length > 0)) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(12);
    doc.text(nombreChofer(r), 14, y);
    doc.setFontSize(9);
    doc.text(`${describirPorTipo(r)} en ${r.dias.length} día(s) · ${formatUYU(r.total)}`, 14, y + 5);

    autoTable(doc, {
      startY: y + 8,
      head: [['Fecha', 'Lugar de trabajo', 'Detalle', 'Cantidad', 'Monto']],
      body: r.dias.map((d) => [
        formatDateForDisplay(d.fecha, 'es-UY'),
        d.lugarTrabajo || '—',
        describirDetalle(d.detalle),
        d.cantidad,
        formatUYU(d.total),
      ]),
      foot: [['Total', '', '', centro(r.cantidad), derecha(formatUYU(r.total))]],
      styles: { fontSize: 8, valign: 'middle' },
      headStyles: { fillColor: [12, 58, 102] },
      footStyles: { fillColor: [224, 231, 239], textColor: [44, 62, 80] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
      },
    });

    y = lastY(doc, y) + 10;
  }

  return doc;
};

export const exportReporteViaticosPdf = (reporte: ReporteViaticosChofer[], desde: string, hasta: string) =>
  buildReporteViaticosPdf(reporte, desde, hasta).save(`reporte_viaticos_${desde}_${hasta}.pdf`);

const escapeCsvValue = (value: string | number) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

/**
 * CSV plano: una fila por chofer / día / concepto, apto para filtrar o sumar en Excel.
 */
export const exportReporteViaticosCsv = (reporte: ReporteViaticosChofer[], desde: string, hasta: string) => {
  const headers = ['Chofer', 'Fecha', 'Lugar de trabajo', 'Tipo', 'Concepto', 'Cantidad', 'Monto unitario (UYU)', 'Total (UYU)'];
  const rows: Array<Array<string | number>> = [];

  for (const r of reporte) {
    for (const d of r.dias) {
      for (const item of d.detalle) {
        rows.push([
          nombreChofer(r),
          d.fecha,
          d.lugarTrabajo || '',
          tipoViaticoLabels[item.tipo],
          item.concepto,
          item.cantidad,
          item.montoUnitario.toFixed(2),
          item.total.toFixed(2),
        ]);
      }
    }
  }
  rows.push(['TOTAL', '', '', '', '', reporte.reduce((acc, r) => acc + r.cantidad, 0), '', reporte.reduce((acc, r) => acc + r.total, 0).toFixed(2)]);

  // BOM para que Excel respete tildes
  const csvContent = '﻿' + [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reporte_viaticos_${desde}_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
