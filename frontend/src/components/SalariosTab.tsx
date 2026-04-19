import React, { useEffect, useMemo, useState } from 'react';
import salariosService from '../services/salariosService';
import {
  ChoferSalario,
  EstadoSalario,
  SalarioPago,
  TipoPagoSalario,
  formatCurrency,
  formatPeriodo,
  getEstadoSalarioColor,
  getEstadoSalarioLabel,
} from '../types/salario';
import '../styles/SalariosTab.css';

type PagoHistorico = {
  salario: ChoferSalario;
  pago: SalarioPago;
};

const MAX_COMPROBANTE_SIZE_MB = 10;
const ALLOWED_COMPROBANTE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
];

const ALLOWED_COMPROBANTE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
    reader.readAsDataURL(file);
  });

const normalizeMimeType = (mimeType?: string) => {
  if (!mimeType) return '';
  return mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType.toLowerCase();
};

const getFileExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

const getMimeTypeFromDataUrl = (value?: string) => {
  if (!value || !value.startsWith('data:')) return '';
  const semiColonIndex = value.indexOf(';');
  if (semiColonIndex <= 5) return '';
  return normalizeMimeType(value.slice(5, semiColonIndex));
};

const isImageAttachment = (value?: string) => {
  if (!value) return false;
  const dataUrlMimeType = getMimeTypeFromDataUrl(value);
  if (dataUrlMimeType) return dataUrlMimeType.startsWith('image/');
  return /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(value);
};

const isPdfAttachment = (value?: string) => {
  if (!value) return false;
  const dataUrlMimeType = getMimeTypeFromDataUrl(value);
  if (dataUrlMimeType) return dataUrlMimeType === 'application/pdf';
  return /\.pdf(\?|$)/i.test(value);
};

const isEmbeddedAttachment = (value?: string) => Boolean(value && value.startsWith('data:'));

const getAttachmentKindLabel = (value?: string) => {
  if (!value) return 'Adjunto';
  if (value.startsWith('data:application/pdf')) return 'PDF adjunto';
  if (value.startsWith('data:image/')) return 'Imagen adjunta';
  return 'Adjunto';
};

const getAttachmentExtension = (value?: string) => {
  if (!value) return '';
  if (value.startsWith('data:application/pdf')) return '.pdf';
  if (value.startsWith('data:image/png')) return '.png';
  if (value.startsWith('data:image/webp')) return '.webp';
  return '.jpg';
};

const padDate = (value: number) => value.toString().padStart(2, '0');

const getTodayLocalInputValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${padDate(today.getMonth() + 1)}-${padDate(today.getDate())}`;
};

const extractDatePart = (value?: string) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
};

const toDateInputValue = (value?: string) => {
  const datePart = extractDatePart(value);
  if (datePart) {
    return `${datePart.year}-${padDate(datePart.month)}-${padDate(datePart.day)}`;
  }

  if (!value) {
    return getTodayLocalInputValue();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getTodayLocalInputValue();
  }

  return `${parsed.getFullYear()}-${padDate(parsed.getMonth() + 1)}-${padDate(parsed.getDate())}`;
};

const formatDateForDisplay = (value?: string) => {
  const datePart = extractDatePart(value);
  if (!datePart) return '-';
  return new Date(datePart.year, datePart.month - 1, datePart.day).toLocaleDateString('es-CL');
};

interface SalariosTabProps {
  choferId: number;
}

const SalariosTab: React.FC<SalariosTabProps> = ({ choferId }) => {
  const [salarios, setSalarios] = useState<ChoferSalario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showPagoManualModal, setShowPagoManualModal] = useState(false);
  const [salarioSeleccionado, setSalarioSeleccionado] = useState<ChoferSalario | null>(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [pagoForm, setPagoForm] = useState({
    monto: '',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    comprobanteAdjunto: '',
    observaciones: '',
  });
  const [pagoManualForm, setPagoManualForm] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    salarioBase: '',
    totalComisiones: '0',
    bonos: '0',
    deducciones: '0',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    monto: '',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    comprobanteAdjunto: '',
    observaciones: '',
  });
  const metodosPago = ['transferencia', 'efectivo', 'cheque', 'otro'];

  const [showEditarPagoModal, setShowEditarPagoModal] = useState(false);
  const [pagoEditando, setPagoEditando] = useState<{ salarioId: number; pagoId: number } | null>(null);
  const [guardandoEditarPago, setGuardandoEditarPago] = useState(false);
  const [editarPagoError, setEditarPagoError] = useState<string | null>(null);
  const [isPagoDropActive, setIsPagoDropActive] = useState(false);
  const [isPagoManualDropActive, setIsPagoManualDropActive] = useState(false);
  const [isPagoEditarDropActive, setIsPagoEditarDropActive] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);
  const [pagoEditarForm, setPagoEditarForm] = useState({
    monto: '',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    comprobanteAdjunto: '',
    observaciones: '',
  });

  const handleComprobanteFileChange = async <T extends { comprobanteAdjunto: string }>(
    files: FileList | null,
    setForm: React.Dispatch<React.SetStateAction<T>>,
    setFormError: (message: string | null) => void,
  ) => {
    const file = files?.[0];
    if (!file) return;

    const normalizedMimeType = normalizeMimeType(file.type);
    const extension = getFileExtension(file.name);
    const isMimeAllowed = normalizedMimeType
      ? ALLOWED_COMPROBANTE_MIME_TYPES.map((mimeType) => normalizeMimeType(mimeType)).includes(normalizedMimeType)
      : false;
    const isExtensionAllowed = ALLOWED_COMPROBANTE_EXTENSIONS.includes(extension);

    if (!isMimeAllowed && !isExtensionAllowed) {
      setFormError('Solo se permiten comprobantes en PDF o imagen (PNG, JPG, WEBP, GIF, BMP, SVG)');
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_COMPROBANTE_SIZE_MB) {
      setFormError(`El archivo supera el límite de ${MAX_COMPROBANTE_SIZE_MB}MB`);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, comprobanteAdjunto: dataUrl }));
      setFormError(null);
    } catch (error) {
      console.error(error);
      setFormError('No se pudo procesar el archivo adjunto');
    }
  };

  const handleOpenAttachmentPreview = (attachmentValue?: string) => {
    if (!attachmentValue) return;
    setPreviewAttachment(attachmentValue);
  };

  const handleCloseAttachmentPreview = () => {
    setPreviewAttachment(null);
  };

  const handleComprobanteDragOver = (
    event: React.DragEvent<HTMLElement>,
    setActive: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(true);
  };

  const handleComprobanteDragLeave = (
    event: React.DragEvent<HTMLElement>,
    setActive: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
  };

  const handleComprobanteDrop = async <T extends { comprobanteAdjunto: string }>(
    event: React.DragEvent<HTMLElement>,
    setForm: React.Dispatch<React.SetStateAction<T>>,
    setFormError: (message: string | null) => void,
    setActive: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
    await handleComprobanteFileChange(event.dataTransfer.files, setForm, setFormError);
  };

  const loadSalarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salariosService.getByChofer(choferId);
      setSalarios(data);
    } catch (err: any) {
      console.error('Error al cargar salarios del chofer:', err);
      setError(err?.response?.data?.message || 'No se pudieron cargar los salarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalarios();
  }, [choferId]);

  const getTotalPagado = (salario: ChoferSalario): number =>
    (salario.pagos || []).reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  const getSaldoPendiente = (salario: ChoferSalario): number =>
    Math.max(Number(salario.salarioNeto || 0) - getTotalPagado(salario), 0);

  const resumen = useMemo(() => {
    const totalNeto = salarios.reduce((acc, salario) => acc + Number(salario.salarioNeto || 0), 0);
    const totalPagado = salarios.reduce((acc, salario) => acc + getTotalPagado(salario), 0);
    const movimientos = salarios.reduce((acc, salario) => acc + (salario.pagos?.length || 0), 0);

    return {
      totalNeto,
      totalPagado,
      saldoPendiente: Math.max(totalNeto - totalPagado, 0),
      movimientos,
    };
  }, [salarios]);

  const salariosPendientes = useMemo(
    () =>
      salarios
        .filter((salario) => salario.estado !== EstadoSalario.CANCELADO && getSaldoPendiente(salario) > 0)
        .sort((a, b) => {
          if (a.anio !== b.anio) {
            return b.anio - a.anio;
          }
          return b.mes - a.mes;
        }),
    [salarios],
  );

  const pagosHistoricos = useMemo<PagoHistorico[]>(
    () =>
      salarios
        .flatMap((salario) =>
          (salario.pagos || []).map((pago) => ({
            salario,
            pago,
          })),
        )
        .sort((a, b) => {
          const fechaA = a.pago.fechaPago ? new Date(a.pago.fechaPago).getTime() : 0;
          const fechaB = b.pago.fechaPago ? new Date(b.pago.fechaPago).getTime() : 0;
          if (fechaA !== fechaB) {
            return fechaB - fechaA;
          }
          if (a.salario.anio !== b.salario.anio) {
            return b.salario.anio - a.salario.anio;
          }
          return b.salario.mes - a.salario.mes;
        }),
    [salarios],
  );

  const handleAbrirPagoModal = (salario: ChoferSalario) => {
    const saldo = getSaldoPendiente(salario);

    setSalarioSeleccionado(salario);
    setPagoError(null);
    setPagoForm({
      monto: saldo > 0 ? saldo.toFixed(2) : '',
      fechaPago: getTodayLocalInputValue(),
      metodoPago: 'transferencia',
      tipo: TipoPagoSalario.ADELANTO,
      comprobante: salario.comprobante || '',
      comprobanteAdjunto: '',
      observaciones: '',
    });
    setShowPagoModal(true);
  };

  const handleCerrarPagoModal = () => {
    setShowPagoModal(false);
    setSalarioSeleccionado(null);
    setGuardandoPago(false);
    setPagoError(null);
  };

  const handleAbrirPagoManualModal = () => {
    setPagoError(null);
    setPagoManualForm({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      salarioBase: '',
      totalComisiones: '0',
      bonos: '0',
      deducciones: '0',
      fechaPago: getTodayLocalInputValue(),
      metodoPago: 'transferencia',
      monto: '',
      tipo: TipoPagoSalario.ADELANTO,
      comprobante: '',
      comprobanteAdjunto: '',
      observaciones: '',
    });
    setShowPagoManualModal(true);
  };

  const handleCerrarPagoManualModal = () => {
    setShowPagoManualModal(false);
    setGuardandoPago(false);
    setPagoError(null);
  };

  const handleAbrirEditarPagoModal = (salarioId: number, pago: SalarioPago) => {
    setPagoEditando({ salarioId, pagoId: pago.id });
    setPagoEditarForm({
      monto: Number(pago.monto || 0).toFixed(2),
      fechaPago: toDateInputValue(pago.fechaPago),
      metodoPago: pago.metodoPago || 'transferencia',
      tipo: pago.tipo || TipoPagoSalario.ADELANTO,
      comprobante: pago.comprobante || '',
      comprobanteAdjunto: pago.comprobanteAdjunto || '',
      observaciones: pago.observaciones || '',
    });
    setEditarPagoError(null);
    setShowEditarPagoModal(true);
  };

  const handleCerrarEditarPagoModal = () => {
    setShowEditarPagoModal(false);
    setPagoEditando(null);
    setGuardandoEditarPago(false);
    setEditarPagoError(null);
  };

  const handleEditarPago = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pagoEditando) return;
    if (!pagoEditarForm.fechaPago || !pagoEditarForm.metodoPago || Number(pagoEditarForm.monto) <= 0) {
      setEditarPagoError('Debes completar monto, fecha y método de pago');
      return;
    }
    try {
      setGuardandoEditarPago(true);
      setEditarPagoError(null);
      await salariosService.updatePago(pagoEditando.salarioId, pagoEditando.pagoId, {
        monto: Number(pagoEditarForm.monto),
        fechaPago: pagoEditarForm.fechaPago,
        metodoPago: pagoEditarForm.metodoPago,
        tipo: pagoEditarForm.tipo,
        comprobante: pagoEditarForm.comprobante.trim() || undefined,
        comprobanteAdjunto: pagoEditarForm.comprobanteAdjunto || undefined,
        observaciones: pagoEditarForm.observaciones.trim() || undefined,
      });
      await loadSalarios();
      handleCerrarEditarPagoModal();
    } catch (err: any) {
      console.error('Error al editar pago:', err);
      setEditarPagoError(err?.response?.data?.message || 'No se pudo editar el pago');
      setGuardandoEditarPago(false);
    }
  };

  const handleEliminarPago = async (salarioId: number, pagoId: number) => {
    if (!window.confirm('¿Eliminar este pago? Esta acción no se puede deshacer.')) return;
    try {
      await salariosService.deletePago(salarioId, pagoId);
      await loadSalarios();
    } catch (err: any) {
      console.error('Error al eliminar pago:', err);
      setError(err?.response?.data?.message || 'No se pudo eliminar el pago');
    }
  };

  const handleRegistrarPago = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!salarioSeleccionado) {
      return;
    }

    if (!pagoForm.fechaPago || !pagoForm.metodoPago || Number(pagoForm.monto) <= 0) {
      setPagoError('Debes completar monto, fecha y método de pago');
      return;
    }

    try {
      setGuardandoPago(true);
      setPagoError(null);

      await salariosService.registrarPago(salarioSeleccionado.id, {
        monto: Number(pagoForm.monto),
        fechaPago: pagoForm.fechaPago,
        metodoPago: pagoForm.metodoPago,
        tipo: pagoForm.tipo,
        comprobante: pagoForm.comprobante.trim() || undefined,
        comprobanteAdjunto: pagoForm.comprobanteAdjunto || undefined,
        observaciones: pagoForm.observaciones.trim() || undefined,
      });

      await loadSalarios();
      handleCerrarPagoModal();
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setPagoError(err?.response?.data?.message || 'No se pudo registrar el pago');
      setGuardandoPago(false);
    }
  };

  const handleRegistrarPagoManual = async (event: React.FormEvent) => {
    event.preventDefault();

    if (Number(pagoManualForm.monto) <= 0) {
      setPagoError('Debes ingresar un monto de pago mayor a 0');
      return;
    }

    try {
      setGuardandoPago(true);
      setPagoError(null);

      let salarioPeriodo: ChoferSalario | null = null;

      try {
        salarioPeriodo = await salariosService.getSalarioChoferPeriodo(
          choferId,
          Number(pagoManualForm.anio),
          Number(pagoManualForm.mes),
        );
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) {
          throw err;
        }
      }

      if (!salarioPeriodo) {
        if (!pagoManualForm.salarioBase || Number(pagoManualForm.salarioBase) <= 0) {
          setPagoError('Si el salario del período no existe, debes ingresar Salario Base');
          setGuardandoPago(false);
          return;
        }

        salarioPeriodo = await salariosService.create({
          choferId,
          mes: Number(pagoManualForm.mes),
          anio: Number(pagoManualForm.anio),
          salarioBase: Number(pagoManualForm.salarioBase),
          totalComisiones: Number(pagoManualForm.totalComisiones || 0),
          bonos: Number(pagoManualForm.bonos || 0),
          deducciones: Number(pagoManualForm.deducciones || 0),
          estado: EstadoSalario.PENDIENTE,
          observaciones: pagoManualForm.observaciones.trim() || undefined,
        });
      }

      await salariosService.registrarPago(salarioPeriodo.id, {
        monto: Number(pagoManualForm.monto),
        fechaPago: pagoManualForm.fechaPago,
        metodoPago: pagoManualForm.metodoPago,
        tipo: pagoManualForm.tipo,
        comprobante: pagoManualForm.comprobante.trim() || undefined,
        comprobanteAdjunto: pagoManualForm.comprobanteAdjunto || undefined,
        observaciones: pagoManualForm.observaciones.trim() || undefined,
      });

      await loadSalarios();
      handleCerrarPagoManualModal();
    } catch (err: any) {
      console.error('Error al registrar pago manual:', err);
      setPagoError(err?.response?.data?.message || 'No se pudo registrar el pago manual');
      setGuardandoPago(false);
    }
  };

  if (loading) {
    return <div className="salarios-tab-loading">Cargando salarios...</div>;
  }

  if (error) {
    return <div className="salarios-tab-error">{error}</div>;
  }

  return (
    <section className="salarios-tab-section">
      <div className="salarios-summary-grid">
        <article className="salarios-summary-card">
          <span>Total Liquidado</span>
          <strong>{formatCurrency(resumen.totalNeto)}</strong>
        </article>
        <article className="salarios-summary-card paid">
          <span>Total Pagado</span>
          <strong>{formatCurrency(resumen.totalPagado)}</strong>
        </article>
        <article className="salarios-summary-card pending">
          <span>Saldo Pendiente</span>
          <strong>{formatCurrency(resumen.saldoPendiente)}</strong>
        </article>
        <article className="salarios-summary-card movements">
          <span>Movimientos</span>
          <strong>{resumen.movimientos}</strong>
        </article>
      </div>

      <div className="salarios-tab-block">
        <div className="salarios-tab-block-header">
          <h3>Registro de Pagos Pendientes</h3>
          <div className="salarios-tab-block-header-actions">
            <button
              type="button"
              className="salarios-tab-action"
              onClick={handleAbrirPagoManualModal}
            >
              Cargar salario o pago manual
            </button>
            {salarios.length > 0 && (
              <button
                type="button"
                className="salarios-tab-action primary"
                onClick={() => handleAbrirPagoModal(salariosPendientes[0] || salarios[0])}
              >
                Agregar pago
              </button>
            )}
            <span className="salarios-tab-badge warning">Pendientes: {salariosPendientes.length}</span>
          </div>
        </div>

        {salariosPendientes.length === 0 ? (
          <div className="salarios-tab-empty">
            <p>No hay salarios pendientes de pago para este chofer.</p>
            {salarios.length === 0 && (
              <button
                type="button"
                className="salarios-tab-action primary"
                onClick={handleAbrirPagoManualModal}
              >
                Registrar primer salario o pago
              </button>
            )}
          </div>
        ) : (
          <div className="salarios-tab-list">
            {salariosPendientes.map((salario) => (
              <article key={salario.id} className="salarios-tab-item">
                <div>
                  <h4>{formatPeriodo(salario.mes, salario.anio)}</h4>
                  <p>
                    Saldo pendiente: <strong>{formatCurrency(getSaldoPendiente(salario))}</strong>
                  </p>
                </div>
                <div className="salarios-tab-actions">
                  <button
                    type="button"
                    className="salarios-tab-action primary"
                    onClick={() => handleAbrirPagoModal(salario)}
                  >
                    Agregar pago
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="salarios-tab-block">
        <div className="salarios-tab-block-header">
          <h3>Historial de Pagos</h3>
          <span className="salarios-tab-badge success">Movimientos: {pagosHistoricos.length}</span>
        </div>

        {pagosHistoricos.length === 0 ? (
          <div className="salarios-tab-empty">Todavia no hay pagos registrados para este chofer.</div>
        ) : (
          <div className="salarios-tab-list">
            {pagosHistoricos.map(({ salario, pago }) => (
              <article key={`${salario.id}-${pago.id}`} className="salarios-tab-item stacked">
                <div>
                  <h4>{formatPeriodo(salario.mes, salario.anio)}</h4>
                  <p>
                    Fecha: {formatDateForDisplay(pago.fechaPago)} | Metodo: {pago.metodoPago}
                  </p>
                  {pago.comprobante && <p>Referencia: {pago.comprobante}</p>}
                </div>
                <div className="salarios-tab-item-right">
                  <strong className="salarios-tab-amount">{formatCurrency(pago.monto)}</strong>
                  <div className="salarios-tab-actions">
                    {pago.comprobanteAdjunto && (
                      <>
                        <button
                          type="button"
                          className="salarios-tab-link"
                          onClick={() => handleOpenAttachmentPreview(pago.comprobanteAdjunto)}
                        >
                          Ver adjunto
                        </button>
                        <a
                          className="salarios-tab-link"
                          href={pago.comprobanteAdjunto}
                          download={`comprobante-pago-${pago.id}${getAttachmentExtension(pago.comprobanteAdjunto)}`}
                        >
                          Descargar
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      className="salarios-tab-action"
                      onClick={() => handleAbrirEditarPagoModal(salario.id, pago)}
                      title="Editar pago"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="salarios-tab-action danger"
                      onClick={() => handleEliminarPago(salario.id, pago.id)}
                      title="Eliminar pago"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="salarios-tab-block">
        <h3>Liquidaciones por Periodo</h3>
        {salarios.length === 0 ? (
          <div className="salarios-tab-empty">No hay liquidaciones de salario registradas.</div>
        ) : (
          <div className="salarios-tab-table-wrap">
            <table className="salarios-tab-table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Salario Neto</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salarios.map((salario) => (
                  <tr key={salario.id}>
                    <td>{formatPeriodo(salario.mes, salario.anio)}</td>
                    <td>{formatCurrency(salario.salarioNeto)}</td>
                    <td>{formatCurrency(getTotalPagado(salario))}</td>
                    <td>{formatCurrency(getSaldoPendiente(salario))}</td>
                    <td>
                      <span
                        className="salarios-tab-status"
                        style={{ backgroundColor: getEstadoSalarioColor(salario.estado) }}
                      >
                        {getEstadoSalarioLabel(salario.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="salarios-tab-actions compact">
                        {salario.estado !== EstadoSalario.CANCELADO && (
                          <button
                            type="button"
                            className="salarios-tab-link primary"
                            onClick={() => handleAbrirPagoModal(salario)}
                          >
                            Agregar pago
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditarPagoModal && pagoEditando && (
        <div className="salarios-tab-modal-overlay" onClick={handleCerrarEditarPagoModal}>
          <div className="salarios-tab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="salarios-tab-modal-header">
              <h3>Editar pago</h3>
              <button type="button" className="salarios-tab-modal-close" onClick={handleCerrarEditarPagoModal}>
                ✕
              </button>
            </div>

            {editarPagoError && <div className="salarios-tab-modal-error">{editarPagoError}</div>}

            <form onSubmit={handleEditarPago} className="salarios-tab-modal-form">
              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="editar-pago-monto">Monto</label>
                  <input
                    id="editar-pago-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoEditarForm.monto}
                    onChange={(event) => setPagoEditarForm((prev) => ({ ...prev, monto: event.target.value }))}
                    required
                    disabled={guardandoEditarPago}
                  />
                </div>
                <div className="salarios-tab-modal-group">
                  <label htmlFor="editar-pago-fecha">Fecha de pago</label>
                  <input
                    id="editar-pago-fecha"
                    type="date"
                    value={pagoEditarForm.fechaPago}
                    onChange={(event) => setPagoEditarForm((prev) => ({ ...prev, fechaPago: event.target.value }))}
                    required
                    disabled={guardandoEditarPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="editar-pago-metodo">Método de pago</label>
                  <select
                    id="editar-pago-metodo"
                    value={pagoEditarForm.metodoPago}
                    onChange={(event) => setPagoEditarForm((prev) => ({ ...prev, metodoPago: event.target.value }))}
                    required
                    disabled={guardandoEditarPago}
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="salarios-tab-modal-group">
                  <label htmlFor="editar-pago-tipo">Tipo de pago</label>
                  <select
                    id="editar-pago-tipo"
                    value={pagoEditarForm.tipo}
                    onChange={(event) =>
                      setPagoEditarForm((prev) => ({ ...prev, tipo: event.target.value as TipoPagoSalario }))
                    }
                    required
                    disabled={guardandoEditarPago}
                  >
                    <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                    <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                  </select>
                </div>
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="editar-pago-comprobante">Referencia del comprobante</label>
                <input
                  id="editar-pago-comprobante"
                  type="text"
                  placeholder="Nro transferencia, referencia, etc."
                  value={pagoEditarForm.comprobante}
                  onChange={(event) => setPagoEditarForm((prev) => ({ ...prev, comprobante: event.target.value }))}
                  disabled={guardandoEditarPago}
                />
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="editar-pago-comprobante-adjunto">Adjuntar comprobante</label>
                <div
                  className={`salarios-tab-dropzone ${isPagoEditarDropActive ? 'active' : ''}`}
                  onDragOver={(event) => handleComprobanteDragOver(event, setIsPagoEditarDropActive)}
                  onDragLeave={(event) => handleComprobanteDragLeave(event, setIsPagoEditarDropActive)}
                  onDrop={(event) =>
                    handleComprobanteDrop(event, setPagoEditarForm, setEditarPagoError, setIsPagoEditarDropActive)
                  }
                >
                  <input
                    id="editar-pago-comprobante-adjunto"
                    className="salarios-tab-file-input"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml"
                    onChange={(event) =>
                      handleComprobanteFileChange(event.target.files, setPagoEditarForm, setEditarPagoError)
                    }
                    disabled={guardandoEditarPago}
                  />
                  <p>Arrastra y suelta aquí tu comprobante o selecciónalo manualmente.</p>
                </div>
                <span className="salarios-tab-file-help">PDF o imagen hasta {MAX_COMPROBANTE_SIZE_MB}MB</span>
              </div>

              {isEmbeddedAttachment(pagoEditarForm.comprobanteAdjunto) && (
                <div className="salarios-tab-attachment-preview">
                  <span>{getAttachmentKindLabel(pagoEditarForm.comprobanteAdjunto)} listo para guardar.</span>
                  <div className="salarios-tab-actions">
                    <button
                      type="button"
                      className="salarios-tab-link"
                      onClick={() => handleOpenAttachmentPreview(pagoEditarForm.comprobanteAdjunto)}
                    >
                      Ver adjunto
                    </button>
                    <button
                      type="button"
                      className="salarios-tab-action danger"
                      onClick={() => setPagoEditarForm((prev) => ({ ...prev, comprobanteAdjunto: '' }))}
                    >
                      Quitar adjunto
                    </button>
                  </div>
                </div>
              )}

              <div className="salarios-tab-modal-group">
                <label htmlFor="editar-pago-observaciones">Observaciones</label>
                <textarea
                  id="editar-pago-observaciones"
                  rows={3}
                  placeholder="Comentario interno del pago"
                  value={pagoEditarForm.observaciones}
                  onChange={(event) => setPagoEditarForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                  disabled={guardandoEditarPago}
                />
              </div>

              <div className="salarios-tab-modal-actions">
                <button
                  type="button"
                  className="salarios-tab-modal-button secondary"
                  onClick={handleCerrarEditarPagoModal}
                  disabled={guardandoEditarPago}
                >
                  Cancelar
                </button>
                <button type="submit" className="salarios-tab-modal-button primary" disabled={guardandoEditarPago}>
                  {guardandoEditarPago ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPagoModal && salarioSeleccionado && (
        <div className="salarios-tab-modal-overlay" onClick={handleCerrarPagoModal}>
          <div className="salarios-tab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="salarios-tab-modal-header">
              <h3>Registrar pago</h3>
              <button type="button" className="salarios-tab-modal-close" onClick={handleCerrarPagoModal}>
                ✕
              </button>
            </div>

            <p className="salarios-tab-modal-periodo">
              {formatPeriodo(salarioSeleccionado.mes, salarioSeleccionado.anio)} - {formatCurrency(salarioSeleccionado.salarioNeto)}
            </p>

            <p className="salarios-tab-modal-resumen">
              Pagado acumulado: {formatCurrency(getTotalPagado(salarioSeleccionado))} | Saldo: {formatCurrency(getSaldoPendiente(salarioSeleccionado))}
            </p>

            {pagoError && <div className="salarios-tab-modal-error">{pagoError}</div>}

            <form onSubmit={handleRegistrarPago} className="salarios-tab-modal-form">
              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-monto">Monto a pagar</label>
                  <input
                    id="salarios-tab-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoForm.monto}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, monto: event.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-fecha">Fecha de pago</label>
                  <input
                    id="salarios-tab-fecha"
                    type="date"
                    value={pagoForm.fechaPago}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, fechaPago: event.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-metodo">Método de pago</label>
                  <select
                    id="salarios-tab-metodo"
                    value={pagoForm.metodoPago}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, metodoPago: event.target.value }))}
                    required
                    disabled={guardandoPago}
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-tipo">Tipo de pago</label>
                  <select
                    id="salarios-tab-tipo"
                    value={pagoForm.tipo}
                    onChange={(event) =>
                      setPagoForm((prev) => ({ ...prev, tipo: event.target.value as TipoPagoSalario }))
                    }
                    required
                    disabled={guardandoPago}
                  >
                    <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                    <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                  </select>
                </div>
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-comprobante">Referencia del comprobante</label>
                <input
                  id="salarios-tab-comprobante"
                  type="text"
                  placeholder="Nro transferencia, referencia, etc."
                  value={pagoForm.comprobante}
                  onChange={(event) => setPagoForm((prev) => ({ ...prev, comprobante: event.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-comprobante-adjunto">Adjuntar comprobante</label>
                <div
                  className={`salarios-tab-dropzone ${isPagoDropActive ? 'active' : ''}`}
                  onDragOver={(event) => handleComprobanteDragOver(event, setIsPagoDropActive)}
                  onDragLeave={(event) => handleComprobanteDragLeave(event, setIsPagoDropActive)}
                  onDrop={(event) => handleComprobanteDrop(event, setPagoForm, setPagoError, setIsPagoDropActive)}
                >
                  <input
                    id="salarios-tab-comprobante-adjunto"
                    className="salarios-tab-file-input"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml"
                    onChange={(event) => handleComprobanteFileChange(event.target.files, setPagoForm, setPagoError)}
                    disabled={guardandoPago}
                  />
                  <p>Arrastra y suelta aquí tu comprobante o selecciónalo manualmente.</p>
                </div>
                <span className="salarios-tab-file-help">PDF o imagen hasta {MAX_COMPROBANTE_SIZE_MB}MB</span>
              </div>

              {isEmbeddedAttachment(pagoForm.comprobanteAdjunto) && (
                <div className="salarios-tab-attachment-preview">
                  <span>{getAttachmentKindLabel(pagoForm.comprobanteAdjunto)} listo para guardar.</span>
                  <div className="salarios-tab-actions">
                    <button
                      type="button"
                      className="salarios-tab-link"
                      onClick={() => handleOpenAttachmentPreview(pagoForm.comprobanteAdjunto)}
                    >
                      Ver adjunto
                    </button>
                    <button
                      type="button"
                      className="salarios-tab-action danger"
                      onClick={() => setPagoForm((prev) => ({ ...prev, comprobanteAdjunto: '' }))}
                    >
                      Quitar adjunto
                    </button>
                  </div>
                </div>
              )}

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-observaciones">Observaciones</label>
                <textarea
                  id="salarios-tab-observaciones"
                  rows={3}
                  placeholder="Comentario interno del pago"
                  value={pagoForm.observaciones}
                  onChange={(event) => setPagoForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-actions">
                <button type="button" className="salarios-tab-modal-button secondary" onClick={handleCerrarPagoModal}>
                  Cancelar
                </button>
                <button type="submit" className="salarios-tab-modal-button primary" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Guardar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPagoManualModal && (
        <div className="salarios-tab-modal-overlay" onClick={handleCerrarPagoManualModal}>
          <div className="salarios-tab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="salarios-tab-modal-header">
              <h3>Cargar salario o pago manual</h3>
              <button type="button" className="salarios-tab-modal-close" onClick={handleCerrarPagoManualModal}>
                ✕
              </button>
            </div>

            <p className="salarios-tab-modal-periodo">
              Usa este formulario si todavía no existe la liquidación del período o si quieres cargar un pago manual.
            </p>

            {pagoError && <div className="salarios-tab-modal-error">{pagoError}</div>}

            <form onSubmit={handleRegistrarPagoManual} className="salarios-tab-modal-form">
              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-mes">Mes</label>
                  <select
                    id="salarios-tab-manual-mes"
                    value={pagoManualForm.mes}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, mes: Number(event.target.value) }))
                    }
                    disabled={guardandoPago}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {formatPeriodo(mes, pagoManualForm.anio).replace(` ${pagoManualForm.anio}`, '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-anio">Año</label>
                  <input
                    id="salarios-tab-manual-anio"
                    type="number"
                    min={2020}
                    max={2100}
                    value={pagoManualForm.anio}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, anio: Number(event.target.value) }))
                    }
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-salario-base">Salario Base</label>
                  <input
                    id="salarios-tab-manual-salario-base"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Obligatorio si el período no existe"
                    value={pagoManualForm.salarioBase}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, salarioBase: event.target.value }))
                    }
                    disabled={guardandoPago}
                  />
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-monto">Monto a pagar</label>
                  <input
                    id="salarios-tab-manual-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoManualForm.monto}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, monto: event.target.value }))
                    }
                    required
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-comisiones">Comisiones</label>
                  <input
                    id="salarios-tab-manual-comisiones"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pagoManualForm.totalComisiones}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, totalComisiones: event.target.value }))
                    }
                    disabled={guardandoPago}
                  />
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-bonos">Bonos</label>
                  <input
                    id="salarios-tab-manual-bonos"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pagoManualForm.bonos}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, bonos: event.target.value }))
                    }
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-deducciones">Deducciones</label>
                  <input
                    id="salarios-tab-manual-deducciones"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pagoManualForm.deducciones}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, deducciones: event.target.value }))
                    }
                    disabled={guardandoPago}
                  />
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-fecha">Fecha de pago</label>
                  <input
                    id="salarios-tab-manual-fecha"
                    type="date"
                    value={pagoManualForm.fechaPago}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, fechaPago: event.target.value }))
                    }
                    required
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-metodo">Método de pago</label>
                  <select
                    id="salarios-tab-manual-metodo"
                    value={pagoManualForm.metodoPago}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, metodoPago: event.target.value }))
                    }
                    required
                    disabled={guardandoPago}
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-manual-tipo">Tipo de pago</label>
                  <select
                    id="salarios-tab-manual-tipo"
                    value={pagoManualForm.tipo}
                    onChange={(event) =>
                      setPagoManualForm((prev) => ({ ...prev, tipo: event.target.value as TipoPagoSalario }))
                    }
                    required
                    disabled={guardandoPago}
                  >
                    <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                    <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                  </select>
                </div>
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-manual-comprobante">Comprobante</label>
                <input
                  id="salarios-tab-manual-comprobante"
                  type="text"
                  placeholder="Nro transferencia, referencia, etc."
                  value={pagoManualForm.comprobante}
                  onChange={(event) =>
                    setPagoManualForm((prev) => ({ ...prev, comprobante: event.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-manual-comprobante-adjunto">Adjuntar comprobante</label>
                <div
                  className={`salarios-tab-dropzone ${isPagoManualDropActive ? 'active' : ''}`}
                  onDragOver={(event) => handleComprobanteDragOver(event, setIsPagoManualDropActive)}
                  onDragLeave={(event) => handleComprobanteDragLeave(event, setIsPagoManualDropActive)}
                  onDrop={(event) =>
                    handleComprobanteDrop(event, setPagoManualForm, setPagoError, setIsPagoManualDropActive)
                  }
                >
                  <input
                    id="salarios-tab-manual-comprobante-adjunto"
                    className="salarios-tab-file-input"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml"
                    onChange={(event) =>
                      handleComprobanteFileChange(event.target.files, setPagoManualForm, setPagoError)
                    }
                    disabled={guardandoPago}
                  />
                  <p>Arrastra y suelta aquí tu comprobante o selecciónalo manualmente.</p>
                </div>
                <span className="salarios-tab-file-help">PDF o imagen hasta {MAX_COMPROBANTE_SIZE_MB}MB</span>
              </div>

              {isEmbeddedAttachment(pagoManualForm.comprobanteAdjunto) && (
                <div className="salarios-tab-attachment-preview">
                  <span>{getAttachmentKindLabel(pagoManualForm.comprobanteAdjunto)} listo para guardar.</span>
                  <div className="salarios-tab-actions">
                    <button
                      type="button"
                      className="salarios-tab-link"
                      onClick={() => handleOpenAttachmentPreview(pagoManualForm.comprobanteAdjunto)}
                    >
                      Ver adjunto
                    </button>
                    <button
                      type="button"
                      className="salarios-tab-action danger"
                      onClick={() => setPagoManualForm((prev) => ({ ...prev, comprobanteAdjunto: '' }))}
                    >
                      Quitar adjunto
                    </button>
                  </div>
                </div>
              )}

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-manual-observaciones">Observaciones</label>
                <textarea
                  id="salarios-tab-manual-observaciones"
                  rows={3}
                  placeholder="Comentario interno del pago o de la liquidación"
                  value={pagoManualForm.observaciones}
                  onChange={(event) =>
                    setPagoManualForm((prev) => ({ ...prev, observaciones: event.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-actions">
                <button
                  type="button"
                  className="salarios-tab-modal-button secondary"
                  onClick={handleCerrarPagoManualModal}
                  disabled={guardandoPago}
                >
                  Cancelar
                </button>
                <button type="submit" className="salarios-tab-modal-button primary" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Guardar salario/pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewAttachment && (
        <div className="salarios-tab-modal-overlay" onClick={handleCloseAttachmentPreview}>
          <div className="salarios-tab-modal salarios-tab-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="salarios-tab-modal-header">
              <h3>Vista previa de comprobante</h3>
              <button type="button" className="salarios-tab-modal-close" onClick={handleCloseAttachmentPreview}>
                ✕
              </button>
            </div>

            {isImageAttachment(previewAttachment) ? (
              <img
                className="salarios-tab-preview-image"
                src={previewAttachment}
                alt="Comprobante adjunto"
              />
            ) : isPdfAttachment(previewAttachment) ? (
              <iframe
                className="salarios-tab-preview-pdf"
                src={previewAttachment}
                title="Vista previa PDF"
              />
            ) : (
              <div className="salarios-tab-preview-fallback">
                <p>No se pudo renderizar una vista previa para este tipo de adjunto.</p>
                <a className="salarios-tab-link" href={previewAttachment} download="comprobante-adjunto">
                  Descargar adjunto
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default SalariosTab;
