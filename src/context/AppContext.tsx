import React, { createContext, useContext, useState, useEffect } from 'react';
import { calcularLiquidacion } from '../utils/calculadora';
import type { Empleado, Novedad, Liquidacion, Convenio } from '../utils/calculadora';

interface AppContextType {
  empleados: Empleado[];
  novedades: Novedad[];
  liquidaciones: Liquidacion[];
  convenios: Convenio[];
  currentView: 'dashboard' | 'empleados' | 'novedades' | 'liquidaciones' | 'portal' | 'configuracion';
  periodoActivo: string;
  portalEmpleadoId: string | null;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrentView: (view: 'dashboard' | 'empleados' | 'novedades' | 'liquidaciones' | 'portal' | 'configuracion') => void;
  setPeriodoActivo: (periodo: string) => void;
  setPortalEmpleadoId: (id: string | null) => void;
  
  // Actions
  agregarEmpleado: (emp: Omit<Empleado, 'id' | 'estado'>) => void;
  editarEmpleado: (emp: Empleado) => void;
  bajaEmpleado: (id: string) => void;
  guardarNovedad: (nov: Novedad) => void;
  ejecutarLiquidacion: (tipo: Liquidacion['tipo']) => void;
  eliminarLiquidacion: (id: string) => void;
  actualizarConvenio: (conv: Convenio) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
// Initial Mock Data
const MOCK_CONVENIOS: Convenio[] = [
  { id: 'cct-fuera', nombre: 'Fuera de Convenio', codigoCCT: '-', jubilacion: 11, obraSocial: 3, ley19032: 3, cuotaSindical: 0 },
  { id: 'cct-comercio', nombre: 'Comercio (SEC)', codigoCCT: '130/75', jubilacion: 11, obraSocial: 3, ley19032: 3, cuotaSindical: 2 },
  { id: 'cct-uom', nombre: 'Metalúrgicos (UOM)', codigoCCT: '260/75', jubilacion: 11, obraSocial: 3, ley19032: 3, cuotaSindical: 2.5 },
  { id: 'cct-uthgra', nombre: 'Gastronómicos (UTHGRA)', codigoCCT: '389/04', jubilacion: 11, obraSocial: 3, ley19032: 3, cuotaSindical: 2.5 }
];

const MOCK_EMPLEADOS: Empleado[] = [
  {
    id: 'emp-1',
    nombre: 'Juan Carlos Pérez',
    cuil: '20-35492812-9',
    puesto: 'Desarrollador Senior',
    departamento: 'Tecnología',
    fechaIngreso: '2019-03-15',
    sueldoBasico: 850000,
    tipoRemuneracion: 'Mensual',
    obraSocial: 'OSDE 210',
    sindicato: true,
    sindicatoNombre: 'SEC (Comercio)',
    convenioId: 'cct-comercio',
    cbu: '0070001220000001234567',
    estado: 'Activo'
  },
  {
    id: 'emp-2',
    nombre: 'María Luz González',
    cuil: '27-40291349-4',
    puesto: 'Diseñadora UX/UI',
    departamento: 'Diseño',
    fechaIngreso: '2022-08-01',
    sueldoBasico: 720000,
    tipoRemuneracion: 'Mensual',
    obraSocial: 'OSECAC',
    sindicato: false,
    sindicatoNombre: '',
    convenioId: 'cct-fuera',
    cbu: '0110002330000009876543',
    estado: 'Activo'
  },
  {
    id: 'emp-3',
    nombre: 'Carlos Daniel Rodríguez',
    cuil: '20-28341952-3',
    puesto: 'Gerente de Proyectos',
    departamento: 'Operaciones',
    fechaIngreso: '2015-06-10',
    sueldoBasico: 1450000,
    tipoRemuneracion: 'Mensual',
    obraSocial: 'OSDE 310',
    sindicato: false,
    sindicatoNombre: '',
    convenioId: 'cct-fuera',
    cbu: '1910003440000004567890',
    estado: 'Activo'
  },
  {
    id: 'emp-4',
    nombre: 'Sofía Belén Herrera',
    cuil: '27-43890213-5',
    puesto: 'Analista de QA',
    departamento: 'Tecnología',
    fechaIngreso: '2023-11-15',
    sueldoBasico: 580000,
    tipoRemuneracion: 'Mensual',
    obraSocial: 'OSECAC',
    sindicato: true,
    sindicatoNombre: 'SEC (Comercio)',
    convenioId: 'cct-comercio',
    cbu: '0070001220000004445556',
    estado: 'Activo'
  }
];

const MOCK_NOVEDADES: Novedad[] = [
  { empleadoId: 'emp-1', periodo: '2026-08', horasExtras50: 10, horasExtras100: 4, inasistencias: 0, bonoNoRemunerativo: 50000, bonoRemunerativo: 0 },
  { empleadoId: 'emp-2', periodo: '2026-08', horasExtras50: 0, horasExtras100: 0, inasistencias: 1, bonoNoRemunerativo: 0, bonoRemunerativo: 20000 },
  { empleadoId: 'emp-3', periodo: '2026-08', horasExtras50: 0, horasExtras100: 0, inasistencias: 0, bonoNoRemunerativo: 100000, bonoRemunerativo: 0 },
  { empleadoId: 'emp-4', periodo: '2026-08', horasExtras50: 5, horasExtras100: 0, inasistencias: 0, bonoNoRemunerativo: 30000, bonoRemunerativo: 0 }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [currentView, setCurrentView] = useState<AppContextType['currentView']>('dashboard');
  const [periodoActivo, setPeriodoActivo] = useState<string>('2026-08');
  const [portalEmpleadoId, setPortalEmpleadoId] = useState<string | null>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  // Initialize and load from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('spectra_theme') as 'dark' | 'light';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.body.className = savedTheme === 'light' ? 'light-theme' : '';
    }

    const savedEmpleados = localStorage.getItem('spectra_empleados');
    const savedNovedades = localStorage.getItem('spectra_novedades');
    const savedLiquidaciones = localStorage.getItem('spectra_liquidaciones');
    const savedConvenios = localStorage.getItem('spectra_convenios');

    let currentConvenios = MOCK_CONVENIOS;
    if (savedConvenios) {
      currentConvenios = JSON.parse(savedConvenios);
      setConvenios(currentConvenios);
    } else {
      setConvenios(MOCK_CONVENIOS);
      localStorage.setItem('spectra_convenios', JSON.stringify(MOCK_CONVENIOS));
    }

    if (savedEmpleados && savedNovedades && savedLiquidaciones) {
      // Ensure existing employees have a convenioId mapped if not present
      const loadedEmps = JSON.parse(savedEmpleados).map((e: Empleado) => {
        if (!e.convenioId) {
          if (e.sindicato && e.sindicatoNombre?.toLowerCase().includes('uom')) {
            e.convenioId = 'cct-uom';
          } else if (e.sindicato && (e.sindicatoNombre?.toLowerCase().includes('sec') || e.sindicatoNombre?.toLowerCase().includes('comercio'))) {
            e.convenioId = 'cct-comercio';
          } else if (e.sindicato && (e.sindicatoNombre?.toLowerCase().includes('uthgra') || e.sindicatoNombre?.toLowerCase().includes('gastro'))) {
            e.convenioId = 'cct-uthgra';
          } else {
            e.convenioId = 'cct-fuera';
          }
        }
        return e;
      });
      setEmpleados(loadedEmps);
      setNovedades(JSON.parse(savedNovedades));
      setLiquidaciones(JSON.parse(savedLiquidaciones));
    } else {
      // Use defaults
      setEmpleados(MOCK_EMPLEADOS);
      setNovedades(MOCK_NOVEDADES);
      
      // Pre-calculate past liquidations for the previous month (July 2026) for beautiful demo metrics
      const pastLiqs = MOCK_EMPLEADOS.map(emp => {
        const mockNov: Novedad = {
          empleadoId: emp.id,
          periodo: '2026-07',
          horasExtras50: emp.id === 'emp-1' ? 8 : 0,
          horasExtras100: 0,
          inasistencias: 0,
          bonoNoRemunerativo: 40000,
          bonoRemunerativo: 0
        };
        return calcularLiquidacion(emp, mockNov, '2026-07', 'Mensual', currentConvenios);
      });
      setLiquidaciones(pastLiqs);

      localStorage.setItem('spectra_empleados', JSON.stringify(MOCK_EMPLEADOS));
      localStorage.setItem('spectra_novedades', JSON.stringify(MOCK_NOVEDADES));
      localStorage.setItem('spectra_liquidaciones', JSON.stringify(pastLiqs));
    }
  }, []);

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('spectra_theme', t);
    document.body.className = t === 'light' ? 'light-theme' : '';
  };

  // Sync state changes with localStorage
  const saveToLocal = (newEmp: Empleado[], newNov: Novedad[], newLiqs: Liquidacion[], newConvs: Convenio[] = convenios) => {
    setEmpleados(newEmp);
    setNovedades(newNov);
    setLiquidaciones(newLiqs);
    setConvenios(newConvs);
    localStorage.setItem('spectra_empleados', JSON.stringify(newEmp));
    localStorage.setItem('spectra_novedades', JSON.stringify(newNov));
    localStorage.setItem('spectra_liquidaciones', JSON.stringify(newLiqs));
    localStorage.setItem('spectra_convenios', JSON.stringify(newConvs));
  };

  const agregarEmpleado = (empData: Omit<Empleado, 'id' | 'estado'>) => {
    const newEmp: Empleado = {
      ...empData,
      id: `emp-${Date.now()}`,
      estado: 'Activo'
    };
    saveToLocal([...empleados, newEmp], novedades, liquidaciones);
  };

  const editarEmpleado = (emp: Empleado) => {
    const updated = empleados.map(e => e.id === emp.id ? emp : e);
    saveToLocal(updated, novedades, liquidaciones);
  };

  const bajaEmpleado = (id: string) => {
    const updated = empleados.map(e => e.id === id ? { ...e, estado: 'Baja' as const } : e);
    saveToLocal(updated, novedades, liquidaciones);
  };

  const guardarNovedad = (nov: Novedad) => {
    const index = novedades.findIndex(n => n.empleadoId === nov.empleadoId && n.periodo === nov.periodo);
    let updatedNovedades = [...novedades];
    if (index >= 0) {
      updatedNovedades[index] = nov;
    } else {
      updatedNovedades.push(nov);
    }
    saveToLocal(empleados, updatedNovedades, liquidaciones);
  };

  const ejecutarLiquidacion = (tipo: Liquidacion['tipo']) => {
    // Liquidate active employees who haven't been liquidated yet for this active period
    const activeEmployees = empleados.filter(e => e.estado === 'Activo');
    
    // Filter out already liquidated ones for this period & type
    const existingIds = new Set(
      liquidaciones
        .filter(l => l.periodo === periodoActivo && l.tipo === tipo)
        .map(l => l.empleadoId)
    );

    const targetEmployees = activeEmployees.filter(e => !existingIds.has(e.id));
    if (targetEmployees.length === 0) return;

    const newLiqs = targetEmployees.map(emp => {
      const empNov = novedades.find(n => n.empleadoId === emp.id && n.periodo === periodoActivo);
      return calcularLiquidacion(emp, empNov, periodoActivo, tipo, convenios);
    });

    saveToLocal(empleados, novedades, [...liquidaciones, ...newLiqs]);
  };

  const eliminarLiquidacion = (id: string) => {
    const updated = liquidaciones.filter(l => l.id !== id);
    saveToLocal(empleados, novedades, updated);
  };

  const actualizarConvenio = (conv: Convenio) => {
    const updated = convenios.map(c => c.id === conv.id ? conv : c);
    saveToLocal(empleados, novedades, liquidaciones, updated);
  };

  const resetDemoData = () => {
    localStorage.removeItem('spectra_empleados');
    localStorage.removeItem('spectra_novedades');
    localStorage.removeItem('spectra_liquidaciones');
    localStorage.removeItem('spectra_convenios');
    
    setEmpleados(MOCK_EMPLEADOS);
    setNovedades(MOCK_NOVEDADES);
    setConvenios(MOCK_CONVENIOS);
    
    const pastLiqs = MOCK_EMPLEADOS.map(emp => {
      const mockNov: Novedad = {
        empleadoId: emp.id,
        periodo: '2026-07',
        horasExtras50: emp.id === 'emp-1' ? 8 : 0,
        horasExtras100: 0,
        inasistencias: 0,
        bonoNoRemunerativo: 40000,
        bonoRemunerativo: 0
      };
      return calcularLiquidacion(emp, mockNov, '2026-07', 'Mensual', MOCK_CONVENIOS);
    });
    
    setLiquidaciones(pastLiqs);
    localStorage.setItem('spectra_empleados', JSON.stringify(MOCK_EMPLEADOS));
    localStorage.setItem('spectra_novedades', JSON.stringify(MOCK_NOVEDADES));
    localStorage.setItem('spectra_liquidaciones', JSON.stringify(pastLiqs));
    localStorage.setItem('spectra_convenios', JSON.stringify(MOCK_CONVENIOS));
  };

  return (
    <AppContext.Provider value={{
      empleados,
      novedades,
      liquidaciones,
      convenios,
      currentView,
      periodoActivo,
      portalEmpleadoId,
      theme,
      setTheme,
      setCurrentView,
      setPeriodoActivo,
      setPortalEmpleadoId,
      agregarEmpleado,
      editarEmpleado,
      bajaEmpleado,
      guardarNovedad,
      ejecutarLiquidacion,
      eliminarLiquidacion,
      actualizarConvenio,
      resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
