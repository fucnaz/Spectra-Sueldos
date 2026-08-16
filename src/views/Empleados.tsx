import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Empleado } from '../utils/calculadora';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  UserMinus, 
  X, 
  Building
} from 'lucide-react';

export const Empleados: React.FC = () => {
  const { empleados, agregarEmpleado, editarEmpleado, bajaEmpleado } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [cuil, setCuil] = useState('');
  const [puesto, setPuesto] = useState('');
  const [departamento, setDepartamento] = useState('Tecnología');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [sueldoBasico, setSueldoBasico] = useState(350000);
  const [tipoRemuneracion, setTipoRemuneracion] = useState<Empleado['tipoRemuneracion']>('Mensual');
  const [obraSocial, setObraSocial] = useState('OSECAC');
  const [sindicato, setSindicato] = useState(false);
  const [sindicatoNombre, setSindicatoNombre] = useState('SEC (Comercio)');
  const [cbu, setCbu] = useState('');

  const departments = ['Todos', ...Array.from(new Set(empleados.map(e => e.departamento)))];

  const handleOpenAddModal = () => {
    setEditingEmp(null);
    setNombre('');
    setCuil('');
    setPuesto('');
    setDepartamento('Tecnología');
    setFechaIngreso(new Date().toISOString().split('T')[0]);
    setSueldoBasico(550000);
    setTipoRemuneracion('Mensual');
    setObraSocial('OSECAC');
    setSindicato(false);
    setSindicatoNombre('SEC (Comercio)');
    setCbu('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (emp: Empleado) => {
    setEditingEmp(emp);
    setNombre(emp.nombre);
    setCuil(emp.cuil);
    setPuesto(emp.puesto);
    setDepartamento(emp.departamento);
    setFechaIngreso(emp.fechaIngreso);
    setSueldoBasico(emp.sueldoBasico);
    setTipoRemuneracion(emp.tipoRemuneracion);
    setObraSocial(emp.obraSocial);
    setSindicato(emp.sindicato);
    setSindicatoNombre(emp.sindicatoNombre);
    setCbu(emp.cbu);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!nombre.trim()) return alert('El nombre es requerido.');
    if (!/^\d{2}-\d{8}-\d{1}$/.test(cuil)) {
      return alert('El CUIL debe tener formato válido: XX-XXXXXXXX-X');
    }
    if (cbu && !/^\d{22}$/.test(cbu)) {
      return alert('El CBU debe contener exactamente 22 números.');
    }
    if (sueldoBasico <= 0) return alert('El sueldo básico debe ser mayor a 0.');

    const empData = {
      nombre,
      cuil,
      puesto,
      departamento,
      fechaIngreso,
      sueldoBasico,
      tipoRemuneracion,
      obraSocial,
      sindicato,
      sindicatoNombre: sindicato ? sindicatoNombre : '',
      cbu
    };

    if (editingEmp) {
      editarEmpleado({
        ...editingEmp,
        ...empData
      });
    } else {
      agregarEmpleado(empData);
    }
    
    setModalOpen(false);
  };

  const handleBaja = (id: string, nombre: string) => {
    if (confirm(`¿Dar de baja al empleado ${nombre}? Esta acción inhabilitará nuevas liquidaciones.`)) {
      bajaEmpleado(id);
    }
  };

  // Filtered employees
  const filtered = empleados.filter(emp => {
    const matchesSearch = emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.cuil.includes(searchTerm) ||
                          emp.puesto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'Todos' || emp.departamento === deptFilter;
    return matchesSearch && matchesDept;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Gestión de Legajos</h1>
          <p>Administra los datos personales y contractuales del personal activo.</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <UserPlus size={18} /> Agregar Empleado
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card filters-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, CUIL, puesto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input-text"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <Building size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Departamento:</label>
          <select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            className="filter-select"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="glass-card" style={{ padding: '0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No se encontraron empleados con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre y CUIL</th>
                  <th>Área / Puesto</th>
                  <th>Fecha Ingreso</th>
                  <th>Básico Remuneración</th>
                  <th>Obra Social / Sindicato</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} style={{ opacity: emp.estado === 'Baja' ? 0.6 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CUIL: {emp.cuil}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{emp.puesto}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.departamento}</div>
                    </td>
                    <td>{emp.fechaIngreso}</td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(emp.sueldoBasico)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.tipoRemuneracion}</div>
                    </td>
                    <td>
                      <div>{emp.obraSocial}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {emp.sindicato ? `Sí - ${emp.sindicatoNombre}` : 'No Sindicalizado'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          onClick={() => handleOpenEditModal(emp)}
                          title="Editar Legajo"
                        >
                          <Edit3 size={14} />
                        </button>
                        {emp.estado === 'Activo' && (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                            onClick={() => handleBaja(emp.id, emp.nombre)}
                            title="Dar de Baja"
                          >
                            <UserMinus size={14} />
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

      {/* Modal Dialog for Create/Edit */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content animate-fade-in" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--border-glass-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h2>{editingEmp ? 'Editar Legajo Empleado' : 'Añadir Nuevo Empleado'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Juan Pérez" />
                </div>
                <div className="form-group">
                  <label>CUIL (XX-XXXXXXXX-X)</label>
                  <input type="text" className="form-input" value={cuil} onChange={e => setCuil(e.target.value)} required placeholder="Ej: 20-35492812-9" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Puesto</label>
                  <input type="text" className="form-input" value={puesto} onChange={e => setPuesto(e.target.value)} required placeholder="Ej: Desarrollador UI" />
                </div>
                <div className="form-group">
                  <label>Departamento</label>
                  <select className="form-input" value={departamento} onChange={e => setDepartamento(e.target.value)}>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Diseño">Diseño</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sueldo Básico (ARS)</label>
                  <input type="number" className="form-input" value={sueldoBasico} onChange={e => setSueldoBasico(Number(e.target.value))} required min="1" />
                </div>
                <div className="form-group">
                  <label>Fecha de Ingreso</label>
                  <input type="date" className="form-input" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Obra Social</label>
                  <input type="text" className="form-input" value={obraSocial} onChange={e => setObraSocial(e.target.value)} placeholder="Ej: OSDE 210, OSECAC" />
                </div>
                <div className="form-group">
                  <label>CBU Cuenta Sueldo (22 dígitos)</label>
                  <input type="text" className="form-input" value={cbu} onChange={e => setCbu(e.target.value)} placeholder="Opcional CBU" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0 1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="sindicato" 
                    checked={sindicato} 
                    onChange={e => setSindicato(e.target.checked)} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sindicato" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Afiliado a Gremio/Sindicato (Deducción 2% adicional)</label>
                </div>
                {sindicato && (
                  <div className="form-group" style={{ margin: '0', paddingTop: '0.5rem' }}>
                    <label>Nombre del Sindicato / Convenio Colectivo</label>
                    <input type="text" className="form-input" value={sindicatoNombre} onChange={e => setSindicatoNombre(e.target.value)} placeholder="Ej: SEC (Comercio), UOM" />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingEmp ? 'Guardar Cambios' : 'Registrar Legajo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .filters-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding: 1rem 1.5rem;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .filter-input-text {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
        }

        .filter-input-text:focus {
          border-color: var(--accent-indigo);
        }

        .filter-select {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
        }

        /* Modal backdrop and contents */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1.5rem;
        }

        .modal-content {
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
export default Empleados;
