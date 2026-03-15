import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Line } from 'react-chartjs-2';
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
import { useAuth } from '../contexts/AuthContext';
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

const OPERATION_COLORS = [
  '#1F77B4',
  '#2E8B57',
  '#9B59B6',
  '#FF7F0E',
  '#17A2B8',
  '#E83E8C',
  '#6C757D',
  '#20C997',
  '#D63384',
  '#FD7E14',
];

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
  const [loadingComparativaTimeline, setLoadingComparativaTimeline] = useState(false);
  const [loadingOperacion, setLoadingOperacion] = useState(false);
  const [loadingAdicionales, setLoadingAdicionales] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<RentabilidadResponse | null>(null);
  const [comparativa, setComparativa] = useState<RentabilidadComparativaResponse | null>(null);
  const [comparativaTimeline, setComparativaTimeline] = useState<Record<number, RentabilidadResponse>>({});
  const [operacionCamiones, setOperacionCamiones] = useState<Record<number, OperacionCamionResponse>>({});
  const [desempenoChoferes, setDesempenoChoferes] = useState<DesempenoChoferesResponse | null>(null);
  const [gastosMantenimiento, setGastosMantenimiento] = useState<GastosMantenimientoResponse | null>(null);
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresosMensualesResponse | null>(null);

  const [granularidadIngresos, setGranularidadIngresos] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
  const [ingresosMode, setIngresosMode] = useState<'agregado' | 'por_camion'>('agregado');
  const [ingresosMetric, setIngresosMetric] = useState<'ingresos' | 'gastos' | 'gananciaNeta'>('ingresos');
  const [ingresosSelectedCamionIds, setIngresosSelectedCamionIds] = useState<string[]>([]);
  const [rentabilidadDetalleCamion, setRentabilidadDetalleCamion] = useState<Record<number, RentabilidadResponse>>({});
  const [loadingRentabilidadDetalle, setLoadingRentabilidadDetalle] = useState(false);
  const [camionIds, setCamionIds] = useState<string[]>([]);
  const [choferIds, setChoferIds] = useState<string[]>([]);
  const [desde, setDesde] = useState<string>(defaultDesdeDiario);
  const [hasta, setHasta] = useState<string>(today.toISOString().split('T')[0]);

  const [compararPor, setCompararPor] = useState<'camion' | 'chofer'>('camion');
  const [comparativaMetric, setComparativaMetric] = useState<'rentabilidad' | 'ingresos' | 'gastos' | 'gananciaNeta'>('rentabilidad');
  const [comparativaGranularidad, setComparativaGranularidad] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
  const [selectedComparativaEntityIds, setSelectedComparativaEntityIds] = useState<string[]>([]);
  const [selectedOperacionCamionIds, setSelectedOperacionCamionIds] = useState<string[]>([]);
  const [granularidadOperacion, setGranularidadOperacion] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
  const [operacionSerieVista, setOperacionSerieVista] = useState<'ambos' | 'km' | 'toneladas'>('ambos');
  const [rentabilidadExportColumns, setRentabilidadExportColumns] = useState<Record<RentabilidadExportColumnKey, boolean>>(
    DEFAULT_RENTABILIDAD_EXPORT_COLUMNS,
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [camionesData, choferesData] = await Promise.all([
          camionesService.getAll(),
          choferesService.getAll(),
        ]);
        setCamiones(camionesData);
        setChoferes(choferesData);
        setSelectedOperacionCamionIds(camionesData.map((camion) => String(camion.id)));
        setIngresosSelectedCamionIds(camionesData.map((camion) => String(camion.id)));
      } catch (err) {
        console.error(err);
      }
    };

    loadCatalogs();
  }, []);

  useEffect(() => {
    fetchRentabilidad();
  }, [granularidadIngresos, camionIds, choferIds, desde, hasta]);

  useEffect(() => {
    if (ingresosMode === 'por_camion') {
      fetchRentabilidadDetalleCamion();
    }
  }, [ingresosMode, granularidadIngresos, ingresosSelectedCamionIds, camionIds, choferIds, desde, hasta]);

  useEffect(() => {
    fetchComparativa();
  }, [compararPor, desde, hasta]);

  useEffect(() => {
    const availableIds = new Set((comparativa?.comparativas || []).map((item) => String(item.id)));
    setSelectedComparativaEntityIds((prev) => {
      const stillAvailable = prev.filter((id) => availableIds.has(id));
      return stillAvailable.length > 0 ? stillAvailable : Array.from(availableIds);
    });
  }, [comparativa, compararPor]);

  useEffect(() => {
    fetchComparativaTimeline();
  }, [comparativa, compararPor, comparativaGranularidad, camionIds, choferIds, desde, hasta]);

  useEffect(() => {
    fetchOperacionCamiones();
  }, [camiones, camionIds, granularidadOperacion, desde, hasta]);

  useEffect(() => {
    fetchReportesAdicionales();
  }, [camionIds, choferIds, desde, hasta]);

  const fetchRentabilidad = async () => {
    try {
      setLoadingRentabilidad(true);
      setError(null);
      const data = await reportesService.getRentabilidad({
        granularidad: granularidadIngresos,
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

  const fetchRentabilidadDetalleCamion = async () => {
    const targetIds = ingresosSelectedCamionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (targetIds.length === 0) {
      setRentabilidadDetalleCamion({});
      return;
    }
    try {
      setLoadingRentabilidadDetalle(true);
      const results = await Promise.all(
        targetIds.map(async (camionId) => {
          const data = await reportesService.getRentabilidad({
            granularidad: granularidadIngresos,
            camionIds: [camionId],
            choferIds: choferIds.length ? choferIds.map((id) => Number(id)) : undefined,
            desde,
            hasta,
          });
          return [camionId, data] as const;
        }),
      );
      const next: Record<number, RentabilidadResponse> = {};
      for (const [id, data] of results) next[id] = data;
      setRentabilidadDetalleCamion(next);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar el detalle por camión');
    } finally {
      setLoadingRentabilidadDetalle(false);
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

  const fetchComparativaTimeline = async () => {
    const entities = comparativa?.comparativas || [];
    if (entities.length === 0) {
      setComparativaTimeline({});
      return;
    }

    try {
      setLoadingComparativaTimeline(true);
      const results = await Promise.all(
        entities.map(async (entity) => {
          const data = await reportesService.getRentabilidad({
            granularidad: comparativaGranularidad,
            camionIds: compararPor === 'camion' ? [entity.id] : (camionIds.length ? camionIds.map((id) => Number(id)) : undefined),
            choferIds: compararPor === 'chofer' ? [entity.id] : (choferIds.length ? choferIds.map((id) => Number(id)) : undefined),
            desde,
            hasta,
          });
          return [entity.id, data] as const;
        }),
      );

      const nextTimeline: Record<number, RentabilidadResponse> = {};
      for (const [entityId, data] of results) {
        nextTimeline[entityId] = data;
      }
      setComparativaTimeline(nextTimeline);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar la comparativa temporal');
    } finally {
      setLoadingComparativaTimeline(false);
    }
  };

  const fetchOperacionCamiones = async () => {
    if (camiones.length === 0) {
      setOperacionCamiones({});
      return;
    }

    const targetCamionIds = camionIds.length
      ? camionIds.map((id) => Number(id))
      : camiones.map((camion) => camion.id);

    try {
      setLoadingOperacion(true);
      const results = await Promise.all(
        targetCamionIds.map(async (camionId) => {
          const data = await reportesService.getOperacionCamion({
            camionId,
            granularidad: granularidadOperacion,
            desde,
            hasta,
          });
          return [camionId, data] as const;
        }),
      );

      const nextOperacionCamiones: Record<number, OperacionCamionResponse> = {};
      for (const [camionId, data] of results) {
        nextOperacionCamiones[camionId] = data;
      }

      setOperacionCamiones(nextOperacionCamiones);
      setSelectedOperacionCamionIds((prev) => {
        const availableIdSet = new Set(targetCamionIds.map((id) => String(id)));
        const stillAvailable = prev.filter((id) => availableIdSet.has(id));
        return stillAvailable.length > 0 ? stillAvailable : Array.from(availableIdSet);
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar la operación de los camiones');
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

  const comparativaFilteredData = useMemo(() => {
    const rows = comparativa?.comparativas || [];
    const selectedIdSet = new Set(selectedComparativaEntityIds.map((id) => Number(id)));
    return rows.filter((item) => selectedIdSet.has(item.id));
  }, [comparativa, selectedComparativaEntityIds]);

  const exportRentabilidadCsv = () => {
    const rows = (reporte?.series || []).map((point) => buildRentabilidadRowBySelectedColumns(point));

    downloadCsv(
      `rentabilidad_${desde}_${hasta}.csv`,
      selectedRentabilidadColumns.map((column) => column.label),
      rows,
    );
  };

  const exportComparativaCsv = () => {
    const selectedEntityIds = comparativaFilteredData.map((item) => item.id);
    const allPeriods = new Set<string>();

    for (const entityId of selectedEntityIds) {
      const series = comparativaTimeline[entityId]?.series || [];
      for (const point of series) {
        allPeriods.add(point.periodo);
      }
    }

    const sortedPeriods = Array.from(allPeriods).sort((a, b) => a.localeCompare(b));
    const headers = ['Periodo', ...comparativaFilteredData.map((item) => item.label)];

    const rows = sortedPeriods.map((period) => {
      const firstPoint = (comparativaTimeline[selectedEntityIds[0]]?.series || []).find((point) => point.periodo === period);
      const periodLabel = firstPoint?.etiqueta || period;
      const row: Array<string | number> = [periodLabel];

      for (const entity of comparativaFilteredData) {
        const point = (comparativaTimeline[entity.id]?.series || []).find((item) => item.periodo === period);
        const ingresos = point?.ingresos || 0;
        const gastos = point?.gastos || 0;
        const gananciaNeta = point?.gananciaNeta || 0;
        const rentabilidad = ingresos > 0 ? (gananciaNeta / ingresos) * 100 : 0;

        let value = rentabilidad;
        if (comparativaMetric === 'ingresos') value = ingresos;
        if (comparativaMetric === 'gastos') value = gastos;
        if (comparativaMetric === 'gananciaNeta') value = gananciaNeta;

        row.push(value.toFixed(2));
      }

      return row;
    });

    downloadCsv(
      `comparativa_${compararPor}_${comparativaGranularidad}_${desde}_${hasta}.csv`,
      headers,
      rows,
    );
  };

  const operacionCamionesDisponibles = useMemo(() => {
    const filteredIds = camionIds.length ? new Set(camionIds.map((id) => Number(id))) : null;
    return camiones.filter((camion) => !filteredIds || filteredIds.has(camion.id));
  }, [camiones, camionIds]);

  const operacionCamionById = useMemo(() => {
    const map = new Map<number, Camion>();
    for (const camion of camiones) {
      map.set(camion.id, camion);
    }
    return map;
  }, [camiones]);

  const selectedOperacionIdsNum = useMemo(
    () => selectedOperacionCamionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
    [selectedOperacionCamionIds],
  );

  const operacionSeriesPeriods = useMemo(() => {
    const allPeriods = new Set<string>();
    for (const camionId of selectedOperacionIdsNum) {
      const series = operacionCamiones[camionId]?.series || [];
      for (const item of series) {
        allPeriods.add(item.periodo);
      }
    }
    return Array.from(allPeriods).sort((a, b) => a.localeCompare(b));
  }, [operacionCamiones, selectedOperacionIdsNum]);

  const operacionLabelByPeriod = useMemo(() => {
    const map = new Map<string, string>();
    for (const camionId of selectedOperacionIdsNum) {
      const series = operacionCamiones[camionId]?.series || [];
      for (const item of series) {
        if (!map.has(item.periodo)) {
          map.set(item.periodo, item.etiqueta);
        }
      }
    }
    return map;
  }, [operacionCamiones, selectedOperacionIdsNum]);

  const exportOperacionCsv = () => {
    const headers = ['Periodo'];
    const seriesByCamion = new Map<number, Map<string, { kms: number; toneladas: number }>>();

    for (const camionId of selectedOperacionIdsNum) {
      const camion = operacionCamionById.get(camionId);
      const camionLabel = camion?.patente || `Camión ${camionId}`;
      headers.push(`${camionLabel} (KM)`, `${camionLabel} (Ton)`);

      const periodMap = new Map<string, { kms: number; toneladas: number }>();
      const series = operacionCamiones[camionId]?.series || [];
      for (const point of series) {
        periodMap.set(point.periodo, { kms: point.kms, toneladas: point.toneladas });
      }
      seriesByCamion.set(camionId, periodMap);
    }

    const rows = operacionSeriesPeriods.map((period) => {
      const row: Array<string | number> = [operacionLabelByPeriod.get(period) || period];
      for (const camionId of selectedOperacionIdsNum) {
        const value = seriesByCamion.get(camionId)?.get(period);
        row.push(value ? value.kms.toFixed(2) : '0.00');
        row.push(value ? value.toneladas.toFixed(2) : '0.00');
      }
      return row;
    });

    downloadCsv(
      `operacion_camiones_${granularidadOperacion}_${desde}_${hasta}.csv`,
      headers,
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
    doc.text(`Granularidad: ${granularidadIngresos}`, 14, 27);
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
    doc.text('Operacion de camiones', 14, currentY);

    const operationHead = ['Periodo'];
    for (const camionId of selectedOperacionIdsNum) {
      const camion = operacionCamionById.get(camionId);
      const camionLabel = camion?.patente || `Camión ${camionId}`;
      operationHead.push(`${camionLabel} KM`, `${camionLabel} Ton`);
    }

    const operationRows = operacionSeriesPeriods.map((period) => {
      const row: string[] = [operacionLabelByPeriod.get(period) || period];
      for (const camionId of selectedOperacionIdsNum) {
        const point = (operacionCamiones[camionId]?.series || []).find((item) => item.periodo === period);
        row.push((point?.kms || 0).toFixed(2), (point?.toneladas || 0).toFixed(2));
      }
      return row;
    });

    autoTable(doc, {
      startY: currentY + 2,
      head: [operationHead],
      body: operationRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 127, 14] },
    });

    doc.save(`reporte_rentabilidad_${desde}_${hasta}.pdf`);
  };

  const ingresosCamionesDisponibles = useMemo(() => {
    const filteredIds = camionIds.length ? new Set(camionIds.map((id) => Number(id))) : null;
    return camiones.filter((camion) => !filteredIds || filteredIds.has(camion.id));
  }, [camiones, camionIds]);

  const ingresosSelectedIdsNum = useMemo(
    () => ingresosSelectedCamionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
    [ingresosSelectedCamionIds],
  );

  const ingresosChartPeriods = useMemo(() => {
    if (ingresosMode === 'agregado') return [] as string[];
    const allPeriods = new Set<string>();
    for (const camionId of ingresosSelectedIdsNum) {
      for (const p of rentabilidadDetalleCamion[camionId]?.series || []) allPeriods.add(p.periodo);
    }
    return Array.from(allPeriods).sort((a, b) => a.localeCompare(b));
  }, [ingresosMode, rentabilidadDetalleCamion, ingresosSelectedIdsNum]);

  const ingresosChartLabelByPeriod = useMemo(() => {
    const map = new Map<string, string>();
    for (const camionId of ingresosSelectedIdsNum) {
      for (const p of rentabilidadDetalleCamion[camionId]?.series || []) {
        if (!map.has(p.periodo)) map.set(p.periodo, p.etiqueta);
      }
    }
    return map;
  }, [rentabilidadDetalleCamion, ingresosSelectedIdsNum]);

  const chartData = useMemo(() => {
    if (ingresosMode === 'agregado') {
      return {
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
    }
    return {
      labels: ingresosChartPeriods.map((p) => ingresosChartLabelByPeriod.get(p) || p),
      datasets: ingresosSelectedIdsNum.map((camionId, index) => {
        const camion = operacionCamionById.get(camionId);
        const label = camion?.patente || `Camión ${camionId}`;
        const color = OPERATION_COLORS[index % OPERATION_COLORS.length];
        const byPeriod = new Map((rentabilidadDetalleCamion[camionId]?.series || []).map((p) => [p.periodo, p]));
        return {
          label,
          data: ingresosChartPeriods.map((period) => {
            const point = byPeriod.get(period);
            if (!point) return 0;
            if (ingresosMetric === 'gastos') return point.gastos;
            if (ingresosMetric === 'gananciaNeta') return point.gananciaNeta;
            return point.ingresos;
          }),
          borderColor: color,
          backgroundColor: `${color}26`,
          tension: 0.25,
        };
      }),
    };
  }, [ingresosMode, ingresosMetric, ingresosSelectedIdsNum, ingresosChartPeriods, ingresosChartLabelByPeriod, reporte, rentabilidadDetalleCamion, operacionCamionById]);

  const comparativaPeriods = useMemo(() => {
    const allPeriods = new Set<string>();
    for (const entity of comparativaFilteredData) {
      const series = comparativaTimeline[entity.id]?.series || [];
      for (const point of series) {
        allPeriods.add(point.periodo);
      }
    }
    return Array.from(allPeriods).sort((a, b) => a.localeCompare(b));
  }, [comparativaFilteredData, comparativaTimeline]);

  const comparativaLabelByPeriod = useMemo(() => {
    const map = new Map<string, string>();
    for (const entity of comparativaFilteredData) {
      const series = comparativaTimeline[entity.id]?.series || [];
      for (const point of series) {
        if (!map.has(point.periodo)) {
          map.set(point.periodo, point.etiqueta);
        }
      }
    }
    return map;
  }, [comparativaFilteredData, comparativaTimeline]);

  const comparativaChartData = {
    labels: comparativaPeriods.map((period) => comparativaLabelByPeriod.get(period) || period),
    datasets: comparativaFilteredData.map((entity, index) => {
      const color = OPERATION_COLORS[index % OPERATION_COLORS.length];
      const series = comparativaTimeline[entity.id]?.series || [];
      const byPeriod = new Map(series.map((point) => [point.periodo, point]));

      return {
        label: entity.label,
        data: comparativaPeriods.map((period) => {
          const point = byPeriod.get(period);
          if (!point) return 0;

          if (comparativaMetric === 'ingresos') return point.ingresos;
          if (comparativaMetric === 'gastos') return point.gastos;
          if (comparativaMetric === 'gananciaNeta') return point.gananciaNeta;

          return point.ingresos > 0 ? (point.gananciaNeta / point.ingresos) * 100 : 0;
        }),
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.25,
      };
    }),
  };

  const comparativaChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 24,
          boxHeight: 10,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 24,
          minRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text:
            comparativaMetric === 'rentabilidad'
              ? 'Rentabilidad %'
              : comparativaMetric === 'ingresos'
                ? 'Ingresos'
                : comparativaMetric === 'gastos'
                  ? 'Gastos'
                  : 'Ganancia Neta',
        },
      },
    },
  };

  const operacionChartData = {
    labels: operacionSeriesPeriods.map((period) => operacionLabelByPeriod.get(period) || period),
    datasets: selectedOperacionIdsNum.flatMap((camionId, index) => {
      const series = operacionCamiones[camionId]?.series || [];
      const byPeriod = new Map(series.map((point) => [point.periodo, point]));
      const camion = operacionCamionById.get(camionId);
      const camionLabel = camion?.patente || `Camión ${camionId}`;
      const color = OPERATION_COLORS[index % OPERATION_COLORS.length];

      const datasets: Array<{
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
        yAxisID: 'y' | 'y1';
        borderDash?: number[];
      }> = [];

      if (operacionSerieVista === 'ambos' || operacionSerieVista === 'km') {
        datasets.push({
          label: `${camionLabel} - KM`,
          data: operacionSeriesPeriods.map((period) => byPeriod.get(period)?.kms || 0),
          borderColor: color,
          backgroundColor: `${color}33`,
          tension: 0.25,
          yAxisID: 'y',
        });
      }

      if (operacionSerieVista === 'ambos' || operacionSerieVista === 'toneladas') {
        datasets.push({
          label: `${camionLabel} - Ton`,
          data: operacionSeriesPeriods.map((period) => byPeriod.get(period)?.toneladas || 0),
          borderColor: color,
          backgroundColor: `${color}26`,
          borderDash: [7, 5],
          tension: 0.25,
          yAxisID: 'y1',
        });
      }

      return datasets;
    }),
  };

  const operacionChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'KM',
        },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Toneladas',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 28,
          boxHeight: 12,
        },
      },
    },
  };

  return (
    <div className="reportes-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Truck Manager</h1>
          <div className="navbar-user">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="page-back-button-container">
        <BackButton label="Volver al Dashboard" to="/dashboard" />
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
          disabled={
            !reporte?.series.length &&
            !comparativa?.comparativas.length &&
            operacionSeriesPeriods.length === 0
          }
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

      <div className="chart-container">
        <div className="section-header-inline">
          <h3>Ingresos vs Gastos por Período</h3>
          <div className="inline-controls inline-controls-compact">
            <div className="filtro-item small-inline">
              <label>Agrupar por</label>
              <select
                value={granularidadIngresos}
                onChange={(e) => setGranularidadIngresos(e.target.value as 'diaria' | 'semanal' | 'mensual')}
              >
                <option value="diaria">Día</option>
                <option value="semanal">Semana</option>
                <option value="mensual">Mes</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Vista</label>
              <select
                value={ingresosMode}
                onChange={(e) => setIngresosMode(e.target.value as 'agregado' | 'por_camion')}
              >
                <option value="agregado">Todos (suma)</option>
                <option value="por_camion">Por camión</option>
              </select>
            </div>
            {ingresosMode === 'por_camion' && (
              <>
                <div className="filtro-item small-inline">
                  <label>Métrica</label>
                  <select
                    value={ingresosMetric}
                    onChange={(e) => setIngresosMetric(e.target.value as 'ingresos' | 'gastos' | 'gananciaNeta')}
                  >
                    <option value="ingresos">Ingresos</option>
                    <option value="gastos">Gastos</option>
                    <option value="gananciaNeta">Ganancia Neta</option>
                  </select>
                </div>
                <div className="filtro-item small-inline">
                  <label>Camiones en gráfica</label>
                  <select
                    multiple
                    className="multi-select multi-select-compact"
                    value={ingresosSelectedCamionIds}
                    onChange={(e) => setIngresosSelectedCamionIds(readMultiSelectValues(e))}
                  >
                    {ingresosCamionesDisponibles.map((camion) => (
                      <option key={camion.id} value={camion.id}>
                        {camion.patente} - {camion.marca}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button
              className="btn-rapido btn-rapido--accent"
              onClick={exportRentabilidadCsv}
              disabled={ingresosMode === 'agregado' ? !reporte?.series.length : ingresosChartPeriods.length === 0}
            >
              Exportar CSV
            </button>
          </div>
        </div>
        {ingresosMode === 'por_camion' && (
          <div className="operation-selection-actions">
            <button
              className="btn-rapido btn-rapido--ghost"
              onClick={() => setIngresosSelectedCamionIds(ingresosCamionesDisponibles.map((camion) => String(camion.id)))}
            >
              Mostrar todos
            </button>
            <button
              className="btn-rapido btn-rapido--ghost"
              onClick={() => setIngresosSelectedCamionIds([])}
            >
              Limpiar selección
            </button>
          </div>
        )}
        {loadingRentabilidad || (ingresosMode === 'por_camion' && loadingRentabilidadDetalle) ? (
          <p>Cargando gráfico...</p>
        ) : (
          <Line data={chartData} />
        )}
      </div>

      <div className="chart-container">
        <div className="section-header-inline">
          <h3>Comparativa de Rentabilidad (Timeline)</h3>
          <div className="inline-controls inline-controls-compact">
            <div className="filtro-item small-inline">
              <label>Comparar por</label>
              <select value={compararPor} onChange={(e) => setCompararPor(e.target.value as 'camion' | 'chofer')}>
                <option value="camion">Camión</option>
                <option value="chofer">Chofer</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Agrupar por</label>
              <select
                value={comparativaGranularidad}
                onChange={(e) => setComparativaGranularidad(e.target.value as 'diaria' | 'semanal' | 'mensual')}
              >
                <option value="diaria">Día</option>
                <option value="semanal">Semana</option>
                <option value="mensual">Mes</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Métrica</label>
              <select
                value={comparativaMetric}
                onChange={(e) => setComparativaMetric(e.target.value as 'rentabilidad' | 'ingresos' | 'gastos' | 'gananciaNeta')}
              >
                <option value="rentabilidad">Rentabilidad %</option>
                <option value="ingresos">Ingresos</option>
                <option value="gastos">Gastos</option>
                <option value="gananciaNeta">Ganancia Neta</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>{compararPor === 'camion' ? 'Camiones' : 'Choferes'} en gráfica</label>
              <select
                multiple
                className="multi-select multi-select-compact"
                value={selectedComparativaEntityIds}
                onChange={(e) => setSelectedComparativaEntityIds(readMultiSelectValues(e))}
              >
                {(comparativa?.comparativas || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-rapido btn-rapido--accent" onClick={exportComparativaCsv} disabled={comparativaPeriods.length === 0}>
              Exportar CSV
            </button>
          </div>
        </div>
        <div className="operation-selection-actions">
          <button
            className="btn-rapido btn-rapido--ghost"
            onClick={() => setSelectedComparativaEntityIds((comparativa?.comparativas || []).map((item) => String(item.id)))}
          >
            Mostrar todos
          </button>
          <button
            className="btn-rapido btn-rapido--ghost"
            onClick={() => setSelectedComparativaEntityIds([])}
          >
            Limpiar selección
          </button>
        </div>
        {loadingComparativa || loadingComparativaTimeline ? <p>Cargando comparativa...</p> : <Line data={comparativaChartData} options={comparativaChartOptions} />}
      </div>

      <div className="chart-container">
        <div className="section-header-inline">
          <h3>Operación de Camiones (KM + Toneladas)</h3>
          <div className="inline-controls">
            <div className="filtro-item small-inline">
              <label>Agrupar por</label>
              <select
                value={granularidadOperacion}
                onChange={(e) => setGranularidadOperacion(e.target.value as 'diaria' | 'semanal' | 'mensual')}
              >
                <option value="diaria">Día</option>
                <option value="semanal">Semana</option>
                <option value="mensual">Mes</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Series visibles</label>
              <select
                value={operacionSerieVista}
                onChange={(e) => setOperacionSerieVista(e.target.value as 'ambos' | 'km' | 'toneladas')}
              >
                <option value="ambos">KM + Ton</option>
                <option value="km">Solo KM</option>
                <option value="toneladas">Solo Toneladas</option>
              </select>
            </div>
            <div className="filtro-item small-inline">
              <label>Camiones en gráfica</label>
              <select
                multiple
                className="multi-select multi-select-compact"
                value={selectedOperacionCamionIds}
                onChange={(e) => setSelectedOperacionCamionIds(readMultiSelectValues(e))}
              >
                {operacionCamionesDisponibles.map((camion) => (
                  <option key={camion.id} value={camion.id}>
                    {camion.patente} - {camion.marca}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-rapido btn-rapido--accent" onClick={exportOperacionCsv} disabled={operacionSeriesPeriods.length === 0}>
              Exportar CSV
            </button>
          </div>
        </div>
        <div className="operation-selection-actions">
          <button
            className="btn-rapido btn-rapido--ghost"
            onClick={() => setSelectedOperacionCamionIds(operacionCamionesDisponibles.map((camion) => String(camion.id)))}
          >
            Mostrar todos
          </button>
          <button
            className="btn-rapido btn-rapido--ghost"
            onClick={() => setSelectedOperacionCamionIds([])}
          >
            Limpiar selección
          </button>
        </div>
        {loadingOperacion ? <p>Cargando operación...</p> : <Line data={operacionChartData} options={operacionChartOptions} />}
        <div className="operacion-resumen">
          <span>
            Total KM: {selectedOperacionIdsNum.reduce((acc, camionId) => acc + Number(operacionCamiones[camionId]?.resumen.totalKms || 0), 0).toFixed(2)}
          </span>
          <span>
            Total Toneladas: {selectedOperacionIdsNum.reduce((acc, camionId) => acc + Number(operacionCamiones[camionId]?.resumen.totalToneladas || 0), 0).toFixed(2)}
          </span>
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
