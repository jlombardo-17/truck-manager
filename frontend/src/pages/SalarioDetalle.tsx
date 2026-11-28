import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import salariosService from '../services/salariosService';
import choferesService from '../services/choferesService';
import {
  ChoferSalario,
  EstadoSalario,
  ViajeConComision,
  formatPeriodo,
  formatCurrency,
  getEstadoSalarioLabel,
  getEstadoSalarioColor,
} from '../types/salario';
import { Chofer } from '../types/chofer';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AppNavbar from '../components/AppNavbar';
import BackButton from '../components/BackButton';
import '../styles/SalarioDetalle.css';
import { formatDateForDisplay } from '../utils/dateUtils';

const SalarioDetalle: React.FC = () => {
  const { choferId, salarioId } = useParams<{ choferId: string; salarioId: string }>();
  const choferIdNum = parseInt(choferId || '0');
  const salarioIdNum = parseInt(salarioId || '0');

  const [chofer, setChofer] = useState<Chofer | null>(null);
  const [salario, setSalario] = useState<ChoferSalario | null>(null);
  const [viajes, setViajes] = useState<ViajeConComision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [costoEmpresaInput, setCostoEmpresaInput] = useState('');
  const [guardandoCosto, setGuardandoCosto] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [usarSueldoBaseActual, setUsarSueldoBaseActual] = useState(true);
  const [recalculoMensaje, setRecalculoMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [salarioIdNum]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar chofer
      const choferData = await choferesService.getById(choferIdNum);
      setChofer(choferData);

      // Cargar salarios del chofer y encontrar el específico
      const salariosData = await salariosService.getByChofer(choferIdNum);
      const salarioActual = salariosData.find((s) => s.id === salarioIdNum);
      
      if (!salarioActual) {
        throw new Error('Salario no encontrado');
      }
      
      setSalario(salarioActual);
      setCostoEmpresaInput(salarioActual?.costoEmpresa != null ? String(Number(salarioActual.costoEmpresa)) : '');

      // Cargar viajes con comisiones
      const viajesData = await salariosService.getViajesConComisiones(
        choferIdNum,
        salarioActual.anio,
        salarioActual.mes,
      );
      
      setViajes(viajesData.viajes);
    } catch (err: any) {
      console.error('Error al cargar detalle de salario:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = () => {
    if (!salario || !chofer) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Configuración de colores
    const primaryColor = [25, 118, 210] as [number, number, number];
    const grayColor = [108, 117, 125] as [number, number, number];

    // Título del documento
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text('LIQUIDACIÓN DE SUELDO', pageWidth / 2, 20, { align: 'center' });

    // Información del período
    doc.setFontSize(12);
    doc.setTextColor(...grayColor);
    doc.text(
      `Período: ${formatPeriodo(salario.mes, salario.anio)}`,
      pageWidth / 2,
      30,
      { align: 'center' },
    );

    // Información del chofer
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let yPos = 45;

    doc.text(`Nombre: ${chofer.nombre} ${chofer.apellido}`, 20, yPos);
    yPos += 7;
    doc.text(`RUT: ${chofer.numeroDocumento}`, 20, yPos);
    
    if (chofer.telefono) {
      yPos += 7;
      doc.text(`Teléfono: ${chofer.telefono}`, 20, yPos);
    }

    // Resumen de haberes y descuentos
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('RESUMEN', 20, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const detalles = [
      ['Salario Base', formatCurrency(salario.salarioBase)],
      ['Comisiones por Viajes', formatCurrency(salario.totalComisiones)],
      ['Viáticos', formatCurrency(salario.totalViaticos ?? 0)],
      ['Bonos', formatCurrency(salario.bonos)],
      ['Deducciones', `- ${formatCurrency(salario.deducciones)}`],
      ['', ''],
      ['SALARIO NETO', formatCurrency(salario.salarioNeto)],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Concepto', 'Monto']],
      body: detalles,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        fontSize: 11,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        1: { halign: 'right' },
      },
      didParseCell: (data: any) => {
        if (data.row.index === 5) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 12;
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Desglose de viajes
    if (viajes.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text('DETALLE DE VIAJES', 20, yPos);

      yPos += 5;

      const viajesData = viajes.map((viaje) => [
        viaje.numeroViaje,
        formatDateForDisplay(viaje.fechaInicio, 'es-CL'),
        `${viaje.origen} → ${viaje.destino}`,
        formatCurrency(viaje.valorViaje),
        formatCurrency(viaje.totalComision),
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['N° Viaje', 'Fecha', 'Ruta', 'Valor Viaje', 'Comisión']],
        body: viajesData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Información del estado
    yPos += 5;
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text(`Estado: ${getEstadoSalarioLabel(salario.estado)}`, 20, yPos);
    
    if (salario.fechaPago) {
      yPos += 6;
      doc.text(
        `Fecha de Pago: ${formatDateForDisplay(salario.fechaPago, 'es-CL')}`,
        20,
        yPos,
      );
    }

    if (salario.metodoPago) {
      yPos += 6;
      doc.text(`Método de Pago: ${salario.metodoPago}`, 20, yPos);
    }

    if (salario.observaciones) {
      yPos += 6;
      doc.text(`Observaciones: ${salario.observaciones}`, 20, yPos);
    }

    // Firma
    yPos = doc.internal.pageSize.height - 40;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.line(20, yPos, 90, yPos);
    doc.text('Firma del Empleador', 20, yPos + 5);

    doc.line(120, yPos, 190, yPos);
    doc.text('Firma del Trabajador', 120, yPos + 5);

    // Guardar PDF
    const nombreArchivo = `Liquidacion_${chofer.apellido}_${formatPeriodo(salario.mes, salario.anio).replace(' ', '_')}.pdf`;
    doc.save(nombreArchivo);
  };

  const guardarCostoEmpresa = async () => {
    if (!salario) return;
    const valor = costoEmpresaInput.trim() === '' ? null : Number(costoEmpresaInput);
    if (valor !== null && !(valor >= 0)) {
      setError('El costo empresa debe ser un número mayor o igual a 0');
      return;
    }
    try {
      setGuardandoCosto(true);
      const actualizado = await salariosService.update(salario.id, { costoEmpresa: valor });
      setSalario((prev) => (prev ? { ...prev, costoEmpresa: actualizado.costoEmpresa ?? valor } : prev));
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo guardar el costo empresa');
    } finally {
      setGuardandoCosto(false);
    }
  };

  const sueldoBaseActual = Number(chofer?.sueldoBase || 0);
  const baseDistinta = !!salario && sueldoBaseActual > 0 && Math.abs(Number(salario.salarioBase) - sueldoBaseActual) > 0.005;

  const recalcularDesdeJornadas = async () => {
    if (!salario) return;
    const actualizarSueldoBase = baseDistinta && usarSueldoBaseActual;
    const aviso =
      salario.estado === EstadoSalario.PAGADO
        ? 'Este salario ya está pagado. Se recalcularán comisiones y viáticos desde las jornadas' +
          (actualizarSueldoBase ? ` y el sueldo base pasará a ${formatCurrency(sueldoBaseActual)}` : '') +
          '. Los pagos registrados no se modifican. ¿Continuar?'
        : null;
    if (aviso && !window.confirm(aviso)) return;
    try {
      setRecalculando(true);
      setRecalculoMensaje(null);
      const anterior = Number(salario.salarioNeto);
      const actualizado = await salariosService.recalcular(salario.id, { actualizarSueldoBase });
      setSalario(actualizado);
      const nuevo = Number(actualizado.salarioNeto);
      setRecalculoMensaje({
        tipo: 'ok',
        texto:
          Math.abs(nuevo - anterior) < 0.005
            ? 'Recalculado: el total no cambió.'
            : `Recalculado: total a pagar ${formatCurrency(anterior)} → ${formatCurrency(nuevo)}.`,
      });
    } catch (err: any) {
      setRecalculoMensaje({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo recalcular el salario' });
    } finally {
      setRecalculando(false);
    }
  };

  const costoEmpresaGuardado =salario?.costoEmpresa != null ? String(Number(salario.costoEmpresa)) : '';
  const totalPagado = (salario?.pagos || []).reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando detalle del salario...</p>
      </div>
    );
  }

  if (error || !salario) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Salario no encontrado'}</p>
        <BackButton
          label="← Volver a Salarios"
          to={`/choferes/${choferIdNum}/salarios`}
          variant="ghost"
        />
      </div>
    );
  }

  return (
    <div className="salario-detalle-container">
      <AppNavbar />

      {/* Header */}
      <div className="page-header">
        <BackButton
          label="← Volver a Salarios"
          to={`/choferes/${choferIdNum}/salarios`}
          variant="ghost"
        />
        <div>
          <h1>
            Detalle de Salario - {formatPeriodo(salario.mes, salario.anio)}
          </h1>
          <p className="subtitle">
            {chofer?.nombre} {chofer?.apellido} | RUT: {chofer?.numeroDocumento}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="resumen-card">
        <div className="resumen-header">
          <h2>Resumen de Liquidación</h2>
          <button className="btn-pdf" onClick={generarPDF}>
            📄 Generar PDF
          </button>
        </div>

        <div className="resumen-grid">
          <div className="resumen-item">
            <span className="label">Salario Base</span>
            <span className="value">{formatCurrency(salario.salarioBase)}</span>
          </div>
          <div className="resumen-item comisiones">
            <span className="label">Comisiones</span>
            <span className="value">+ {formatCurrency(salario.totalComisiones)}</span>
          </div>
          <div className="resumen-item viaticos">
            <span className="label">Viáticos</span>
            <span className="value">+ {formatCurrency(salario.totalViaticos ?? 0)}</span>
          </div>
          <div className="resumen-item bonos">
            <span className="label">Bonos</span>
            <span className="value">+ {formatCurrency(salario.bonos)}</span>
          </div>
          <div className="resumen-item deducciones">
            <span className="label">Deducciones</span>
            <span className="value">- {formatCurrency(salario.deducciones)}</span>
          </div>
          <div className="resumen-item total">
            <span className="label">TOTAL A PAGAR AL CHOFER</span>
            <span className="value">{formatCurrency(salario.salarioNeto)}</span>
          </div>
          <div className="resumen-item">
            <span className="label">Pagado al chofer</span>
            <span className="value">{formatCurrency(totalPagado)}</span>
          </div>
          <div className="resumen-item">
            <span className="label">Saldo pendiente</span>
            <span className="value">{formatCurrency(Math.max(0, Number(salario.salarioNeto) - totalPagado))}</span>
          </div>
        </div>

        <div className="costo-empresa-box">
          <label htmlFor="costoEmpresa">
            <strong>Costo empresa del mes</strong>
            <small>Sueldo + aportes patronales. Informativo: no suma al total a pagar ni a los pagos.</small>
          </label>
          <div className="costo-empresa-box__input">
            <input
              id="costoEmpresa"
              type="number"
              min="0"
              step="0.01"
              value={costoEmpresaInput}
              placeholder={chofer?.costoEmpresa ? `Referencia del chofer: ${chofer.costoEmpresa}` : 'Ej: 70000'}
              onChange={(e) => setCostoEmpresaInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-pdf"
              onClick={guardarCostoEmpresa}
              disabled={guardandoCosto || costoEmpresaGuardado === costoEmpresaInput}
            >
              {guardandoCosto ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {salario.estado !== EstadoSalario.CANCELADO && (
          <div className="recalcular-box">
            <div className="recalcular-box__texto">
              <strong>Recalcular desde jornadas</strong>
              <small>
                Vuelve a sumar las comisiones por viajes y los viáticos cargados en Jornadas para este mes.
                Bonos, deducciones y pagos no se tocan.
              </small>
              {baseDistinta && (
                <label className="recalcular-box__check">
                  <input
                    type="checkbox"
                    checked={usarSueldoBaseActual}
                    onChange={(e) => setUsarSueldoBaseActual(e.target.checked)}
                  />
                  Usar el sueldo base actual del chofer ({formatCurrency(sueldoBaseActual)} en lugar de{' '}
                  {formatCurrency(salario.salarioBase)})
                </label>
              )}
              {recalculoMensaje && (
                <small className={`recalcular-box__msg recalcular-box__msg--${recalculoMensaje.tipo}`}>
                  {recalculoMensaje.texto}
                </small>
              )}
            </div>
            <button type="button" className="btn-pdf" onClick={recalcularDesdeJornadas} disabled={recalculando}>
              {recalculando ? 'Recalculando…' : '↻ Recalcular'}
            </button>
          </div>
        )}

        <div className="estado-info">
          <span
            className="estado-badge"
            style={{
              backgroundColor: getEstadoSalarioColor(salario.estado),
            }}
          >
            {getEstadoSalarioLabel(salario.estado)}
          </span>
          {salario.fechaPago && (
            <span className="fecha-pago">
              Pagado el: {formatDateForDisplay(salario.fechaPago, 'es-CL')}
            </span>
          )}
          {salario.metodoPago && (
            <span className="metodo-pago">Método: {salario.metodoPago}</span>
          )}
        </div>

        {salario.observaciones && (
          <div className="observaciones">
            <strong>Observaciones:</strong> {salario.observaciones}
          </div>
        )}
      </div>

      {/* Detalle de Viajes */}
      <div className="viajes-section">
        <h2>Viajes del Período ({viajes.length})</h2>

        {viajes.length === 0 ? (
          <div className="empty-state">
            <p>No hay viajes registrados para este período</p>
          </div>
        ) : (
          <div className="viajes-grid">
            {viajes.map((viaje) => (
              <div key={viaje.id} className="viaje-card">
                <div className="viaje-header">
                  <span className="viaje-numero">{viaje.numeroViaje}</span>
                  <span className="viaje-fecha">
                    {formatDateForDisplay(viaje.fechaInicio, 'es-CL')}
                  </span>
                </div>
                <div className="viaje-ruta">
                  <strong>{viaje.origen}</strong> → <strong>{viaje.destino}</strong>
                </div>
                <div className="viaje-valores">
                  <div className="valor-item">
                    <span>Valor Viaje:</span>
                    <strong>{formatCurrency(viaje.valorViaje)}</strong>
                  </div>
                  <div className="valor-item comision">
                    <span>Tu Comisión:</span>
                    <strong>{formatCurrency(viaje.totalComision)}</strong>
                  </div>
                </div>
                {viaje.comisiones && viaje.comisiones.length > 0 && (
                  <div className="comisiones-detalle">
                    {viaje.comisiones.map((com, idx) => (
                      <div key={idx} className="comision-item">
                        <span>{com.concepto}</span>
                        <span>{formatCurrency(com.montoTotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalarioDetalle;
