import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clientesService from '../services/clientesService';
import { Cliente, CreateClienteDto } from '../types/cliente';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import BackButton from '../components/BackButton';
import EstadoBadge from '../components/EstadoBadge';
import heroTeamTeal from '../assets/hero-team-teal.svg';
import '../styles/Choferes.css';
import '../styles/Modal.css';

type ClienteFormState = {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
  activo: boolean;
};

const emptyForm: ClienteFormState = {
  nombre: '',
  rut: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
  activo: true,
};

const toFormState = (cliente: Cliente): ClienteFormState => ({
  nombre: cliente.nombre,
  rut: cliente.rut ?? '',
  telefono: cliente.telefono ?? '',
  email: cliente.email ?? '',
  direccion: cliente.direccion ?? '',
  notas: cliente.notas ?? '',
  activo: cliente.activo,
});

// Los campos vacíos se mandan como null para poder limpiarlos al editar
// (y para que @IsEmail no rechace un string vacío).
const toPayload = (form: ClienteFormState): CreateClienteDto => {
  const orNull = (value: string) => (value.trim() ? value.trim() : null);
  return {
    nombre: form.nombre.trim(),
    rut: orNull(form.rut),
    telefono: orNull(form.telefono),
    email: orNull(form.email),
    direccion: orNull(form.direccion),
    notas: orNull(form.notas),
    activo: form.activo,
  };
};

const getErrorMessage = (error: any, fallback: string): string => {
  const message = error?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' && message ? message : fallback;
};

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClienteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setError(null);
      const data = await clientesService.getAll();
      setClientes(data);
    } catch (err: any) {
      if (err?.statusCode === 401) {
        navigate('/login');
        return;
      }
      setError(getErrorMessage(err, 'Error al cargar clientes'));
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (!mostrarInactivos && !cliente.activo) return false;
      if (!term) return true;
      return [cliente.nombre, cliente.rut, cliente.telefono, cliente.email]
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [clientes, searchTerm, mostrarInactivos]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditing(cliente);
    setForm(toFormState(cliente));
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const payload = toPayload(form);
      if (editing) {
        await clientesService.update(editing.id, payload);
      } else {
        await clientesService.create(payload);
      }
      setShowForm(false);
      await loadClientes();
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Error al guardar el cliente'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!window.confirm(`¿Eliminar al cliente ${cliente.nombre}?`)) return;
    try {
      await clientesService.delete(cliente.id);
      await loadClientes();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Error al eliminar el cliente'));
    }
  };

  const updateField = <K extends keyof ClienteFormState>(field: K, value: ClienteFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="choferes-container">
      <AppNavbar />

      <div className="page-back-button-container">
        <BackButton label="Volver al Dashboard" to="/dashboard" variant="ghost" />
      </div>

      <HeroSection
        subtitle="Clientes"
        title="Gestión de Clientes"
        description="Dadores de carga a los que se les realizan viajes."
        backgroundImage={`linear-gradient(135deg, rgba(52, 152, 219, 0.9) 0%, rgba(26, 188, 156, 0.88) 50%, rgba(22, 160, 133, 0.85) 100%), url(${heroTeamTeal})`}
        darkBg={true}
        primaryAction={{ label: '+ Agregar Cliente', onClick: openCreate }}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre, RUT, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Buscar clientes"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Cargando clientes...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="empty-state">
          <p>{clientes.length === 0 ? 'Todavía no hay clientes cargados' : 'No se encontraron clientes'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="choferes-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT / Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.rut || '-'}</td>
                  <td>{cliente.telefono || '-'}</td>
                  <td>{cliente.email || '-'}</td>
                  <td>
                    <EstadoBadge
                      label={cliente.activo ? 'Activo' : 'Inactivo'}
                      tono={cliente.activo ? 'success' : 'neutral'}
                    />
                  </td>
                  <td className="actions">
                    <Link
                      to={`/viajes?clienteId=${cliente.id}`}
                      className="table-action-btn table-action-btn--view"
                      title="Ver viajes"
                      aria-label={`Ver viajes de ${cliente.nombre}`}
                    >
                      Viajes
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(cliente)}
                      className="table-action-btn table-action-btn--edit"
                      aria-label={`Editar cliente ${cliente.nombre}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cliente)}
                      className="table-action-btn table-action-btn--delete"
                      aria-label={`Eliminar cliente ${cliente.nombre}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="summary">
        <p>
          Mostrando {filteredClientes.length} de {clientes.length} clientes
        </p>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button type="button" className="modal-close" onClick={closeForm} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label htmlFor="cliente-nombre">Nombre *</label>
                <input
                  id="cliente-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Ej: Calmer, Matias Arrieta"
                  autoFocus
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cliente-rut">RUT / Documento</label>
                  <input
                    id="cliente-rut"
                    type="text"
                    value={form.rut}
                    onChange={(e) => updateField('rut', e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cliente-telefono">Teléfono</label>
                  <input
                    id="cliente-telefono"
                    type="text"
                    value={form.telefono}
                    onChange={(e) => updateField('telefono', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cliente-email">Email</label>
                  <input
                    id="cliente-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cliente-direccion">Dirección</label>
                  <input
                    id="cliente-direccion"
                    type="text"
                    value={form.direccion}
                    onChange={(e) => updateField('direccion', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cliente-notas">Notas</label>
                <textarea
                  id="cliente-notas"
                  rows={3}
                  value={form.notas}
                  onChange={(e) => updateField('notas', e.target.value)}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => updateField('activo', e.target.checked)}
                />
                Cliente activo
              </label>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
