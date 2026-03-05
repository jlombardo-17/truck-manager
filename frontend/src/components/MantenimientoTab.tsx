import { useState, useEffect } from 'react';
import '../styles/MantenimientoPage.css';
import { MantenimientoTipo, MantenimientoRegistro, EstadoMantenimiento } from '../types/mantenimiento';
import { maintenanceService } from '../services/maintenanceService';

interface Props {
  camionId: number;
}

export const MantenimientoTab = ({ camionId }: Props) => {
  const [registros, setRegistros] = useState<MantenimientoRegistro[]>([]);
  const [tipos, setTipos] = useState<MantenimientoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tipoId: '',
    fechaPrograma: '',
    kmActual: '',
    costoReal: '',
    observaciones: '',
    taller: '',
  });
  const [alertas, setAlertas] = useState({
    proximos: [] as MantenimientoRegistro[],
    vencidos: [] as MantenimientoRegistro[],
  });
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    completados: 0,
    pendientes: 0,
    vencidos: 0,
    proximosVencer: 0,
    costoTotal: 0,
  });

  useEffect(() => {
    loadData();
  }, [camionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [registrosData, tiposData, proximosData, vencidosData, estadisticasData] = await Promise.all([
        maintenanceService.getRegistrosByCamion(camionId),
        maintenanceService.getAllTipos(),
        maintenanceService.getProximosAVencer(camionId),
        maintenanceService.getVencidos(camionId),
        maintenanceService.getEstadisticasCamion(camionId),
      ]);

      setRegistros(registrosData);
      setTipos(tiposData.filter((t) => t.activo));
      setAlertas({
        proximos: proximosData,
        vencidos: vencidosData,
      });
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      alert('Error al cargar datos de mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (registro?: MantenimientoRegistro) => {
    if (registro) {
      setEditingId(registro.id || null);
      setFormData({
        tipoId: registro.tipoId.toString(),
        fechaPrograma: new Date(registro.fechaPrograma).toISOString().split('T')[0],
        kmActual: registro.kmActual.toString(),
        costoReal: registro.costoReal?.toString() || '',
        observaciones: registro.observaciones || '',
        taller: registro.taller || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        tipoId: '',
        fechaPrograma: new Date().toISOString().split('T')[0],
        kmActual: '',
        costoReal: '',
        observaciones: '',
        taller: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      tipoId: '',
      fechaPrograma: '',
      kmActual: '',
      costoReal: '',
      observaciones: '',
      taller: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        camionId,
        tipoId: parseInt(formData.tipoId),
        estado: EstadoMantenimiento.PENDIENTE,
        fechaPrograma: new Date(formData.fechaPrograma),
        kmActual: parseInt(formData.kmActual),
        costoReal: formData.costoReal ? parseFloat(formData.costoReal) : undefined,
        observaciones: formData.observaciones || undefined,
        taller: formData.taller || undefined,
        proximaFecha: new Date(formData.fechaPrograma),
      };

      if (editingId) {
        await maintenanceService.updateRegistro(editingId, data);
      } else {
        await maintenanceService.createRegistro(data);
      }

      handleCloseModal();
      loadData();
      alert(editingId ? 'Registro actualizado' : 'Registro creado exitosamente');
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      alert('Error al guardar registro');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      await maintenanceService.deleteRegistro(id);
      loadData();
      alert('Registro eliminado');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar registro');
    }
  };

  const handleMarkCompleted = async (id: number) => {
    const registro = registros.find((r) => r.id === id);
    if (!registro) return;

    const costoReal = prompt('Costo real del mantenimiento:', registro.costoReal?.toString());
    if (costoReal === null) return;

    const observaciones = prompt('Observaciones (opcional):');

    try {
      await maintenanceService.marcarComoCompletado(id, parseFloat(costoReal), observaciones || undefined);
      loadData();
      alert('Mantenimiento marcado como completado');
    } catch (error) {
      console.error('Error marking completed:', error);
      alert('Error al marcar como completado');
    }
  };

  const getEstadoBadgeClass = (estado: EstadoMantenimiento) => {
    const baseClass = 'estadoBadge';
    const stateClass = {
      [EstadoMantenimiento.PENDIENTE]: 'pendiente',
      [EstadoMantenimiento.EN_PROGRESO]: 'en_progreso',
      [EstadoMantenimiento.COMPLETADO]: 'completado',
      [EstadoMantenimiento.CANCELADO]: 'cancelado',
    }[estado];
    return `${baseClass} ${stateClass}`;
  };

  if (loading) {
    return <div className="container">Cargando datos de mantenimiento...</div>;
  }

  return (
    <div className="container">
      {/* Alertas */}
      <div className="alertasSection">
        <h3>Alertas de Mantenimiento</h3>
        <div className="alertasGrid">
          <div className="alertCard">
            <div className="alertTitle">Vencidos</div>
            <div className="alertCount">{estadisticas.vencidos}</div>
            {alertas.vencidos.length > 0 && (
              <ul className="alertList">
                {alertas.vencidos.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    {a.tipo?.nombre || `Tipo #${a.tipoId}`}
                  </li>
                ))}
                {alertas.vencidos.length > 3 && <li>+{alertas.vencidos.length - 3} más</li>}
              </ul>
            )}
          </div>
          <div className="alertCard">
            <div className="alertTitle">Próximos Vencer (30 días)</div>
            <div className="alertCount">{estadisticas.proximosVencer}</div>
            {alertas.proximos.length > 0 && (
              <ul className="alertList">
                {alertas.proximos.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    {a.tipo?.nombre || `Tipo #${a.tipoId}`}
                  </li>
                ))}
                {alertas.proximos.length > 3 && <li>+{alertas.proximos.length - 3} más</li>}
              </ul>
            )}
          </div>
          <div className="alertCard">
            <div className="alertTitle">Costo Total Invertido</div>
            <div className="alertCost">${Number(estadisticas.costoTotal || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="estadisticasSection">
        <div className="stat">
          <span>Total de registros:</span>
          <strong>{estadisticas.totalRegistros}</strong>
        </div>
        <div className="stat">
          <span>Completados:</span>
          <strong>{estadisticas.completados}</strong>
        </div>
        <div className="stat">
          <span>Pendientes:</span>
          <strong>{estadisticas.pendientes}</strong>
        </div>
      </div>

      {/* Botón para agregar nuevo registro */}
      <button onClick={() => handleOpenModal()} className="addButton">
        + Nuevo Mantenimiento
      </button>

      {/* Tabla de Registros */}
      <div className="tableContainer">
        {registros.length === 0 ? (
          <p className="noData">No hay registros de mantenimiento</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha Programada</th>
                <th>Fecha Realizado</th>
                <th>KM</th>
                <th>Estado</th>
                <th>Costo Real</th>
                <th>Taller</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td>{registro.tipo?.nombre || `Tipo #${registro.tipoId}`}</td>
                  <td>{new Date(registro.fechaPrograma).toLocaleDateString()}</td>
                  <td>{registro.fechaRealizado ? new Date(registro.fechaRealizado).toLocaleDateString() : '-'}</td>
                  <td>{registro.kmActual}</td>
                  <td>
                    <span className={getEstadoBadgeClass(registro.estado)}>
                      {registro.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>${Number(registro.costoReal || 0).toFixed(2)}</td>
                  <td>{registro.taller || '-'}</td>
                  <td className="actions">
                    {registro.estado === EstadoMantenimiento.PENDIENTE && (
                      <button
                        onClick={() => handleMarkCompleted(registro.id!)}
                        className="btnSmall"
                        title="Marcar como completado"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(registro)}
                      className="btnSmall"
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(registro.id!)}
                      className="btnSmall btnDelete"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="modal">
          <div className="modalContent">
            <h2>{editingId ? 'Editar Registro' : 'Nuevo Mantenimiento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="formGroup">
                <label>Tipo de Mantenimiento *</label>
                <select
                  value={formData.tipoId}
                  onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>Fecha Programada *</label>
                  <input
                    type="date"
                    value={formData.fechaPrograma}
                    onChange={(e) => setFormData({ ...formData, fechaPrograma: e.target.value })}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>KM Actual *</label>
                  <input
                    type="number"
                    value={formData.kmActual}
                    onChange={(e) => setFormData({ ...formData, kmActual: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>Costo Real ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costoReal}
                    onChange={(e) => setFormData({ ...formData, costoReal: e.target.value })}
                  />
                </div>

                <div className="formGroup">
                  <label>Taller</label>
                  <input
                    type="text"
                    value={formData.taller}
                    onChange={(e) => setFormData({ ...formData, taller: e.target.value })}
                    placeholder="Nombre del taller"
                  />
                </div>
              </div>

              <div className="formGroup">
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Detalles del mantenimiento"
                  rows={3}
                ></textarea>
              </div>

              <div className="modalActions">
                <button type="submit" className="btnPrimary">
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={handleCloseModal} className="btnSecondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
