import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { viajsService, Viaje, ViajRuta, ViajComision } from '../services/viajsService';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import { Camion } from '../types/camion';
import { Chofer } from '../types/chofer';
import MapEditor from '../components/MapEditor';
import CommissionsTable from '../components/CommissionsTable';
import '../styles/ViajeForm.css';

const ViajeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Estado del formulario
  const [formData, setFormData] = useState<Viaje>({
    numeroViaje: viajsService.generateNroViaje(),
    camionId: 0,
    choferId: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    origen: '',
    destino: '',
    valorViaje: 0,
    kmRecorridos: 0,
    estado: 'en_progreso',
  });

  // Variables para las rutas y comisiones
  const [rutas, setRutas] = useState<ViajRuta[]>([]);
  const [comisiones, setComisiones] = useState<ViajComision[]>([]);

  // Datos complementarios
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [choferes, setChoferes] = useState<Chofer[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing] = useState(!!id);

  // Cargar datos iniciales
  useEffect(() => {
    loadDataAndForm();
  }, [id]);

  const loadDataAndForm = async () => {
    try {
      setLoading(true);

      // Cargar camiones y choferes
      const [camionesData, choferesData] = await Promise.all([
        camionesService.getAll(),
        choferesService.getAll(),
      ]);

      setCamiones(camionesData);
      setChoferes(choferesData);

      // Si es edición, cargar datos del viaje
      if (id) {
        const viaje = await viajsService.getById(parseInt(id));
        setFormData(viaje);
        setRutas(viaje.rutas || []);
        setComisiones(viaje.comisiones || []);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'valorViaje' || name === 'kmRecorridos' || name === 'costoCombustible' || name === 'otrosGastos' 
        ? parseFloat(value) || 0 
        : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones básicas
    if (!formData.numeroViaje || !formData.camionId || !formData.choferId) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);

      const dataToSend: Viaje = {
        ...formData,
        rutas,
        comisiones,
      };

      if (isEditing) {
        await viajsService.update(parseInt(id!), dataToSend);
        setSuccess('Viaje actualizado exitosamente');
      } else {
        await viajsService.create(dataToSend);
        setSuccess('Viaje creado exitosamente');
      }

      setTimeout(() => {
        navigate('/viajes');
      }, 1500);
    } catch (err) {
      setError('Error al guardar el viaje');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className="viaje-form-page">
      <div className="form-header">
        <h1>{isEditing ? '✎ Editar Viaje' : '+ Nuevo Viaje'}</h1>
        <button className="btn-back" onClick={() => navigate('/viajes')}>
          ← Volver
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="viaje-form">
        {/* Sección 1: Información General */}
        <section className="form-section">
          <h2>📋 Información General</h2>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="numeroViaje">Número de Viaje *</label>
              <input
                type="text"
                id="numeroViaje"
                name="numeroViaje"
                value={formData.numeroViaje}
                onChange={handleInputChange}
                placeholder="VIAJE-20260303-0001"
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="fechaInicio">Fecha de Inicio *</label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="fechaFin">Fecha de Fin</label>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                value={formData.fechaFin || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="estado">Estado *</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="en_progreso">En Progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sección 2: Camión y Chofer */}
        <section className="form-section">
          <h2>🚚 Camión y Operador</h2>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="camionId">Camión *</label>
              <select
                id="camionId"
                name="camionId"
                value={formData.camionId}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value={0}>Selecciona un camión</option>
                {camiones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.patente} - {c.marca} {c.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="choferId">Chofer *</label>
              <select
                id="choferId"
                name="choferId"
                value={formData.choferId}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value={0}>Selecciona un chofer</option>
                {choferes.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nombre} {ch.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Sección 3: Ubicaciones */}
        <section className="form-section">
          <h2>📍 Ubicaciones</h2>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="origen">Lugar de Carga (Origen) *</label>
              <input
                type="text"
                id="origen"
                name="origen"
                value={formData.origen}
                onChange={handleInputChange}
                placeholder="Ej: San Juan, Misiones"
                required
                className="form-input"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="destino">Lugar de Descarga (Destino) *</label>
              <input
                type="text"
                id="destino"
                name="destino"
                value={formData.destino}
                onChange={handleInputChange}
                placeholder="Ej: Asunción, Central"
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="latitudOrigen">Latitud Origen</label>
              <input
                type="number"
                id="latitudOrigen"
                name="latitudOrigen"
                value={formData.latitudOrigen || ''}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-25.2637"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="longitudOrigen">Longitud Origen</label>
              <input
                type="number"
                id="longitudOrigen"
                name="longitudOrigen"
                value={formData.longitudOrigen || ''}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-57.5759"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="latitudDestino">Latitud Destino</label>
              <input
                type="number"
                id="latitudDestino"
                name="latitudDestino"
                value={formData.latitudDestino || ''}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-25.2637"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="longitudDestino">Longitud Destino</label>
              <input
                type="number"
                id="longitudDestino"
                name="longitudDestino"
                value={formData.longitudDestino || ''}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-57.5759"
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Sección 4: Editor de Ruta en Mapa */}
        <section className="form-section">
          <MapEditor
            onRoutesChange={setRutas}
            initialRoutes={rutas}
            initialCenter={[formData.latitudOrigen || -25.2637, formData.longitudOrigen || -57.5759]}
            title="📍 Editor de Ruta"
          />
        </section>

        {/* Sección 5: Información de la Carga */}
        <section className="form-section">
          <h2>📦 Información de la Carga</h2>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="descripcionCarga">Descripción de la Carga</label>
              <textarea
                id="descripcionCarga"
                name="descripcionCarga"
                value={formData.descripcionCarga || ''}
                onChange={handleInputChange}
                placeholder="Ej: 50 bolsas de soja, 500 kg"
                rows={3}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="pesoCargaKg">Peso de Carga (kg)</label>
              <input
                type="number"
                id="pesoCargaKg"
                name="pesoCargaKg"
                value={formData.pesoCargaKg || ''}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Sección 6: Valores Económicos */}
        <section className="form-section">
          <h2>💰 Valores Económicos</h2>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="valorViaje">Valor del Viaje *</label>
              <input
                type="number"
                id="valorViaje"
                name="valorViaje"
                value={formData.valorViaje}
                onChange={handleInputChange}
                step="0.01"
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="kmRecorridos">KM Recorridos</label>
              <input
                type="number"
                id="kmRecorridos"
                name="kmRecorridos"
                value={formData.kmRecorridos || 0}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="consumoCombustible">Consumo de Combustible (litros)</label>
              <input
                type="number"
                id="consumoCombustible"
                name="consumoCombustible"
                value={formData.consumoCombustible || ''}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="costoCombustible">Costo de Combustible</label>
              <input
                type="number"
                id="costoCombustible"
                name="costoCombustible"
                value={formData.costoCombustible || 0}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="otrosGastos">Otros Gastos</label>
              <input
                type="number"
                id="otrosGastos"
                name="otrosGastos"
                value={formData.otrosGastos || 0}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Sección 7: Comisiones */}
        <section className="form-section">
          <CommissionsTable
            commissions={comisiones}
            onCommissionsChange={setComisiones}
            valorViaje={formData.valorViaje}
            commissionTypes={['Contratista', 'Flete', 'Operario', 'Cliente', 'Acarreador', 'Otro']}
          />
        </section>

        {/* Sección 8: Notas */}
        <section className="form-section">
          <h2>📝 Notas Adicionales</h2>

          <div className="form-field full-width">
            <textarea
              name="notas"
              value={formData.notas || ''}
              onChange={handleInputChange}
              placeholder="Notas adicionales sobre el viaje..."
              rows={4}
              className="form-input"
            />
          </div>
        </section>

        {/* Botones de acciones */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/viajes')}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar Viaje' : 'Crear Viaje'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViajeForm;
