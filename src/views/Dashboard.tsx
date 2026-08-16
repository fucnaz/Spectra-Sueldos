import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  TrendingUp, 
  Percent, 
  DollarSign,
  ArrowRight,
  CalendarDays,
  FileText
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    empleados, 
    liquidaciones, 
    periodoActivo, 
    setPeriodoActivo, 
    setCurrentView,
    setPortalEmpleadoId
  } = useApp();

  // Find active period liquidations
  const activeLiqs = liquidaciones.filter(l => l.periodo === periodoActivo);
  
  // Calculate summary cards
  const activeEmployeesCount = empleados.filter(e => e.estado === 'Activo').length;
  
  const totalRemunerativo = activeLiqs.reduce((sum, l) => sum + l.totalRemunerativo, 0);
  const totalNoRemunerativo = activeLiqs.reduce((sum, l) => sum + l.totalNoRemunerativo, 0);
  const totalDeducciones = activeLiqs.reduce((sum, l) => sum + l.totalDeducciones, 0);
  const totalNeto = activeLiqs.reduce((sum, l) => sum + l.neto, 0);
  
  const costoTotalEmpleador = totalRemunerativo + totalNoRemunerativo; // simplifying cost

  // Department distribution
  const deptData: Record<string, { count: number, cost: number }> = {};
  empleados.forEach(emp => {
    if (emp.estado === 'Activo') {
      if (!deptData[emp.departamento]) {
        deptData[emp.departamento] = { count: 0, cost: 0 };
      }
      deptData[emp.departamento].count++;
      deptData[emp.departamento].cost += emp.sueldoBasico;
    }
  });

  const uniqueDepts = Object.keys(deptData);

  // Available periods for filtering
  const allPeriods = Array.from(new Set(liquidaciones.map(l => l.periodo).concat(periodoActivo))).sort().reverse();

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Resumen General</h1>
          <p>Supervisa los costos, legajos e históricos de liquidaciones.</p>
        </div>

        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarDays size={18} className="gradient-text" />
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Período Activo:</label>
          <select 
            value={periodoActivo} 
            onChange={(e) => setPeriodoActivo(e.target.value)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontWeight: 700, 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {allPeriods.map(p => (
              <option key={p} value={p} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{p}</option>
            ))}
            <option value="2026-09" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>2026-09</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Card 1: Empleados */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Empleados Activos</span>
            <span className="kpi-value">{activeEmployeesCount}</span>
            <span className="kpi-sub">{empleados.filter(e => e.estado === 'Baja').length} bajas históricas</span>
          </div>
        </div>

        {/* Card 2: Remuneraciones Brutas */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Sueldo Bruto Bruto</span>
            <span className="kpi-value">{formatCurrency(totalRemunerativo)}</span>
            <span className="kpi-sub">Adicionales: {formatCurrency(totalNoRemunerativo)}</span>
          </div>
        </div>

        {/* Card 3: Deducciones */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
            <Percent size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Retenciones/Aportes</span>
            <span className="kpi-value">{formatCurrency(totalDeducciones)}</span>
            <span className="kpi-sub">Jubilación, Obra Social, Sindicatos</span>
          </div>
        </div>

        {/* Card 4: Total Neto */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Monto Neto a Pagar</span>
            <span className="kpi-value">{formatCurrency(totalNeto)}</span>
            <span className="kpi-sub">Costo de nómina: {formatCurrency(costoTotalEmpleador)}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="dashboard-charts-layout">
        
        {/* Department Breakdown */}
        <div className="glass-card" style={{ flex: 1, minWidth: '320px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Distribución de Costo por Departamento</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {uniqueDepts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No hay empleados activos cargados.</p>
            ) : (
              uniqueDepts.map(dept => {
                const info = deptData[dept];
                const pct = totalRemunerativo > 0 ? (info.cost / totalRemunerativo) * 100 : 33;
                return (
                  <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept} ({info.count} emp.)</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(info.cost)}</span>
                    </div>
                    {/* Bar graph */}
                    <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))', 
                          width: `${Math.min(100, Math.max(8, pct))}%`,
                          borderRadius: '4px' 
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Demo Quick actions / info */}
        <div className="glass-card" style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Panel del Cliente (Simulaciones)</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Como cliente en modo demo, puedes realizar todas las operaciones y testear la agilidad de Spectra Sueldos.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="action-row" onClick={() => setCurrentView('liquidaciones')}>
                <div>
                  <div className="action-title">Correr una Liquidación</div>
                  <div className="action-desc">Calcula aportes, SAC o vacaciones para este mes.</div>
                </div>
                <ArrowRight size={18} className="action-arrow" />
              </div>

              <div className="action-row" onClick={() => setCurrentView('empleados')}>
                <div>
                  <div className="action-title">Agregar Nuevo Empleado</div>
                  <div className="action-desc">Define sueldo básico y afiliaciones del legajo.</div>
                </div>
                <ArrowRight size={18} className="action-arrow" />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Simular Acceso Empleado</h4>
            <select 
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  setPortalEmpleadoId(e.target.value);
                  setCurrentView('portal');
                }
              }}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-glass)',
                padding: '0.6rem',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Selecciona un empleado para ingresar como él...</option>
              {empleados.filter(e => e.estado === 'Activo').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.puesto})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recent Liquidations list */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Liquidaciones del Período Actual ({periodoActivo})</h3>
          {activeLiqs.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setCurrentView('liquidaciones')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Ver todas
            </button>
          )}
        </div>

        {activeLiqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Aún no se ha realizado ninguna liquidación en el período {periodoActivo}.</p>
            <button className="btn btn-primary" onClick={() => setCurrentView('liquidaciones')}>
              Comenzar Liquidación
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Puesto / Area</th>
                  <th>Tipo</th>
                  <th>Remunerativo</th>
                  <th>Deducciones</th>
                  <th>Monto Neto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {activeLiqs.map(liq => (
                  <tr key={liq.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{liq.empleadoNombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUIL: {liq.empleadoCuil}</div>
                    </td>
                    <td>{liq.empleadoPuesto}</td>
                    <td><span className="badge badge-success">{liq.tipo}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(liq.totalRemunerativo)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>-{formatCurrency(liq.totalDeducciones)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>{formatCurrency(liq.neto)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          // Jump to liquidations page with this specific receipt opened
                          setCurrentView('liquidaciones');
                          setTimeout(() => {
                            const event = new CustomEvent('open-receipt', { detail: liq.id });
                            window.dispatchEvent(event);
                          }, 100);
                        }}
                      >
                        Ver Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
        }

        .kpi-icon-container {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-details {
          display: flex;
          flex-direction: column;
        }

        .kpi-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          margin: 0.15rem 0;
          font-family: var(--font-mono);
        }

        .kpi-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dashboard-charts-layout {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .action-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-row:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--border-glass-hover);
          transform: translateX(4px);
        }

        .action-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .action-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .action-arrow {
          color: var(--text-muted);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .action-row:hover .action-arrow {
          color: var(--accent-cyan);
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
};
export default Dashboard;
