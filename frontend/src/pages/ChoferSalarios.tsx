import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import salariosService from '../services/salariosService';
import choferesService from '../services/choferesService';
import {
  ChoferSalario,
  EstadoSalario,
  formatPeriodo,
  formatCurrency,
  getEstadoSalarioLabel,
  getEstadoSalarioColor,
} from '../types/salario';
import { Chofer } from '../types/chofer';
import BackButton from '../components/BackButton';
import '../styles/ChoferSalarios.css';

const ChoferSalarios: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const choferId = parseInt(id || '0');

  const [chofer, setChofer] = useState<Chofer | null>(null);
  const [salarios, setSalarios] = useState<ChoferSalario[]>([]);
  const [salariosFiltrados, setSalariosFiltrados] = useState<ChoferSalario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    cargarDatos();
  }, [choferId]);

  useEffect(() => {
    aplicarFiltros();
  }, [salarios, filtroAnio, filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar datos del chofer
      const choferData = await choferesService.getById(choferId);
      setChofer(choferData);

      // Cargar salarios del chofer
      const salariosData = await salariosService.getByChofer(choferId);
      setSalarios(salariosData);
    } catch (err: any) {
      console.error('Error al cargar salarios:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...salarios];

    // Filtro por año
    filtered = filtered.filter((s) => s.anio === filtroAnio);

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter((s) => s.estado === filtroEstado);
    }

    setSalariosFiltrados(filtered);
  };

  const handleVerDetalle = (salarioId: number) => {
    navigate(`/choferes/${choferId}/salarios/${salarioId}`);
  };

  const handleGenerarPDF = (salario: ChoferSalario) => {
    // TODO: Implementar generación PDF
    console.log('Generar PDF para salario:', salario.id);
    alert('Función de generación PDF en desarrollo');
  };

  const calcularTotales = () => {
    const totales = salariosFiltrados.reduce(
      (acc, s) => ({
        salarioBase: acc.salarioBase + parseFloat(s.salarioBase.toString()),
        comisiones: acc.comisiones + parseFloat(s.totalComisiones.toString()),
        bonos: acc.bonos + parseFloat(s.bonos.toString()),
        deducciones: acc.deducciones + parseFloat(s.deducciones.toString()),
        salarioNeto: acc.salarioNeto + parseFloat(s.salarioNeto.toString()),
      }),
      { salarioBase: 0, comisiones: 0, bonos: 0, deducciones: 0, salarioNeto: 0 },
    );
    return totales;
  };

  const getAniosDisponibles = (): number[] => {
    const anios = Array.from(new Set(salarios.map((s) => s.anio)));
    return anios.sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando salarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <BackButton label="← Volver a Choferes" to="/choferes" variant="compact" />
      </div>
    );
  }

  const totales = calcularTotales();
  const aniosDisponibles = getAniosDisponibles();

  return (
    <div className="chofer-salarios-container">
      {/* Header */}
      <div className="page-header">
        <BackButton
          label="← Volver al Detalle del Chofer"
          to={`/choferes/${choferId}`}
          variant="ghost"
        />
        <div>
          <h1>Salarios de {chofer?.nombre} {chofer?.apellido}</h1>
          <p className="subtitle">RUT: {chofer?.numeroDocumento}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filtro-anio">Año:</label>
          <select
            id="filtro-anio"
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
          >
            {aniosDisponibles.length > 0 ? (
              aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))
            ) : (
              <option value={new Date().getFullYear()}>
                {new Date().getFullYear()}
              </option>
            )}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado">Estado:</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value={EstadoSalario.PENDIENTE}>Pendiente</option>
            <option value={EstadoSalario.PAGADO}>Pagado</option>
            <option value={EstadoSalario.CANCELADO}>Cancelado</option>
          </select>
        </div>

        <button className="btn-primary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      {/* Tabla de Salarios */}
      {salariosFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>No hay salarios registrados para este período</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="salarios-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Salario Base</th>
                  <th>Comisiones</th>
                  <th>Bonos</th>
                  <th>Deducciones</th>
                  <th>Salario Neto</th>
                  <th>Estado</th>
                  <th>Fecha Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salariosFiltrados.map((salario) => (
                  <tr key={salario.id}>
                    <td>
                      <strong>{formatPeriodo(salario.mes, salario.anio)}</strong>
                    </td>
                    <td>{formatCurrency(salario.salarioBase)}</td>
                    <td className="comisiones">
                      {formatCurrency(salario.totalComisiones)}
                    </td>
                    <td className="bonos">{formatCurrency(salario.bonos)}</td>
                    <td className="deducciones">
                      {formatCurrency(salario.deducciones)}
                    </td>
                    <td>
                      <strong>{formatCurrency(salario.salarioNeto)}</strong>
                    </td>
                    <td>
                      <span
                        className="estado-badge"
                        style={{
                          backgroundColor: getEstadoSalarioColor(salario.estado),
                        }}
                      >
                        {getEstadoSalarioLabel(salario.estado)}
                      </span>
                    </td>
                    <td>
                      {salario.fechaPago
                        ? new Date(salario.fechaPago).toLocaleDateString('es-CL')
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleVerDetalle(salario.id)}
                          title="Ver detalle"
                          aria-label={`Ver detalle de salario ${formatPeriodo(
                            salario.mes,
                            salario.anio,
                          )}`}
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleGenerarPDF(salario)}
                          title="Generar PDF"
                          aria-label={`Generar PDF de salario ${formatPeriodo(
                            salario.mes,
                            salario.anio,
                          )}`}
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totales-row">
                  <td>
                    <strong>TOTALES {filtroAnio}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.salarioBase)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.comisiones)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.bonos)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.deducciones)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.salarioNeto)}</strong>
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ChoferSalarios;
