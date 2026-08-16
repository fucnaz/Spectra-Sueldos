import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { numeroALetras } from '../utils/calculadora';
import type { Liquidacion } from '../utils/calculadora';
import { 
  Play, 
  Trash2, 
  Printer, 
  X, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const Liquidaciones: React.FC = () => {
  const { 
    empleados, 
    liquidaciones, 
    periodoActivo, 
    ejecutarLiquidacion, 
    eliminarLiquidacion 
  } = useApp();

  const [liqTipo, setLiqTipo] = useState<Liquidacion['tipo']>('Mensual');
  const [selectedReceipt, setSelectedReceipt] = useState<Liquidacion | null>(null);

  // Catch custom event to open a specific receipt (from Dashboard link)
  useEffect(() => {
    const handleOpenReceipt = (e: Event) => {
      const liqId = (e as CustomEvent).detail;
      const found = liquidaciones.find(l => l.id === liqId);
      if (found) setSelectedReceipt(found);
    };

    window.addEventListener('open-receipt', handleOpenReceipt);
    return () => {
      window.removeEventListener('open-receipt', handleOpenReceipt);
    };
  }, [liquidaciones]);

  const activeLiqs = liquidaciones.filter(l => l.periodo === periodoActivo);
  const activeEmployees = empleados.filter(e => e.estado === 'Activo');
  
  // Find employees that haven't been liquidated yet for this period and type
  const pendingEmployees = activeEmployees.filter(emp => {
    return !activeLiqs.some(liq => liq.empleadoId === emp.id && liq.tipo === liqTipo);
  });

  const handleRun = () => {
    if (pendingEmployees.length === 0) {
      return alert(`Todos los empleados activos ya están liquidados para el tipo "${liqTipo}" en el período ${periodoActivo}.`);
    }
    
    ejecutarLiquidacion(liqTipo);
    alert(`Se procesaron con éxito ${pendingEmployees.length} recibos.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title block */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Liquidación de Sueldos</h1>
        <p>Procesa y genera recibos oficiales bajo el marco legal argentino (Ley 20.744).</p>
      </div>

      {/* Control panel & trigger */}
      <div className="dashboard-charts-layout">
        
        {/* Trigger form */}
        <div className="glass-card" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Correr Nueva Liquidación</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Calcula de forma automática los haberes básicos, antigüedades, adicionales y retenciones de ley.</p>
            
            <div className="form-group">
              <label>Tipo de Liquidación</label>
              <select 
                className="form-input" 
                value={liqTipo} 
                onChange={e => setLiqTipo(e.target.value as Liquidacion['tipo'])}
              >
                <option value="Mensual">Mensual (Haberes generales)</option>
                <option value="1º Quincena">1º Quincena (Anticipo jornal/mensual)</option>
                <option value="2º Quincena">2º Quincena (Fin de mes jornal)</option>
                <option value="SAC 1º Semestre">SAC 1º Semestre (Aguinaldo Junio)</option>
                <option value="SAC 2º Semestre">SAC 2º Semestre (Aguinaldo Diciembre)</option>
                <option value="Vacaciones">Vacaciones (Cómputo /25 días)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              <span>Periodo activo: <strong>{periodoActivo}</strong></span>
              <span>A liquidar: <strong>{pendingEmployees.length} legajos</strong></span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', gap: '0.5rem' }} 
              onClick={handleRun}
              disabled={pendingEmployees.length === 0}
            >
              <Play size={16} /> Procesar {pendingEmployees.length} Recibos
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="glass-card" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Estado de la Nómina ({periodoActivo})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Personal en Planta:</span>
              <span style={{ fontWeight: 600 }}>{activeEmployees.length} empleados</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Recibos Generados:</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{activeLiqs.length} procesados</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Faltantes de Liquidar:</span>
              <span style={{ fontWeight: 600, color: pendingEmployees.length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {pendingEmployees.length > 0 ? `${pendingEmployees.length} pendientes` : 'Ninguno (Nómina al día) ✓'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', marginTop: 'auto' }}>
            <FileCheck size={18} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 500 }}>Firma digital Spectra activa y autorizada</span>
          </div>
        </div>
      </div>

      {/* List of liquidations */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Historial del Período Activo</h3>

        {activeLiqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No se encontraron recibos generados en {periodoActivo}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código Recibo</th>
                  <th>Empleado</th>
                  <th>Tipo Liquidación</th>
                  <th>Remunerativos</th>
                  <th>Deducciones</th>
                  <th>Neto Percibido</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeLiqs.map(liq => (
                  <tr key={liq.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{liq.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{liq.empleadoNombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUIL: {liq.empleadoCuil}</div>
                    </td>
                    <td><span className="badge badge-success">{liq.tipo}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(liq.totalRemunerativo)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>-{formatCurrency(liq.totalDeducciones)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{formatCurrency(liq.neto)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => setSelectedReceipt(liq)}
                        >
                          Ver Recibo
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          onClick={() => {
                            if (confirm('¿Eliminar esta liquidación? Deberás recalcularla.')) {
                              eliminarLiquidacion(liq.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paycheck Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop receipt-modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: '850px', width: '100%', padding: '0', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass-hover)' }}>
            
            {/* Modal Controls */}
            <div className="modal-header-control" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Detalle de Recibo de Sueldo</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
                  <X size={18} />
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
                      <td>{empleados.find(e => e.id === selectedReceipt.empleadoId)?.fechaIngreso}</td>
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
                    {selectedReceipt.conceptos.map(concept => (
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
        .receipt-modal-backdrop {
          z-index: 300;
        }

        /* Printable Receipt Layout Design (Light weight clean Paper aesthetic) */
        .receipt-paper {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #94a3b8;
          border-radius: 4px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-family: 'Inter', sans-serif;
          line-height: 1.3;
          width: 100%;
        }

        .receipt-grid-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #94a3b8;
          border-radius: 3px;
          margin-bottom: 1rem;
        }

        .receipt-box-cell {
          padding: 0.75rem;
        }

        .receipt-text-sm {
          font-size: 0.75rem;
          color: #475569;
          margin-top: 0.15rem;
        }

        .receipt-employee-table, .receipt-concepts-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.8rem;
        }

        .receipt-employee-table th, .receipt-concepts-table th {
          background: #f1f5f9;
          border: 1px solid #94a3b8;
          padding: 0.5rem;
          font-weight: 700;
          color: #334155;
          text-align: left;
        }

        .receipt-employee-table td, .receipt-concepts-table td {
          border: 1px solid #94a3b8;
          padding: 0.5rem;
        }

        .receipt-concepts-table tbody tr.blank-row td {
          border-top: none;
          border-bottom: none;
          color: transparent;
        }

        .receipt-concepts-table tbody tr:last-child td {
          border-bottom: 1px solid #94a3b8;
        }

        .receipt-totals-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid #94a3b8;
          border-radius: 3px;
          margin-bottom: 0.75rem;
        }

        .totals-column {
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          border-right: 1px solid #94a3b8;
          font-size: 0.8rem;
        }

        .totals-column:last-child {
          border-right: none;
        }

        .net-total-box {
          background: #f1f5f9;
        }

        .totals-label {
          font-size: 0.7rem;
          color: #475569;
          text-transform: uppercase;
          font-weight: 600;
        }

        .totals-value {
          font-weight: 700;
          margin-top: 0.15rem;
          font-family: var(--font-mono);
        }

        .receipt-text-amount {
          font-size: 0.8rem;
          border: 1px solid #94a3b8;
          padding: 0.5rem;
          border-radius: 3px;
          margin-bottom: 1rem;
        }

        .receipt-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .signature-box {
          text-align: center;
          font-size: 0.75rem;
          color: #475569;
        }

        .signature-line {
          border-top: 1px solid #94a3b8;
          padding-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};
export default Liquidaciones;
