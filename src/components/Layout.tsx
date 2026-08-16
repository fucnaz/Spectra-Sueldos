import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Receipt, 
  UserCircle, 
  RotateCcw, 
  Sun, 
  Moon,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    currentView, 
    setCurrentView, 
    theme, 
    setTheme, 
    resetDemoData, 
    portalEmpleadoId,
    setPortalEmpleadoId,
    empleados
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeEmployee = empleados.find(e => e.id === portalEmpleadoId);

  const menuItems = portalEmpleadoId 
    ? [
        { id: 'portal' as const, label: 'Mi Legajo', icon: UserCircle },
      ]
    : [
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'empleados' as const, label: 'Legajos Empleados', icon: Users },
        { id: 'novedades' as const, label: 'Novedades/Horas', icon: FileSpreadsheet },
        { id: 'liquidaciones' as const, label: 'Liquidación', icon: Receipt },
      ];

  const handleNavClick = (view: typeof currentView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const handleExitPortal = () => {
    setPortalEmpleadoId(null);
    setCurrentView('dashboard');
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Header Bar */}
      <header className="glass-panel mobile-header">
        <div className="brand-logo" onClick={() => handleNavClick(portalEmpleadoId ? 'portal' : 'dashboard')}>
          <div className="logo-icon">S</div>
          <span className="logo-text">Spectra <span className="gradient-text">Sueldos</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="menu-burger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, width: '100%', position: 'relative' }}>
        
        {/* Sidebar Panel (Desktop & Mobile Nav) */}
        <aside className={`glass-panel sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Logo Section */}
          <div className="sidebar-brand">
            <div className="logo-icon">S</div>
            <span className="logo-text">Spectra <span className="gradient-text">Sueldos</span></span>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <div className="nav-group-title">{portalEmpleadoId ? 'Portal del Empleado' : 'Administración'}</div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="sidebar-footer">
            {portalEmpleadoId ? (
              <div className="user-badge glass-card" style={{ padding: '0.75rem', marginBottom: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <UserCircle size={28} className="gradient-text" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {activeEmployee?.nombre}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Empleado</div>
                  </div>
                </div>
                <button className="btn btn-danger" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} onClick={handleExitPortal}>
                  <LogOut size={14} /> Salir Portal
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={16} /> <span>Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon size={16} /> <span>Modo Oscuro</span>
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 0.8rem', fontSize: '0.85rem', color: '#f87171' }}
                  onClick={() => {
                    if (confirm('¿Restablecer todos los datos del demo a los iniciales?')) {
                      resetDemoData();
                      alert('Datos restablecidos.');
                    }
                  }}
                >
                  <RotateCcw size={16} /> <span>Reiniciar Demo</span>
                </button>
              </div>
            )}
            <div className="demo-badge">
              <span>Versión Demo Online</span>
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <main className="content-area">
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        /* Sidebar styles */
        .mobile-header {
          display: none;
          height: var(--header-height);
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-glass);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar {
          width: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-glass);
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 90;
        }

        .sidebar-brand, .brand-logo {
          height: var(--header-height);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.5rem;
          border-bottom: 1px solid var(--border-glass);
          cursor: pointer;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan));
          color: white;
          font-weight: 800;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }

        .logo-text {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #a5b4fc, var(--accent-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-group-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: var(--border-radius-sm);
          text-align: left;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-link.active {
          color: white;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.1));
          border: 1px solid var(--border-glass-hover);
        }

        .nav-icon {
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }

        .nav-link.active .nav-icon {
          color: var(--accent-cyan);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border-glass);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .demo-badge {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1));
          border: 1px solid var(--border-glass);
          padding: 0.4rem;
          border-radius: 6px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .content-area {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding: 2rem;
          min-height: 100vh;
          overflow-y: auto;
          display: flex;
          justify-content: center;
        }

        .content-container {
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Mobile specific styles */
        @media (max-width: 992px) {
          .mobile-header {
            display: flex;
          }

          .sidebar {
            top: var(--header-height);
            left: -100%;
            height: calc(100vh - var(--header-height));
            min-height: auto;
            width: 100%;
            transition: left 0.3s ease;
            background: var(--bg-primary);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          .sidebar.open {
            left: 0;
          }

          .sidebar-brand {
            display: none;
          }

          .content-area {
            margin-left: 0;
            padding: 1.5rem 1rem;
          }

          .theme-toggle-btn {
            background: var(--bg-tertiary);
            border: 1px solid var(--border-glass);
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
          }

          .menu-burger {
            background: var(--bg-tertiary);
            border: 1px solid var(--border-glass);
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
          }
        }
      `}</style>
    </div>
  );
};
