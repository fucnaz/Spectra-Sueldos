export interface Convenio {
  id: string;
  nombre: string;
  codigoCCT: string;
  jubilacion: number;
  obraSocial: number;
  ley19032: number;
  cuotaSindical: number;
}

export interface Empleado {
  id: string;
  nombre: string;
  cuil: string;
  puesto: string;
  departamento: string;
  fechaIngreso: string;
  sueldoBasico: number;
  tipoRemuneracion: 'Mensual' | 'Jornal';
  obraSocial: string;
  sindicato: boolean;
  sindicatoNombre: string;
  convenioId?: string;
  cbu: string;
  estado: 'Activo' | 'Baja';
}

export interface Novedad {
  empleadoId: string;
  periodo: string; // YYYY-MM
  horasExtras50: number;
  horasExtras100: number;
  inasistencias: number;
  bonoNoRemunerativo: number;
  bonoRemunerativo: number;
}

export interface ConceptoLiquidado {
  codigo: string;
  descripcion: string;
  cantidad?: number;
  unidades?: string;
  tipo: 'remunerativo' | 'no_remunerativo' | 'deduccion';
  porcentaje?: number;
  importe: number;
}

export interface Liquidacion {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoCuil: string;
  empleadoPuesto: string;
  empleadoCbu: string;
  periodo: string; // YYYY-MM
  tipo: 'Mensual' | '1º Quincena' | '2º Quincena' | 'SAC 1º Semestre' | 'SAC 2º Semestre' | 'Vacaciones';
  fechaLiquidacion: string;
  conceptos: ConceptoLiquidado[];
  totalRemunerativo: number;
  totalNoRemunerativo: number;
  totalDeducciones: number;
  neto: number;
}

// Convert numbers to Spanish text for receipts
export function numeroALetras(num: number): string {
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
    25: 'veinticinco', 26: 'veintiséis', 27: 'veintiséis', 28: 'veintiocho', 29: 'veintinueve'
  };
  const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const formatearParteEntera = (n: number): string => {
    if (n === 0) return 'cero';
    if (n < 10) return unidades[n];
    if (n in especiales) return (especiales as any)[n];
    if (n < 30) {
      if (n === 20) return 'veinte';
      return 'veinti' + unidades[n - 20];
    }
    if (n < 100) {
      const u = n % 10;
      const d = Math.floor(n / 10);
      return decenas[d] + (u > 0 ? ' y ' + unidades[u] : '');
    }
    if (n < 1000) {
      const rest = n % 100;
      const c = Math.floor(n / 100);
      if (n === 100) return 'cien';
      return (c === 1 ? 'ciento' : centenas[c]) + (rest > 0 ? ' ' + formatearParteEntera(rest) : '');
    }
    if (n < 1000000) {
      const rest = n % 1000;
      const miles = Math.floor(n / 1000);
      let milesStr = '';
      if (miles === 1) {
        milesStr = 'mil';
      } else {
        milesStr = formatearParteEntera(miles) + ' mil';
      }
      return milesStr + (rest > 0 ? ' ' + formatearParteEntera(rest) : '');
    }
    return n.toString(); // Default fallback
  };

  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const enteroStr = formatearParteEntera(entero);
  const centavosStr = centavos > 0 
    ? ` con ${centavos}/100 centavos` 
    : ' con 00/100 centavos';

  return (enteroStr.charAt(0).toUpperCase() + enteroStr.slice(1) + ' pesos' + centavosStr).trim();
}

// Calculate years of service
export function calcularAntiguedad(fechaIngresoStr: string): number {
  const ingreso = new Date(fechaIngresoStr);
  const hoy = new Date();
  let antiguedad = hoy.getFullYear() - ingreso.getFullYear();
  const m = hoy.getMonth() - ingreso.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < ingreso.getDate())) {
    antiguedad--;
  }
  return Math.max(0, antiguedad);
}

// Calculate pay slip for an employee
export function calcularLiquidacion(
  empleado: Empleado,
  novedad: Novedad | undefined,
  periodo: string,
  tipo: Liquidacion['tipo'],
  convenios?: Convenio[]
): Liquidacion {
  const conceptos: ConceptoLiquidado[] = [];
  const antiguedadAnios = calcularAntiguedad(empleado.fechaIngreso);
  
  let factorPeriodo = 1;

  if (tipo === '1º Quincena' || tipo === '2º Quincena') {
    factorPeriodo = 0.5;
  }

  // 1. Sueldo Básico
  let basicoImporte = empleado.sueldoBasico * factorPeriodo;
  if (tipo === 'SAC 1º Semestre' || tipo === 'SAC 2º Semestre') {
    // Aguinaldo (50% of the best salary, simplify to 50% of current base)
    basicoImporte = empleado.sueldoBasico * 0.5;
    conceptos.push({
      codigo: '150',
      descripcion: `Sueldo Anual Complementario (SAC)`,
      tipo: 'remunerativo',
      importe: parseFloat(basicoImporte.toFixed(2))
    });
  } else if (tipo === 'Vacaciones') {
    // Vacaciones se calcula básico / 25 * días (simplificamos a 14 días por defecto)
    const diasVacaciones = 14;
    basicoImporte = (empleado.sueldoBasico / 25) * diasVacaciones;
    conceptos.push({
      codigo: '140',
      descripcion: `Vacaciones Gozadas (${diasVacaciones} días)`,
      tipo: 'remunerativo',
      cantidad: diasVacaciones,
      unidades: 'días',
      importe: parseFloat(basicoImporte.toFixed(2))
    });
  } else {
    conceptos.push({
      codigo: '100',
      descripcion: tipo === 'Mensual' ? 'Sueldo Básico' : `${tipo} - Sueldo Proporcional`,
      tipo: 'remunerativo',
      importe: parseFloat(basicoImporte.toFixed(2))
    });
  }

  // Calculate base for seniority and attendance
  let baseCalculoConceptos = basicoImporte;

  // 2. Antigüedad (1% por año de servicio sobre básico)
  if (tipo !== 'SAC 1º Semestre' && tipo !== 'SAC 2º Semestre' && antiguedadAnios > 0) {
    const porcentajeAntiguedad = antiguedadAnios;
    const importeAntiguedad = baseCalculoConceptos * (porcentajeAntiguedad / 100);
    conceptos.push({
      codigo: '110',
      descripcion: `Antigüedad (${antiguedadAnios} años)`,
      tipo: 'remunerativo',
      porcentaje: porcentajeAntiguedad,
      importe: parseFloat(importeAntiguedad.toFixed(2))
    });
    baseCalculoConceptos += importeAntiguedad;
  }

  // 3. Presentismo (8.33% o 1/12 sobre básico + antigüedad)
  const inasistencias = novedad?.inasistencias || 0;
  if (tipo !== 'SAC 1º Semestre' && tipo !== 'SAC 2º Semestre' && inasistencias === 0) {
    const porcentajePresentismo = 8.33;
    const importePresentismo = baseCalculoConceptos * (porcentajePresentismo / 100);
    conceptos.push({
      codigo: '120',
      descripcion: 'Presentismo (Asistencia Perfecta)',
      tipo: 'remunerativo',
      porcentaje: porcentajePresentismo,
      importe: parseFloat(importePresentismo.toFixed(2))
    });
  }

  // 4. Horas Extras (50% y 100%)
  // Valor hora = Básico / 200 (para mensualizados)
  const valorHora = empleado.sueldoBasico / 200;
  if (novedad && novedad.horasExtras50 > 0 && tipo !== 'SAC 1º Semestre' && tipo !== 'SAC 2º Semestre') {
    const importesHE50 = novedad.horasExtras50 * valorHora * 1.5;
    conceptos.push({
      codigo: '130',
      descripcion: 'Horas Extras 50%',
      tipo: 'remunerativo',
      cantidad: novedad.horasExtras50,
      unidades: 'hs',
      importe: parseFloat(importesHE50.toFixed(2))
    });
  }
  if (novedad && novedad.horasExtras100 > 0 && tipo !== 'SAC 1º Semestre' && tipo !== 'SAC 2º Semestre') {
    const importesHE100 = novedad.horasExtras100 * valorHora * 2.0;
    conceptos.push({
      codigo: '135',
      descripcion: 'Horas Extras 100%',
      tipo: 'remunerativo',
      cantidad: novedad.horasExtras100,
      unidades: 'hs',
      importe: parseFloat(importesHE100.toFixed(2))
    });
  }

  // 5. Inasistencias / Descuentos de días
  if (inasistencias > 0 && tipo !== 'SAC 1º Semestre' && tipo !== 'SAC 2º Semestre') {
    const valorDia = baseCalculoConceptos / 30;
    const importeInasistencia = inasistencias * valorDia;
    conceptos.push({
      codigo: '180',
      descripcion: `Inasistencias (${inasistencias} días)`,
      tipo: 'remunerativo', // Se resta del bruto remunerativo en Argentina como un concepto negativo
      cantidad: inasistencias,
      unidades: 'días',
      importe: parseFloat((-importeInasistencia).toFixed(2))
    });
  }

  // 6. Bonos Remunerativos
  if (novedad && novedad.bonoRemunerativo > 0) {
    conceptos.push({
      codigo: '190',
      descripcion: 'Adicional Remunerativo',
      tipo: 'remunerativo',
      importe: novedad.bonoRemunerativo
    });
  }

  // 7. Bonos No Remunerativos
  if (novedad && novedad.bonoNoRemunerativo > 0) {
    conceptos.push({
      codigo: '200',
      descripcion: 'Asignación No Remunerativa',
      tipo: 'no_remunerativo',
      importe: novedad.bonoNoRemunerativo
    });
  }

  // Calcular total remunerativo
  const totalRemunerativo = conceptos
    .filter(c => c.tipo === 'remunerativo')
    .reduce((sum, c) => sum + c.importe, 0);

  // Calcular total no remunerativo
  const totalNoRemunerativo = conceptos
    .filter(c => c.tipo === 'no_remunerativo')
    .reduce((sum, c) => sum + c.importe, 0);

  // 8. Deducciones de Ley sobre el Total Remunerativo (siempre positivo para deducir)
  const convenio = convenios?.find(c => c.id === empleado.convenioId) || {
    id: 'cct-fuera',
    nombre: 'Fuera de Convenio',
    codigoCCT: '-',
    jubilacion: 11,
    obraSocial: 3,
    ley19032: 3,
    cuotaSindical: 0
  };

  // Jubilación
  const pctJubilacion = convenio.jubilacion;
  const jubilacion = totalRemunerativo * (pctJubilacion / 100);
  conceptos.push({
    codigo: '310',
    descripcion: 'Jubilación',
    tipo: 'deduccion',
    porcentaje: pctJubilacion,
    importe: parseFloat(jubilacion.toFixed(2))
  });

  // Obra Social
  const pctObraSocial = convenio.obraSocial;
  const obraSocial = totalRemunerativo * (pctObraSocial / 100);
  conceptos.push({
    codigo: '320',
    descripcion: `Obra Social (${empleado.obraSocial || 'OSECAC'})`,
    tipo: 'deduccion',
    porcentaje: pctObraSocial,
    importe: parseFloat(obraSocial.toFixed(2))
  });

  // Ley 19.032 - INSSJP
  const pctLey19032 = convenio.ley19032;
  const ley19032 = totalRemunerativo * (pctLey19032 / 100);
  conceptos.push({
    codigo: '330',
    descripcion: 'Ley 19.032 - INSSJP',
    tipo: 'deduccion',
    porcentaje: pctLey19032,
    importe: parseFloat(ley19032.toFixed(2))
  });

  // Aporte Sindicato (si está afiliado y hay cuota sindical configurada)
  if (empleado.sindicato && convenio.cuotaSindical > 0) {
    const pctSindicato = convenio.cuotaSindical;
    const sindicatoImporte = totalRemunerativo * (pctSindicato / 100);
    conceptos.push({
      codigo: '340',
      descripcion: `Cuota Sindical (${empleado.sindicatoNombre || convenio.nombre})`,
      tipo: 'deduccion',
      porcentaje: pctSindicato,
      importe: parseFloat(sindicatoImporte.toFixed(2))
    });
  }

  const totalDeducciones = conceptos
    .filter(c => c.tipo === 'deduccion')
    .reduce((sum, c) => sum + c.importe, 0);

  const neto = totalRemunerativo + totalNoRemunerativo - totalDeducciones;

  return {
    id: `LIQ-${Date.now()}-${empleado.id.slice(-4)}`,
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    empleadoCuil: empleado.cuil,
    empleadoPuesto: empleado.puesto,
    empleadoCbu: empleado.cbu,
    periodo,
    tipo,
    fechaLiquidacion: new Date().toISOString().split('T')[0],
    conceptos,
    totalRemunerativo: parseFloat(totalRemunerativo.toFixed(2)),
    totalNoRemunerativo: parseFloat(totalNoRemunerativo.toFixed(2)),
    totalDeducciones: parseFloat(totalDeducciones.toFixed(2)),
    neto: parseFloat(neto.toFixed(2))
  };
}
