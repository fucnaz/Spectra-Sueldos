import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, ShieldAlert, Percent, Info, DollarSign } from 'lucide-react';
import type { Convenio } from '../utils/calculadora';

export const Configuracion: React.FC = () => {
  const { convenios, actualizarConvenio } = useApp();
  const [selectedCctId, setSelectedCctId] = useState<string>('cct-comercio');
  
  // Local state for editing percentages of the selected convenio
  const selectedCct = convenios.find(c => c.id === selectedCctId) || convenios[0];
  
  const [jubilacion, setJubilacion] = useState<number>(selectedCct.jubilacion);
  const [obraSocial, setObraSocial] = useState<number>(selectedCct.obraSocial);
  const [ley19032, setLey19032] = useState<number>(selectedCct.ley19032);
  const [cuotaSindical, setCuotaSindical] = useState<number>(selectedCct.cuotaSindical);
  
  const [simuladoBasico, setSimuladoBasico] = useState<number>(600000);
  const [simuladoAportaSindical, setSimuladoAportaSindical] = useState<boolean>(selectedCctId !== 'cct-fuera');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state when selecting a different convenio
  const handleSelectCct = (id: string) => {
    setSelectedCctId(id);
    const target = convenios.find(c => c.id === id);
    if (target) {
      setJubilacion(target.jubilacion);
      setObraSocial(target.obraSocial);
      setLey19032(target.ley19032);
      setCuotaSindical(target.cuotaSindical);
      setSimuladoAportaSindical(id !== 'cct-fuera');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Convenio = {
      ...selectedCct,
      jubilacion,
      obraSocial,
      ley19032,
      cuotaSindical
    };
    actualizarConvenio(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Calculations for simulator
  const impJubilacion = simuladoBasico * (jubilacion / 100);
  const impObraSocial = simuladoBasico * (obraSocial / 100);
  const impLey19032 = simuladoBasico * (ley19032 / 100);
  const impCuotaSindical = simuladoAportaSindical && selectedCctId !== 'cct-fuera' 
    ? simuladoBasico * (cuotaSindical / 100) 
    : 0;
  
  const totalDeducciones = impJubilacion + impObraSocial + impLey19032 + impCuotaSindical;
  const sueldoNeto = simuladoBasico - totalDeducciones;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Configuración del Sistema</h1>
        <p>Ajusta los porcentajes de deducciones de ley para los distintos convenios colectivos de trabajo de Argentina.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Side: Convenio Selection & Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CCT Quick Selector Cards */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} className="gradient-text" /> Seleccionar Convenio
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {convenios.map(c => {
                const isSelected = c.id === selectedCctId;
                return (
                  <div 
                    key={c.id}
                    onClick={() => handleSelectCct(c.id)}
                    className={`cct-select-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: isSelected ? 'white' : 'var(--text-primary)' }}>
                        {c.nombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.codigoCCT !== '-' ? `CCT N° ${c.codigoCCT}` : 'Regimen General Ley Contrato de Trabajo'}
                      </div>
                    </div>
                    {isSelected && <span className="active-dot"></span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deductions Editor Form */}
          <form onSubmit={handleSave} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Percent size={20} className="gradient-text" /> Alícuotas de Descuento: <span style={{ color: 'var(--accent-cyan)' }}>{selectedCct.nombre}</span>
            </h3>

            {saveSuccess && (
              <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} /> ¡Porcentajes actualizados exitosamente!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="slider-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <label style={{ fontWeight: 500 }}>Jubilación (Aporte SIPA)</label>
                  <span className="badge badge-info">{jubilacion}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="0.5" 
                  value={jubilacion} 
                  onChange={e => setJubilacion(Number(e.target.value))} 
                  className="cct-slider"
                />
              </div>

              <div className="slider-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <label style={{ fontWeight: 500 }}>Obra Social</label>
                  <span className="badge badge-info">{obraSocial}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={obraSocial} 
                  onChange={e => setObraSocial(Number(e.target.value))} 
                  className="cct-slider"
                />
              </div>

              <div className="slider-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <label style={{ fontWeight: 500 }}>Ley 19.032 - INSSJP</label>
                  <span className="badge badge-info">{ley19032}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={ley19032} 
                  onChange={e => setLey19032(Number(e.target.value))} 
                  className="cct-slider"
                />
              </div>

              <div className="slider-group" style={{ opacity: selectedCctId === 'cct-fuera' ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <label style={{ fontWeight: 500 }}>Cuota Sindical / Aporte Gremial</label>
                  <span className="badge badge-info">{cuotaSindical}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={cuotaSindical} 
                  onChange={e => setCuotaSindical(Number(e.target.value))} 
                  disabled={selectedCctId === 'cct-fuera'}
                  className="cct-slider"
                />
                {selectedCctId === 'cct-fuera' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    * El regimen fuera de convenio no incluye aportes gremiales.
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                <Save size={18} /> Guardar Configuración CCT
              </button>

            </div>
          </form>

        </div>

        {/* Right Side: Interactive Live Impact Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', background: 'linear-gradient(145deg, rgba(19, 26, 45, 0.8), rgba(99, 102, 241, 0.05))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} className="gradient-text" /> Simulador de Impacto en Neto
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Observa en tiempo real cómo afectan los porcentajes al sueldo final de bolsillo del trabajador.
            </p>

            {/* Input Basico */}
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sueldo Básico de Simulación (ARS)</label>
              <input 
                type="number" 
                value={simuladoBasico} 
                onChange={e => setSimuladoBasico(Number(e.target.value))}
                className="form-input" 
                style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            {/* Checkbox Aporta Sindical */}
            {selectedCctId !== 'cct-fuera' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="simuladoAportaSindical"
                  checked={simuladoAportaSindical} 
                  onChange={e => setSimuladoAportaSindical(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="simuladoAportaSindical" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Simular afiliación gremial (descontar cuota sindical)
                </label>
              </div>
            )}

            {/* Breakdown Visualizer */}
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-glass)' }}>
                <span>Sueldo Bruto</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(simuladoBasico)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Jubilación ({jubilacion}%)</span>
                  <span>- {formatCurrency(impJubilacion)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Obra Social ({obraSocial}%)</span>
                  <span>- {formatCurrency(impObraSocial)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Ley 19.032 ({ley19032}%)</span>
                  <span>- {formatCurrency(impLey19032)}</span>
                </div>
                {simuladoAportaSindical && selectedCctId !== 'cct-fuera' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Cuota Gremial ({cuotaSindical}%)</span>
                    <span>- {formatCurrency(impCuotaSindical)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-glass)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>Total Deducciones ({((totalDeducciones / simuladoBasico) * 100 || 0).toFixed(1)}%)</span>
                <span>- {formatCurrency(totalDeducciones)}</span>
              </div>
            </div>

            {/* Final Neto Card */}
            <div className="neto-total-card">
              <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>Sueldo Neto de Bolsillo (Simulado)</span>
              <span className="neto-amount gradient-text">{formatCurrency(sueldoNeto)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginTop: 'auto' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Recuerda que estas modificaciones se aplicarán a todas las nuevas liquidaciones generadas a partir de este momento.
              </span>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        .cct-select-card {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .cct-select-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--border-glass-hover);
        }

        .cct-select-card.selected {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.08));
          border-color: var(--accent-indigo);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent-cyan);
          box-shadow: 0 0 8px var(--accent-cyan);
        }

        .slider-group {
          display: flex;
          flex-direction: column;
        }

        .cct-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-tertiary);
          outline: none;
          margin: 0.5rem 0;
        }

        .cct-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent-cyan);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
          transition: transform 0.1s ease;
        }

        .cct-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .neto-total-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass-hover);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-align: center;
        }

        .neto-amount {
          font-size: 2.2rem;
          font-weight: 800;
          font-family: var(--font-sans);
          letter-spacing: -1px;
        }
      `}</style>
    </div>
  );
};
export default Configuracion;
