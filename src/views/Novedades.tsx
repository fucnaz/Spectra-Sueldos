import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Novedad } from '../utils/calculadora';
import { Save, Info } from 'lucide-react';

export const Novedades: React.FC = () => {
  const { empleados, novedades, guardarNovedad, periodoActivo } = useApp();

  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  
  // Quick temporary fields for editing
  const [he50, setHe50] = useState(0);
  const [he100, setHe100] = useState(0);
  const [inasistencias, setInasistencias] = useState(0);
  const [bonoRem, setBonoRem] = useState(0);
  const [bonoNoRem, setBonoNoRem] = useState(0);

  const activeEmployees = empleados.filter(e => e.estado === 'Activo');

  const startEditing = (empId: string, currentNov?: Novedad) => {
    setEditEmpId(empId);
    setHe50(currentNov?.horasExtras50 || 0);
    setHe100(currentNov?.horasExtras100 || 0);
    setInasistencias(currentNov?.inasistencias || 0);
    setBonoRem(currentNov?.bonoRemunerativo || 0);
    setBonoNoRem(currentNov?.bonoNoRemunerativo || 0);
  };

  const handleSave = (empId: string) => {
    guardarNovedad({
      empleadoId: empId,
      periodo: periodoActivo,
      horasExtras50: Math.max(0, he50),
      horasExtras100: Math.max(0, he100),
      inasistencias: Math.max(0, inasistencias),
      bonoRemunerativo: Math.max(0, bonoRem),
      bonoNoRemunerativo: Math.max(0, bonoNoRem)
    });
    setEditEmpId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Novedades Mensuales</h1>
        <p>Carga de horas extras, inasistencias y adicionales para el período activo <strong>{periodoActivo}</strong>.</p>
      </div>

      {/* Info Warning */}
      <div className="glass-card info-card" style={{ borderLeft: '4px solid var(--accent-indigo)', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Info size={20} className="gradient-text" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem' }}>
          Las novedades se aplicarán de forma inmediata al calcular la liquidación del empleado en este mes. 
          Las faltas deducen el presentismo y restan valor del sueldo proporcional.
        </p>
      </div>

      {/* Employees Novedades Table */}
      <div className="glass-card" style={{ padding: '0' }}>
        {activeEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No hay empleados activos registrados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Empleado</th>
                  <th>Horas Extras 50%</th>
                  <th>Horas Extras 100%</th>
                  <th>Inasistencias</th>
                  <th>Bono Remunerativo</th>
                  <th>Asignación No Rem.</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map(emp => {
                  // Find current novedad
                  const nov = novedades.find(n => n.empleadoId === emp.id && n.periodo === periodoActivo);
                  const isEditing = editEmpId === emp.id;

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{emp.nombre}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.puesto}</div>
                      </td>
                      
                      {isEditing ? (
                        <>
                          <td>
                            <input 
                              type="number" 
                              className="form-input quick-input" 
                              value={he50} 
                              onChange={e => setHe50(Number(e.target.value))} 
                              min="0"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input quick-input" 
                              value={he100} 
                              onChange={e => setHe100(Number(e.target.value))} 
                              min="0"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input quick-input" 
                              value={inasistencias} 
                              onChange={e => setInasistencias(Number(e.target.value))} 
                              min="0"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input quick-input" 
                              style={{ width: '100px' }}
                              value={bonoRem} 
                              onChange={e => setBonoRem(Number(e.target.value))} 
                              min="0"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input quick-input" 
                              style={{ width: '100px' }}
                              value={bonoNoRem} 
                              onChange={e => setBonoNoRem(Number(e.target.value))} 
                              min="0"
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => handleSave(emp.id)}
                            >
                              <Save size={14} /> Guardar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{nov?.horasExtras50 || 0} hs</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{nov?.horasExtras100 || 0} hs</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {nov?.inasistencias ? (
                              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{nov.inasistencias} días</span>
                            ) : (
                              '0 días'
                            )}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(nov?.bonoRemunerativo || 0)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(nov?.bonoNoRemunerativo || 0)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => startEditing(emp.id, nov)}
                            >
                              Editar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .quick-input {
          padding: 0.35rem 0.6rem;
          width: 70px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          margin: 0;
        }

        .info-card {
          background: rgba(99, 102, 241, 0.05);
        }
      `}</style>
    </div>
  );
};
export default Novedades;
