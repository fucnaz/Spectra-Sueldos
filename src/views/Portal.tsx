import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, ShieldAlert, Award, Receipt, Eye } from 'lucide-react';
import { numeroALetras } from '../utils/calculadora';

export const Portal: React.FC = () => {
  const { 
    empleados, 
    liquidaciones, 
    portalEmpleadoId, 
    setPortalEmpleadoId, 
    setCurrentView 
  } = useApp();

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const activeEmployee = empleados.find(e => e.id === portalEmpleadoId);
  const employeeReceipts = liquidaciones.filter(l => l.empleadoId === portalEmpleadoId).sort((a,b) => b.periodo.localeCompare(a.periodo));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!portalEmpleadoId) {
    return (
      <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} className="gradient-text" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Acceso al Portal del Empleado</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Para simular la experiencia de auto-consulta de un empleado, selecciona un legajo a continuación:</p>

        <select 
          defaultValue=""
          onChange={(e) => setPortalEmpleadoId(e.target.value)}
          className="form-input"
          style={{ width: '100%', cursor: 'pointer', marginBottom: '1.5rem' }}
        >
          <option value="" disabled>Seleccionar Empleado...</option>
          {empleados.filter(e => e.estado === 'Activo').map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.puesto})</option>
          ))}
        </select>
        
        <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')} style={{ width: '100%' }}>
          Volver al Dashboard Administrativo
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card portal-hero" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05))', border: '1px solid var(--border-glass-hover)', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="portal-avatar">
            <User size={36} className="gradient-text" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>¡Hola, {activeEmployee?.nombre}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Bienvenido a tu portal de legajo digital. Aquí puedes descargar tus recibos de sueldo.</p>
          </div>
        </div>
      </div>

      {/* Grid of info and receipts */}
      <div className="dashboard-charts-layout">
        
        {/* Profile details */}
        <div className="glass-card" style={{ flex: '1 1 300px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} className="gradient-text" />
            <span>Datos de mi Legajo</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div className="profile-field">
              <span className="profile-label">CUIL / Identificación:</span>
              <span className="profile-val">{activeEmployee?.cuil}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Puesto o Categoría:</span>
              <span className="profile-val">{activeEmployee?.puesto}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Departamento:</span>
              <span className="profile-val">{activeEmployee?.departamento}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Fecha de Ingreso:</span>
              <span className="profile-val">{activeEmployee?.fechaIngreso}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Obra Social asignada:</span>
              <span className="profile-val">{activeEmployee?.obraSocial}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">CBU Cuenta Sueldo:</span>
              <span className="profile-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{activeEmployee?.cbu || 'No Informado'}</span>
            </div>
          </div>
        </div>

        {/* My paycheck slips history */}
        <div className="glass-card" style={{ flex: '2 1 500px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={18} className="gradient-text" />
            <span>Mis Recibos Disponibles</span>
          </h3>

          {employeeReceipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes recibos de sueldo liquidados en el sistema.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Tipo</th>
                    <th>Monto Neto</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeReceipts.map(liq => (
                    <tr key={liq.id}>
                      <td style={{ fontWeight: 600 }}>{liq.periodo}</td>
                      <td><span className="badge badge-success">{liq.tipo}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(liq.neto)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.25rem' }}
                          onClick={() => setSelectedReceipt(liq)}
                        >
                          <Eye size={14} /> Ver Recibo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Paycheck Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop receipt-modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: '850px', width: '100%', padding: '0', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass-hover)' }}>
            
            {/* Modal Controls */}
            <div className="modal-header-control" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Mi Recibo de Sueldo</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
                  Imprimir / Descargar PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
                  Cerrar
                </button>
              </div>
            </div>

            {/* Printable Receipt Area */}
            <div className="receipt-scrollable-container" style={{ padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
              <div className="printable-receipt receipt-paper">
                
                {/* Header Grid */}
                <div className="receipt-grid-header">
                  <div className="receipt-box-cell cell-left">
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>SPECTRA ARGENTINA S.A.</div>
                    <div className="receipt-text-sm">Domicilio: Av. del Libertador 4200, CABA</div>
                    <div className="receipt-text-sm">C.U.I.T.: 30-71489213-4</div>
                    <div className="receipt-text-sm">Actividad: Servicios de Software</div>
                  </div>
                  
                  <div className="receipt-box-cell cell-right" style={{ borderLeft: '1px solid #94a3b8' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', textTransform: 'uppercase' }}>Recibo de Haberes</div>
                    <div className="receipt-text-sm"><strong>Recibo N°:</strong> {selectedReceipt.id}</div>
                    <div className="receipt-text-sm"><strong>Período Liquidado:</strong> {selectedReceipt.periodo}</div>
                    <div className="receipt-text-sm"><strong>Tipo:</strong> {selectedReceipt.tipo}</div>
                    <div className="receipt-text-sm"><strong>Fecha Pago:</strong> {selectedReceipt.fechaLiquidacion}</div>
                  </div>
                </div>

                {/* Employee Details Grid */}
                <table className="receipt-employee-table">
                  <thead>
                    <tr>
                      <th>Apellido y Nombre</th>
                      <th>C.U.I.L.</th>
                      <th>Fecha Ingreso</th>
                      <th>Puesto / Categoría</th>
                      <th>C.B.U. / Banco</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{selectedReceipt.empleadoNombre}</strong></td>
                      <td>{selectedReceipt.empleadoCuil}</td>
                      <td>{activeEmployee?.fechaIngreso}</td>
                      <td>{selectedReceipt.empleadoPuesto}</td>
                      <td>{selectedReceipt.empleadoCbu || 'No Informado'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Concepts Breakdown Table */}
                <table className="receipt-concepts-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Cód</th>
                      <th style={{ width: '50%' }}>Concepto</th>
                      <th style={{ width: '13%', textAlign: 'right' }}>Remunerativo</th>
                      <th style={{ width: '13%', textAlign: 'right' }}>No Remun.</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Deducciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.conceptos.map((concept: any) => (
                      <tr key={concept.codigo}>
                        <td>{concept.codigo}</td>
                        <td>
                          {concept.descripcion}
                          {concept.cantidad && ` (${concept.cantidad} ${concept.unidades})`}
                          {concept.porcentaje && ` (${concept.porcentaje}%)`}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {concept.tipo === 'remunerativo' && concept.importe > 0 ? formatCurrency(concept.importe) : ''}
                          {concept.tipo === 'remunerativo' && concept.importe < 0 ? `(${formatCurrency(Math.abs(concept.importe))})` : ''}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {concept.tipo === 'no_remunerativo' ? formatCurrency(concept.importe) : ''}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {concept.tipo === 'deduccion' ? formatCurrency(concept.importe) : ''}
                        </td>
                      </tr>
                    ))}
                    {/* Fill blank spaces to keep receipt layout looking realistic */}
                    {Array.from({ length: Math.max(1, 8 - selectedReceipt.conceptos.length) }).map((_, i) => (
                      <tr key={`blank-${i}`} className="blank-row">
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="receipt-totals-grid">
                  <div className="totals-column">
                    <span className="totals-label">Total Remunerativo:</span>
                    <span className="totals-value">{formatCurrency(selectedReceipt.totalRemunerativo)}</span>
                  </div>
                  <div className="totals-column">
                    <span className="totals-label">Total No Remun.:</span>
                    <span className="totals-value">{formatCurrency(selectedReceipt.totalNoRemunerativo)}</span>
                  </div>
                  <div className="totals-column">
                    <span className="totals-label">Total Deducciones:</span>
                    <span className="totals-value" style={{ color: '#dc2626' }}>-{formatCurrency(selectedReceipt.totalDeducciones)}</span>
                  </div>
                  <div className="totals-column net-total-box">
                    <span className="totals-label" style={{ fontWeight: 800 }}>Neto Percibido:</span>
                    <span className="totals-value" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(selectedReceipt.neto)}
                    </span>
                  </div>
                </div>

                {/* Text Amount */}
                <div className="receipt-text-amount">
                  <strong>Monto en letras:</strong> {numeroALetras(selectedReceipt.neto)}
                </div>

                {/* Signatures */}
                <div className="receipt-signatures">
                  <div className="signature-box">
                    <div style={{ height: '45px' }} />
                    <div className="signature-line">Firma Empleador</div>
                  </div>
                  <div className="signature-box">
                    <div style={{ height: '45px' }} />
                    <div className="signature-line">Firma Empleado</div>
                  </div>
                </div>

                {/* Legal compliance text */}
                <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b', marginTop: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                  El empleado declara haber recibido el importe de este recibo sin reserva alguna. Duplicado para la Empresa / Ley 20.744.
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .portal-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass-hover);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-field {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-glass);
        }

        .profile-label {
          color: var(--text-secondary);
        }

        .profile-val {
          fontWeight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};
export default Portal;
