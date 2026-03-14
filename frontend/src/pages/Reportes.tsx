import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import {
  DesempenoChoferesResponse,
  GastosMantenimientoResponse,
  IngresosMensualesResponse,
  OperacionCamionResponse,
  RentabilidadComparativaResponse,
  RentabilidadResponse,
  reportesService,
} from '../services/reportesService';
import { Camion } from '../types/camion';
import { Chofer } from '../types/chofer';
import BackButton from '../components/BackButton';
import '../styles/Reportes.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

type RentabilidadExportColumnKey =
  | 'periodo'
  | 'ingresos'
  | 'gastos'
  | 'gananciaNeta'
  | 'kmRecorridos'
  | 'gastosOperativos'
  | 'mantenimiento'
  | 'sueldoChofer'
  | 'comisionChofer';

const RENTABILIDAD_EXPORT_COLUMNS: Array<{ key: RentabilidadExportColumnKey; label: string }> = [
  { key: 'periodo', label: 'Período' },
  { key: 'ingresos', label: 'Ingresos' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'gananciaNeta', label: 'Ganancia Neta' },
  { key: 'kmRecorridos', label: 'KM Recorridos' },
  { key: 'gastosOperativos', label: 'Gastos Operativos' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'sueldoChofer', label: 'Sueldo Chofer' },
  { key: 'comisionChofer', label: 'Comisión Chofer' },
];

const DEFAULT_RENTABILIDAD_EXPORT_COLUMNS: Record<RentabilidadExportColumnKey, boolean> = {
  periodo: true,
  ingresos: true,
  gastos: true,
  gananciaNeta: true,
  kmRecorridos: true,
  gastosOperativos: true,
  mantenimiento: true,
  sueldoChofer: true,
  comisionChofer: true,
};

const Reportes: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const defaultDesdeDiario = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, [today]);

  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [choferes, setChoferes] = useState<Chofer[]>([]);

  const [loadingRentabilidad, setLoadingRentabilidad] = useState(false);
  const [loadingComparativa, setLoadingComparativa] = useState(false);
  const [loadingOperacion, setLoadingOperacion] = useState(false);
  const [loadingAdicionales, setLoadingAdicionales] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<RentabilidadResponse | null>(null);
  const [comparativa, setComparativa] = useState<RentabilidadComparativaResponse | null>(null);
  const [operacionCamion, setOperacionCamion] = useState<OperacionCamionResponse | null>(null);
  const [desempenoChoferes, setDesempenoChoferes] = useState<DesempenoChoferesResponse | null>(null);
  const [gastosMantenimiento, setGastosMantenimiento] = useState<GastosMantenimientoResponse | null>(null);
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresosMensualesResponse | null>(null);

  const [granularidad, setGranularidad] = useState<'diaria' | 'mensual'>('diaria');
  const [camionIds, setCamionIds] = useState<string[]>([]);
  const [choferIds, setChoferIds] = useState<string[]>([]);
  const [desde, setDesde] = useState<string>(defaultDesdeDiario);
  const [hasta, setHasta] = useState<string>(today.toISOString().split('T')[0]);

  const [compararPor, setCompararPor] = useState<'camion' | 'chofer'>('camion');
  const [camionOperacionId, setCamionOperacionId] = useState<string>('');
  const [granularidadOperacion, setGranularidadOperacion] = useState<'diaria' | 'semanal'>('diaria');
  const [rentabilidadExportColumns, setRentabilidadExportColumns] = useState<Record<RentabilidadExportColumnKey, boolean>>(
    DEFAULT_RENTABILIDAD_EXPORT_COLUMNS,
  );

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [camionesData, choferesData] = await Promise.all([
          camionesService.getAll(),
          choferesService.getAll(),
        ]);
        setCamiones(camionesData);
        setChoferes(choferesData);

        if (camionesData.length > 0) {
          setCamionOperacionId(String(camionesData[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadCatalogs();
  }, []);

  useEffect(() => {
    fetchRentabilidad();
  }, [granularidad, camionIds, choferIds, desde, hasta]);

  useEffect(() => {
    fetchComparativa();
  }, [compararPor, desde, hasta]);

  useEffect(() => {
    fetchOperacionCamion();
  }, [camionOperacionId, granularidadOperacion, desde, hasta]);

  useEffect(() => {
    fetchReportesAdicionales();
  }, [camionIds, choferIds, desde, hasta]);

  const fetchRentabilidad = async () => {
    try {
      setLoadingRentabilidad(true);
      setError(null);
      const data = await reportesService.getRentabilidad({
        granularidad,
        camionIds: camionIds.length ? camionIds.map((id) => Number(id)) : undefined,
        choferIds: choferIds.length ? choferIds.map((id) => Number(id)) : undefined,
        desde,
        hasta,
      });
      setReporte(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar el reporte de rentabilidad');
    } finally {
      setLoadingRentabilidad(false);
    }
  };

  const fetchComparativa = async () => {
    try {
      setLoadingComparativa(true);
      const data = await reportesService.getRentabilidadComparativa({
        compararPor,
        camionIds: camionIds.length ? camionIds.map((id) => Number(id)) : undefined,
        choferIds: choferIds.length ? choferIds.map((id) => Number(id)) : undefined,
        desde,
        hasta,
      });
      setComparativa(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar la comparativa');
    } finally {
      setLoadingComparativa(false);
    }
  };

  const fetchOperacionCamion = async () => {
    if (!camionOperacionId) {
      setOperacionCamion(null);
      return;
    }

    try {
      setLoadingOperacion(true);
      const data = await reportesService.getOperacionCamion({
        camionId: Number(camionOperacionId),
        granularidad: granularidadOperacion,
        desde,
        hasta,
      });
      setOperacionCamion(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar la operación del camión');
    } finally {
      setLoadingOperacion(false);
    }
  };

  const fetchReportesAdicionales = async () => {
    try {
      setLoadingAdicionales(true);
      const [desempenoData, gastosData, ingresosData] = await Promise.all([
        reportesService.getDesempenoChoferes({
          desde,
          hasta,
          choferIds: choferIds.length ? choferIds.map((id) => Number(id)) : undefined,
        }),
        reportesService.getGastosMantenimiento({
          desde,
          hasta,
          camionIds: camionIds.length ? camionIds.map((id) => Number(id)) : undefined,
        }),
        reportesService.getIngresosmensuales({
          desde,
          hasta,
          camionIds: camionIds.length ? camionIds.map((id) => Number(id)) : undefined,
          choferIds: choferIds.length ? choferIds.map((id) => Number(id)) : undefined,
        }),
      ]);

      setDesempenoChoferes(desempenoData);
      setGastosMantenimiento(gastosData);
      setIngresosMensuales(ingresosData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los reportes adicionales');
    } finally {
      setLoadingAdicionales(false);
    }
  };

  const handlePresetDateRange = (days: number) => {
    const newDesde = new Date(today);
    newDesde.setDate(newDesde.getDate() - days);
    setDesde(newDesde.toISOString().split('T')[0]);
    setHasta(today.toISOString().split('T')[0]);
  };

  const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<string | number>>) => {
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedRentabilidadColumns = RENTABILIDAD_EXPORT_COLUMNS.filter(
    (column) => rentabilidadExportColumns[column.key],
  );

  const buildRentabilidadRowBySelectedColumns = (point: RentabilidadResponse['series'][number]) => {
    const valuesByColumn: Record<RentabilidadExportColumnKey, string> = {
      periodo: point.etiqueta,
      ingresos: point.ingresos.toFixed(2),
      gastos: point.gastos.toFixed(2),
      gananciaNeta: point.gananciaNeta.toFixed(2),
      kmRecorridos: point.kmRecorridos.toFixed(2),
      gastosOperativos: point.detalleGastos.operativosViaje.toFixed(2),
      mantenimiento: point.detalleGastos.mantenimiento.toFixed(2),
      sueldoChofer: point.detalleGastos.sueldoChofer.toFixed(2),
      comisionChofer: point.detalleGastos.comisionChofer.toFixed(2),
    };

    return selectedRentabilidadColumns.map((column) => valuesByColumn[column.key]);
  };

  const toggleRentabilidadExportColumn = (columnKey: RentabilidadExportColumnKey) => {
    setRentabilidadExportColumns((prev) => {
      const selectedCount = Object.values(prev).filter(Boolean).length;
      if (selectedCount === 1 && prev[columnKey]) {
        return prev;
      }

      return {
        ...prev,
        [columnKey]: !prev[columnKey],
      };
    });
  };

  const readMultiSelectValues = (event: React.ChangeEvent<HTMLSelectElement>) =>
    Array.from(event.target.selectedOptions).map((option) => option.value);

  const exportRentabilidadCsv = () => {
    const rows = (reporte?.series || []).map((point) => buildRentabilidadRowBySelectedColumns(point));

    downloadCsv(
      `rentabilidad_${desde}_${hasta}.csv`,
      selectedRentabilidadColumns.map((column) => column.label),
      rows,
    );
  };

  const exportComparativaCsv = () => {
    const rows = (comparativa?.comparativas || []).map((item) => [
      item.label,
      item.ingresos.toFixed(2),
      item.gastos.toFixed(2),
      item.gananciaNeta.toFixed(2),
    ]);

    downloadCsv(
      `comparativa_${compararPor}_${desde}_${hasta}.csv`,
      ['Entidad', 'Ingresos', 'Gastos', 'GananciaNeta'],
      rows,
    );
  };

  const exportOperacionCsv = () => {
    const rows = (operacionCamion?.series || []).map((item) => [
      item.etiqueta,
      item.kms.toFixed(2),
      item.toneladas.toFixed(2),
    ]);

    downloadCsv(
      `operacion_camion_${camionOperacionId || 'na'}_${desde}_${hasta}.csv`,
      ['Periodo', 'Kms', 'Toneladas'],
      rows,
    );
  };

  const exportDesempenoChoferesCsv = () => {
    const rows = (desempenoChoferes?.desempenio || []).map((item) => [
      item.nombre || 'Sin nombre',
      item.viajesCompletos,
      item.ingresos.toFixed(2),
      item.comisiones.toFixed(2),
      item.comisionPromedio.toFixed(2),
    ]);

    downloadCsv(
      `desempeno_choferes_${desde}_${hasta}.csv`,
      ['Chofer', 'Viajes', 'Ingresos', 'Comisiones', 'ComisionPromedio'],
      rows,
    );
  };

  const exportGastosMantenimientoCsv = () => {
    const rows = (gastosMantenimiento?.gastos || []).map((item) => [
      item.patente || `Camion ${item.camionId}`,
      item.cantidadRegistros,
      item.totalGastos.toFixed(2),
    ]);

    downloadCsv(
      `gastos_mantenimiento_${desde}_${hasta}.csv`,
      ['Patente', 'Registros', 'TotalGastos'],
      rows,
    );
  };

  const exportIngresosMensualesCsv = () => {
    const rows = (ingresosMensuales?.ingresos || []).map((item) => [
      item.mes,
      item.viajesCompletos,
      item.ingresos.toFixed(2),
      item.gastos.toFixed(2),
      item.gananciaNeta.toFixed(2),
      item.rentabilidad.toFixed(2),
    ]);

    downloadCsv(
      `ingresos_mensuales_${desde}_${hasta}.csv`,
      ['Mes', 'Viajes', 'Ingresos', 'Gastos', 'GananciaNeta', 'RentabilidadPct'],
      rows,
    );
  };

  const exportReportePdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fechaEmision = new Date().toLocaleString('es-UY');

    doc.setFontSize(16);
    doc.text('Reporte de Rentabilidad', 14, 16);
    doc.setFontSize(10);
    doc.text(`Periodo: ${desde} a ${hasta}`, 14, 22);
    doc.text(`Granularidad: ${granularidad}`, 14, 27);
    doc.text(`Emitido: ${fechaEmision}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [['Resumen', 'Valor']],
      body: [
        ['Total Ingresos', Number(reporte?.resumen.totalIngresos || 0).toFixed(2)],
        ['Total Gastos', Number(reporte?.resumen.totalGastos || 0).toFixed(2)],
        ['Ganancia Neta', Number(reporte?.resumen.totalGananciaNeta || 0).toFixed(2)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 139, 87] },
    });

    let currentY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 38) + 8;

    doc.setFontSize(11);
    doc.text('Detalle por periodo', 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      head: [selectedRentabilidadColumns.map((column) => column.label)],
      body: (reporte?.series || []).map((point) => buildRentabilidadRowBySelectedColumns(point)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 89, 182] },
    });

    currentY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || currentY) + 8;

    doc.setFontSize(11);
    doc.text('Comparativa', 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Entidad', 'Ingresos', 'Gastos', 'Ganancia Neta']],
      body: (comparativa?.comparativas || []).map((item) => [
        item.label,
        item.ingresos.toFixed(2),
        item.gastos.toFixed(2),
        item.gananciaNeta.toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 119, 180] },
    });

    currentY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || currentY) + 8;

    doc.setFontSize(11);
    doc.text('Operacion de camion', 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Periodo', 'KM Recorridos', 'Toneladas']],
      body: (operacionCamion?.series || []).map((item) => [
        item.etiqueta,
        item.kms.toFixed(2),
        item.toneladas.toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 127, 14] },
    });

    doc.save(`reporte_rentabilidad_${desde}_${hasta}.pdf`);
  };

  const chartData = {
    labels: reporte?.series.map((s) => s.etiqueta) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: reporte?.series.map((s) => s.ingresos) || [],
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.15)',
        tension: 0.25,
      },
      {
        label: 'Gastos',
        data: reporte?.series.map((s) => s.gastos) || [],
        borderColor: '#C0392B',
        backgroundColor: 'rgba(192, 57, 43, 0.15)',
        tension: 0.25,
      },
      {
        label: 'Ganancia Neta',
        data: reporte?.series.map((s) => s.gananciaNeta) || [],
        borderColor: '#9B59B6',
        backgroundColor: 'rgba(155, 89, 182, 0.15)',
        tension: 0.25,
      },
    ],
  };

  const comparativaChartData = {
    labels: comparativa?.comparativas.map((item) => item.label) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: comparativa?.comparativas.map((item) => item.ingresos) || [],
        backgroundColor: 'rgba(46, 139, 87, 0.7)',
      },
      {
        label: 'Gastos',
        data: comparativa?.comparativas.map((item) => item.gastos) || [],
        backgroundColor: 'rgba(192, 57, 43, 0.7)',
      },
      {
        label: 'Ganancia Neta',
        data: comparativa?.comparativas.map((item) => item.gananciaNeta) || [],
        backgroundColor: 'rgba(155, 89, 182, 0.7)',
      },
    ],
  };

  const operacionChartData = {
    labels: operacionCamion?.series.map((item) => item.etiqueta) || [],
    datasets: [
      {
        label: 'KM Recorridos',
        data: operacionCamion?.series.map((item) => item.kms) || [],
        borderColor: '#1F77B4',
        backgroundColor: 'rgba(31, 119, 180, 0.15)',
        tension: 0.25,
      },
      {
        label: 'Toneladas Transportadas',
        data: operacionCamion?.series.map((item) => item.toneladas) || [],
        borderColor: '#FF7F0E',
        backgroundColor: 'rgba(255, 127, 14, 0.15)',
        tension: 0.25,
      },
    ],
  };

  return (
    <div className="reportes-page">
      <div className="page-back-button-container">
        <BackButton label="← Volver al Dashboard" to="/dashboard" />
      </div>
      
      {/* Hero Section */}
      <HeroSection
        subtitle="Financial Analytics"
        title="Reportes de Rentabilidad"
        description="Monitorea ingresos, costos y eficiencia operativa por camión y chofer. Análisis detallado de tu operación."
        backgroundImage="linear-gradient(135deg, #27ae60 0%, #229954 50%, #17a2b8 100%)"
        darkBg={true}
      />

      <section className="reportes-kpi-section">
        <div className="reportes-container">
          <StatsGrid
            stats={[
              {
                label: 'Ingresos Totales',
                value: `$${Number(reporte?.resumen.totalIngresos || 0).toFixed(0)}`,
                unit: 'USD',
                icon: '💰',
                color: 'green',
                trend: reporte?.resumen.totalIngresos ? { direction: 'up', percentage: 12 } : undefined,
              },
              {
                label: 'Gastos Totales',
                value: `$${Number(reporte?.resumen.totalGastos || 0).toFixed(0)}`,
                unit: 'USD',
                icon: '📉',
                color: 'red',
                trend: reporte?.resumen.totalGastos ? { direction: 'down', percentage: 8 } : undefined,
              },
              {
                label: 'Ganancia Neta',
                value: `$${Number(reporte?.resumen.totalGananciaNeta || 0).toFixed(0)}`,
                unit: 'USD',
                icon: '📈',
                color: 'blue',
                trend: reporte?.resumen.totalGananciaNeta ? { direction: 'up', percentage: 15 } : undefined,
              },
              {
                label: 'Rentabilidad',
                value: reporte?.resumen.totalIngresos && reporte?.resumen.totalGastos
                  ? ((reporte.resumen.totalGananciaNeta / reporte.resumen.totalIngresos) * 100).toFixed(1)
                  : '0',
                unit: '%',
                icon: '📊',
                color: 'purple',
                trend: { direction: 'up', percentage: 5 },
              },
            ]}
            columns={4}
            loading={loadingRentabilidad}
          />
        </div>
      </section>

      <div className="reportes-filtros">
        <div className="filtro-item">
          <label>Granularidad</label>
          <select value={granularidad} onChange={(e) => setGranularidad(e.target.value as 'diaria' | 'mensual')}>
            <option value="diaria">Diaria</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div className="filtro-item">
          <label>Camiones (multi)</label>
          <select
            multiple
            className="multi-select"
            value={camionIds}
            onChange={(e) => setCamionIds(readMultiSelectValues(e))}
          >
            {camiones.map((camion) => (
              <option key={camion.id} value={camion.id}>
                {camion.patente} - {camion.marca} {camion.modelo}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label>Choferes (multi)</label>
          <select
            multiple
            className="multi-select"
            value={choferIds}
            onChange={(e) => setChoferIds(readMultiSelectValues(e))}
          >
            {choferes.map((chofer) => (
              <option key={chofer.id} value={chofer.id}>
                {chofer.nombre} {chofer.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>

        <div className="filtro-item">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <div className="filtro-rapido">
        <button className="btn-rapido btn-rapido--ghost" onClick={() => { setCamionIds([]); setChoferIds([]); }}>
          Limpiar Camiones/Choferes
        </button>
        <button className="btn-rapido btn-rapido--ghost" onClick={() => handlePresetDateRange(7)}>Últimos 7 días</button>
        <button className="btn-rapido btn-rapido--ghost" onClick={() => handlePresetDateRange(30)}>Últimos 30 días</button>
        <button className="btn-rapido btn-rapido--ghost" onClick={() => handlePresetDateRange(90)}>Últimos 90 días</button>
        <button
          className="btn-rapido btn-rapido--accent"
          onClick={exportReportePdf}
          disabled={!reporte?.series.length && !comparativa?.comparativas.length && !operacionCamion?.series.length}
        >
          Exportar PDF
        </button>
      </div>

      <div className="columnas-exportacion">
        <span>Columnas exportables (Rentabilidad):</span>
        <div className="columnas-exportacion-grid">
          {RENTABILIDAD_EXPORT_COLUMNS.map((column) => (
            <label key={column.key} className="columna-check">
              <input
                type="checkbox"
                checked={rentabilidadExportColumns[column.key]}
                onChange={() => toggleRentabilidadExportColumn(column.key)}
              />
              {column.label}
            </label>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="reportes-container">
        <div className="section-header-inline">
          <h3>Ingresos vs Gastos por Período</h3>
          <button className="btn-rapido btn-rapido--accent" onClick={exportRentabilidadCsv} disabled={!reporte?.series.length}>
            Exportar CSV
          </button>
        </div>
        {loadingRentabilidad ? <p>Cargando gráfico...</p> : <Line data={chartData} />}
      </div>

      <div className="chart-container">
        <div className="section-header-inline">
          <h3>Comparativa de Rentabilidad</h3>
          <div className="inline-controls">
            <div className="filtro-item small-inline">
              <label>Comparar por</label>
              <select value={compararPor} onChange={(e) => setCompararPor(e.target.value as 'camion' | 'chofer')}>
                <option value="camion">Camión</option>
                <option value="chofer">Chofer</option>
              </select>
            </div>
            <button className="btn-rapido btn-rapido--accent" onClick={exportComparativaCsv} disabled={!comparativa?.comparativas.length}>
              Exportar CSV
            </button>
          </div>
        </div>
        {loadingComparativa ? <p>Cargando comparativa...</p> : <Bar data={comparativaChartData} />}
      </div>

      <div className="chart-container">
        <div className="section-header-inline">
          <h3>Operación de Camión (KM + Toneladas)</h3>
          <div className="inline-controls">
            <div className="filtro-item small-inline">
              <label>Camión</label>
              <select value={camionOperacionId} onChange={(e) => setCamionOperacionId(e.target.value)}>
                {camiones.map((camion) => (
                  <option key={camion.id} value={camion.id}>
                    {camion.patente} - {camion.marca}
                  </option>
                ))}
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Vista</label>
              <select value={granularidadOperacion} onChange={(e) => setGranularidadOperacion(e.target.value as 'diaria' | 'semanal')}>
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
            <button className="btn-rapido btn-rapido--accent" onClick={exportOperacionCsv} disabled={!operacionCamion?.series.length}>
              Exportar CSV
            </button>
          </div>
        </div>
        {loadingOperacion ? <p>Cargando operación...</p> : <Line data={operacionChartData} />}
        <div className="operacion-resumen">
          <span>Total KM: {Number(operacionCamion?.resumen.totalKms || 0).toFixed(2)}</span>
          <span>Total Toneladas: {Number(operacionCamion?.resumen.totalToneladas || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="tabla-container">
        <div className="section-header-inline">
          <h3>Detalle por período</h3>
          <button className="btn-rapido btn-rapido--accent" onClick={exportRentabilidadCsv} disabled={!reporte?.series.length}>
            Exportar CSV
          </button>
        </div>
        <table className="reportes-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Ganancia Neta</th>
              <th>KM Recorridos</th>
              <th>Mantenimiento</th>
              <th>Sueldo Chofer</th>
              <th>Comisión Chofer</th>
            </tr>
          </thead>
          <tbody>
            {(reporte?.series || []).map((point) => (
              <tr key={point.periodo}>
                <td>{point.etiqueta}</td>
                <td>${point.ingresos.toFixed(2)}</td>
                <td>${point.gastos.toFixed(2)}</td>
                <td>${point.gananciaNeta.toFixed(2)}</td>
                <td>{point.kmRecorridos.toFixed(2)} km</td>
                <td>${point.detalleGastos.mantenimiento.toFixed(2)}</td>
                <td>${point.detalleGastos.sueldoChofer.toFixed(2)}</td>
                <td>${point.detalleGastos.comisionChofer.toFixed(2)}</td>
              </tr>
            ))}
            {(reporte?.series || []).length === 0 && (
              <tr>
                <td colSpan={8}>No hay datos para el filtro seleccionado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="tabla-container">
        <div className="section-header-inline">
          <h3>Desempeño de Choferes</h3>
          <button
            className="btn-rapido btn-rapido--accent"
            onClick={exportDesempenoChoferesCsv}
            disabled={loadingAdicionales || !(desempenoChoferes?.desempenio || []).length}
          >
            Exportar CSV
          </button>
        </div>
        {loadingAdicionales ? (
          <p>Cargando desempeño de choferes...</p>
        ) : (
          <table className="reportes-table">
            <thead>
              <tr>
                <th>Chofer</th>
                <th>Viajes</th>
                <th>Ingresos</th>
                <th>Comisiones</th>
                <th>Comisión Promedio</th>
              </tr>
            </thead>
            <tbody>
              {(desempenoChoferes?.desempenio || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre || 'Sin nombre'}</td>
                  <td>{item.viajesCompletos}</td>
                  <td>${item.ingresos.toFixed(2)}</td>
                  <td>${item.comisiones.toFixed(2)}</td>
                  <td>${item.comisionPromedio.toFixed(2)}</td>
                </tr>
              ))}
              {(desempenoChoferes?.desempenio || []).length === 0 && (
                <tr>
                  <td colSpan={5}>No hay datos para el filtro seleccionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="tabla-container">
        <div className="section-header-inline">
          <h3>Gastos de Mantenimiento</h3>
          <button
            className="btn-rapido btn-rapido--accent"
            onClick={exportGastosMantenimientoCsv}
            disabled={loadingAdicionales || !(gastosMantenimiento?.gastos || []).length}
          >
            Exportar CSV
          </button>
        </div>
        {loadingAdicionales ? (
          <p>Cargando gastos de mantenimiento...</p>
        ) : (
          <>
            <div className="operacion-resumen">
              <span>Total Gastos: ${Number(gastosMantenimiento?.resumenTotal || 0).toFixed(2)}</span>
            </div>
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Registros</th>
                  <th>Total Gastos</th>
                </tr>
              </thead>
              <tbody>
                {(gastosMantenimiento?.gastos || []).map((item) => (
                  <tr key={item.camionId}>
                    <td>{item.patente || `Camión ${item.camionId}`}</td>
                    <td>{item.cantidadRegistros}</td>
                    <td>${item.totalGastos.toFixed(2)}</td>
                  </tr>
                ))}
                {(gastosMantenimiento?.gastos || []).length === 0 && (
                  <tr>
                    <td colSpan={3}>No hay gastos de mantenimiento para el filtro seleccionado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="tabla-container">
        <div className="section-header-inline">
          <h3>Ingresos Mensuales</h3>
          <button
            className="btn-rapido btn-rapido--accent"
            onClick={exportIngresosMensualesCsv}
            disabled={loadingAdicionales || !(ingresosMensuales?.ingresos || []).length}
          >
            Exportar CSV
          </button>
        </div>
        {loadingAdicionales ? (
          <p>Cargando ingresos mensuales...</p>
        ) : (
          <>
            <div className="operacion-resumen">
              <span>Viajes: {Number(ingresosMensuales?.resumen.totalViajesCompletos || 0)}</span>
              <span>Ingresos: ${Number(ingresosMensuales?.resumen.totalIngresos || 0).toFixed(2)}</span>
              <span>Gastos: ${Number(ingresosMensuales?.resumen.totalGastos || 0).toFixed(2)}</span>
              <span>Ganancia: ${Number(ingresosMensuales?.resumen.totalGananciaNeta || 0).toFixed(2)}</span>
            </div>
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Viajes</th>
                  <th>Ingresos</th>
                  <th>Gastos</th>
                  <th>Ganancia Neta</th>
                  <th>Rentabilidad</th>
                </tr>
              </thead>
              <tbody>
                {(ingresosMensuales?.ingresos || []).map((item) => (
                  <tr key={item.mes}>
                    <td>{item.mes}</td>
                    <td>{item.viajesCompletos}</td>
                    <td>${item.ingresos.toFixed(2)}</td>
                    <td>${item.gastos.toFixed(2)}</td>
                    <td>${item.gananciaNeta.toFixed(2)}</td>
                    <td>{item.rentabilidad.toFixed(2)}%</td>
                  </tr>
                ))}
                {(ingresosMensuales?.ingresos || []).length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay ingresos mensuales para el filtro seleccionado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Reportes;
