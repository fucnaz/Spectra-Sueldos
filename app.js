/**
 * SpectraSueldos - Core Application Logic (SPA Router, DB Service, Payroll Engine)
 */

// --- CONFIGURACIÓN POR DEFECTO ---
const DEFAULT_CONFIG = {
  empresa_nombre: "Mi Empresa S.A.",
  empresa_cuit: "30-12345678-9",
  empresa_direccion: "Av. Corrientes 1234, CABA",
  lct_jubilacion_pct: 11.0,
  lct_obrasocial_pct: 3.0,
  lct_ley19032_pct: 3.0,
  lct_presentismo_pct: 8.33,
  lct_antiguedad_pct: 1.0
};

// --- ESTADO GLOBAL ---
let state = {
  employees: [],
  liquidations: [],
  config: { ...DEFAULT_CONFIG },
  sheetsUrl: "",
  isOnline: false,
  activeSection: "tablero"
};

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
  initRouter();
  initTheme();
  loadLocalSettings();
  await refreshData();
  initEventListeners();
  updateDashboardStats();
  
  // Establecer período predeterminado en la pestaña Liquidar (Mes actual)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const liqPeriodInput = document.getElementById("liq-period");
  if (liqPeriodInput) {
    liqPeriodInput.value = `${yyyy}-${mm}`;
  }
  
  // Mostrar fecha actual en el tablero
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("current-date-display").innerText = today.toLocaleDateString('es-ES', dateOptions);
});

// --- SISTEMA DE NAVEGACIÓN (SPA ROUTER) ---
function initRouter() {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      navigate(target);
    });
  });
}

function navigate(targetSection) {
  // Ocultar todas las secciones
  const sections = document.querySelectorAll(".app-section");
  sections.forEach(sec => sec.classList.add("d-none"));
  
  // Mostrar sección seleccionada
  const target = document.getElementById(`section-${targetSection}`);
  if (target) {
    target.classList.remove("d-none");
  }
  
  // Actualizar estado de botones de navegación
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    if (btn.getAttribute("data-target") === targetSection) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  state.activeSection = targetSection;
  
  // Acciones específicas al entrar a una sección
  if (targetSection === "tablero") {
    updateDashboardStats();
    renderRecentLiquidations();
  } else if (targetSection === "empleados") {
    renderEmployeesTable();
  } else if (targetSection === "liquidar") {
    populateEmployeesSelect();
    clearLiquidationPreview();
  } else if (targetSection === "historial") {
    renderHistoryTable();
  } else if (targetSection === "configuracion") {
    populateConfigFields();
  }
}

// --- TEMA CLARO / OSCURO ---
function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const sunIcon = toggleBtn.querySelector(".sun-icon");
  const moonIcon = toggleBtn.querySelector(".moon-icon");
  
  // Leer tema guardado
  const savedTheme = localStorage.getItem("spectra-theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
    sunIcon.classList.add("d-none");
    moonIcon.classList.remove("d-none");
  }

  toggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    document.body.classList.toggle("dark-theme", !isLight);
    
    if (isLight) {
      localStorage.setItem("spectra-theme", "light");
      sunIcon.classList.add("d-none");
      moonIcon.classList.remove("d-none");
      showToast("Tema claro activado", "info");
    } else {
      localStorage.setItem("spectra-theme", "dark");
      sunIcon.classList.remove("d-none");
      moonIcon.classList.add("d-none");
      showToast("Tema oscuro activado", "info");
    }
  });
}

// --- CAPA DE DATOS (LOCALSTORAGE & GOOGLE SHEETS API) ---

function loadLocalSettings() {
  state.sheetsUrl = localStorage.getItem("spectra_sheets_url") || "";
  
  // Cargar datos locales como fallback inicial
  const localEmployees = localStorage.getItem("spectra_employees");
  const localLiquidations = localStorage.getItem("spectra_liquidations");
  const localConfig = localStorage.getItem("spectra_config");
  
  if (localEmployees) state.employees = JSON.parse(localEmployees);
  if (localLiquidations) state.liquidations = JSON.parse(localLiquidations);
  if (localConfig) state.config = { ...DEFAULT_CONFIG, ...JSON.parse(localConfig) };
}

// Refresca la información leyendo de Sheets (si está configurado) o de LocalStorage
async function refreshData() {
  if (!state.sheetsUrl) {
    setOnlineStatus(false);
    return;
  }
  
  try {
    const response = await fetch(state.sheetsUrl, { method: "GET" });
    if (!response.ok) throw new Error("Error en la respuesta del servidor");
    
    const result = await response.json();
    if (result.status === "success" && result.data) {
      state.employees = result.data.empleados || [];
      state.liquidations = result.data.liquidations || [];
      state.config = { ...DEFAULT_CONFIG, ...result.data.config };
      
      // Sincronizar en LocalStorage para respaldo offline
      localStorage.setItem("spectra_employees", JSON.stringify(state.employees));
      localStorage.setItem("spectra_liquidations", JSON.stringify(state.liquidations));
      localStorage.setItem("spectra_config", JSON.stringify(state.config));
      
      setOnlineStatus(true);
    } else {
      throw new Error(result.message || "Error desconocido");
    }
  } catch (error) {
    console.error("Error conectando con Google Sheets, usando base de datos local:", error);
    setOnlineStatus(false, "Error de conexión (Offline)");
    showToast("No se pudo conectar a Google Sheets. Usando datos locales.", "error");
  }
}

function setOnlineStatus(online, customText = "") {
  state.isOnline = online;
  const dot = document.getElementById("db-indicator-dot");
  const title = document.getElementById("db-status-title");
  const desc = document.getElementById("db-status-desc");
  const syncBtn = document.getElementById("sync-panel-data");
  
  if (online) {
    dot.className = "db-indicator online";
    title.innerText = "Google Sheets Conectado";
    desc.innerText = "Base de datos en la nube activa";
    if (syncBtn) syncBtn.classList.add("d-none"); // Ocultar panel de sync si ya está enlazado correctamente
  } else {
    dot.className = "db-indicator offline";
    title.innerText = customText || "Base de datos local";
    desc.innerText = "LocalStorage activo (Offline)";
    
    // Si hay URL pero no está conectada, mostramos panel de sync por si acaso
    if (state.sheetsUrl && syncBtn) {
      syncBtn.classList.remove("d-none");
    }
  }
}

// Guardar datos
async function dbSaveEmployee(employee) {
  // Asegurar formato de tipos
  employee.Basico = parseFloat(employee.Basico);
  employee.Activo = String(employee.Activo) === 'true';

  // 1. Guardar Localmente
  const index = state.employees.findIndex(e => String(e.Legajo) === String(employee.Legajo));
  if (index !== -1) {
    state.employees[index] = employee;
  } else {
    state.employees.push(employee);
  }
  localStorage.setItem("spectra_employees", JSON.stringify(state.employees));

  // 2. Guardar en Google Sheets si está activo
  if (state.isOnline) {
    try {
      const response = await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors", // Requerido por Google Apps Script en solicitudes directas que redireccionan
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveEmployee", employee: employee })
      });
      // Como usamos no-cors, no podemos leer el cuerpo de la respuesta directamente, pero se asume exitoso si no falla
      showToast("Empleado sincronizado con Google Sheets", "success");
    } catch (err) {
      console.error("Error sincronizando empleado:", err);
      showToast("Guardado localmente. Error al sincronizar con la nube.", "error");
    }
  } else {
    showToast("Empleado guardado localmente", "success");
  }
}

async function dbDeleteEmployee(legajo) {
  // 1. Desactivar Localmente
  const emp = state.employees.find(e => String(e.Legajo) === String(legajo));
  if (emp) {
    emp.Activo = false;
    localStorage.setItem("spectra_employees", JSON.stringify(state.employees));
  }

  // 2. Desactivar en Google Sheets si está activo
  if (state.isOnline) {
    try {
      await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteEmployee", legajo: legajo })
      });
      showToast("Empleado desactivado en Google Sheets", "success");
    } catch (err) {
      console.error("Error eliminando empleado:", err);
      showToast("Empleado desactivado localmente (sin conexión)", "error");
    }
  } else {
    showToast("Empleado desactivado localmente", "success");
  }
}

async function dbSaveLiquidation(liquidation) {
  // 1. Guardar Localmente
  state.liquidations.push(liquidation);
  localStorage.setItem("spectra_liquidations", JSON.stringify(state.liquidations));

  // 2. Guardar en Google Sheets
  if (state.isOnline) {
    try {
      await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveLiquidation", liquidation: liquidation })
      });
      showToast("Liquidación sincronizada con Google Sheets", "success");
    } catch (err) {
      console.error("Error sincronizando liquidación:", err);
      showToast("Guardado localmente. Pendiente de sincronizar.", "error");
    }
  } else {
    showToast("Liquidación guardada localmente", "success");
  }
}

async function dbSaveConfig(newConfig) {
  // 1. Guardar Localmente
  state.config = { ...state.config, ...newConfig };
  localStorage.setItem("spectra_config", JSON.stringify(state.config));

  // 2. Guardar en Google Sheets
  if (state.isOnline) {
    try {
      await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveConfig", config: newConfig })
      });
      showToast("Configuración guardada en Google Sheets", "success");
    } catch (err) {
      console.error("Error sincronizando configuración:", err);
      showToast("Configuración actualizada localmente", "error");
    }
  } else {
    showToast("Configuración actualizada localmente", "success");
  }
}

// Sincronizar todos los datos locales con Google Sheets (en caso de conexión tardía)
async function syncLocalDataToSheets() {
  if (!state.sheetsUrl) {
    showToast("Configura primero la URL de Google Sheets", "error");
    return;
  }
  
  showToast("Sincronizando base de datos...", "info");
  
  try {
    // Subir configuración
    await fetch(state.sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveConfig", config: state.config })
    });
    
    // Subir cada empleado
    for (const emp of state.employees) {
      await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveEmployee", employee: emp })
      });
    }
    
    // Subir cada liquidación
    for (const liq of state.liquidations) {
      await fetch(state.sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveLiquidation", liquidation: liq })
      });
    }
    
    showToast("Sincronización total exitosa", "success");
    await refreshData();
  } catch (err) {
    console.error(err);
    showToast("Error en la sincronización de datos", "error");
  }
}

// --- MOTOR DE LIQUIDACIÓN DE SUELDOS (ARGENTINA LCT) ---

function calculateAntiguedadAnios(fechaIngresoStr, periodoStr) {
  const [pYear, pMonth] = periodoStr.split("-").map(Number);
  const ingreso = new Date(fechaIngresoStr + "T00:00:00");
  
  let años = pYear - ingreso.getFullYear();
  const mesDiferencia = pMonth - 1 - ingreso.getMonth(); // pMonth es 1-indexed, getMonth() es 0-indexed
  
  // Si no se cumplió el aniversario de ingreso todavía en este mes, restamos un año
  if (mesDiferencia < 0 || (mesDiferencia === 0 && ingreso.getDate() > 30)) {
    años--;
  }
  
  return Math.max(0, años);
}

function runPayrollCalculation(employee, period, options) {
  const basicSalary = parseFloat(employee.Basico);
  const daysWorked = parseInt(options.daysWorked) || 30;
  const hasPresentismo = options.presentismo === "si";
  const hs50 = parseFloat(options.hs50) || 0;
  const hs100 = parseFloat(options.hs100) || 0;
  const extraNoRem = parseFloat(options.extraNoRem) || 0;
  const otherDeductions = parseFloat(options.otherDeductions) || 0;

  // Tasas impositivas (desde la config)
  const pctJubilacion = parseFloat(state.config.lct_jubilacion_pct) || 11.0;
  const pctObraSocial = parseFloat(state.config.lct_obrasocial_pct) || 3.0;
  const pctLey19032 = parseFloat(state.config.lct_ley19032_pct) || 3.0;
  const pctPresentismo = parseFloat(state.config.lct_presentismo_pct) || 8.33;
  const pctAntiguedad = parseFloat(state.config.lct_antiguedad_pct) || 1.0;

  const conceptLines = [];
  
  // 1. Sueldo Básico proporcional a los días trabajados
  const sueldoBasicoProporcional = (basicSalary / 30) * daysWorked;
  conceptLines.push({
    code: "100",
    name: `Sueldo Básico (${daysWorked} días)`,
    qty: `${daysWorked} d`,
    remunerative: sueldoBasicoProporcional,
    nonRemunerative: 0,
    deduction: 0
  });

  // 2. Antigüedad
  const aniosAntiguedad = calculateAntiguedadAnios(employee.FechaIngreso, period);
  const importeAntiguedad = sueldoBasicoProporcional * (pctAntiguedad / 100) * aniosAntiguedad;
  if (aniosAntiguedad > 0) {
    conceptLines.push({
      code: "110",
      name: `Antigüedad (${aniosAntiguedad} años)`,
      qty: `${aniosAntiguedad} %`,
      remunerative: importeAntiguedad,
      nonRemunerative: 0,
      deduction: 0
    });
  }

  // 3. Presentismo (LCT / Convenio)
  // Generalmente se calcula sobre Básico + Antigüedad
  let importePresentismo = 0;
  if (hasPresentismo) {
    importePresentismo = (sueldoBasicoProporcional + importeAntiguedad) * (pctPresentismo / 100);
    conceptLines.push({
      code: "120",
      name: "Adicional Presentismo",
      qty: `${pctPresentismo}%`,
      remunerative: importePresentismo,
      nonRemunerative: 0,
      deduction: 0
    });
  }

  // 4. Horas Extras 50%
  // Valor hora = Sueldo Básico / 200 (aproximado estándar de horas mensuales)
  const valorHoraBasico = basicSalary / 200;
  if (hs50 > 0) {
    const valorHs50 = valorHoraBasico * 1.5 * hs50;
    conceptLines.push({
      code: "130",
      name: "Horas Extras al 50%",
      qty: `${hs50} hs`,
      remunerative: valorHs50,
      nonRemunerative: 0,
      deduction: 0
    });
  }

  // 5. Horas Extras 100%
  if (hs100 > 0) {
    const valorHs100 = valorHoraBasico * 2.0 * hs100;
    conceptLines.push({
      code: "140",
      name: "Horas Extras al 100%",
      qty: `${hs100} hs`,
      remunerative: valorHs100,
      nonRemunerative: 0,
      deduction: 0
    });
  }

  // Calcular subtotal remunerativo hasta aquí
  const totalRemunerativo = conceptLines.reduce((acc, c) => acc + c.remunerative, 0);

  // 6. Conceptos No Remunerativos (ingreso directo)
  if (extraNoRem > 0) {
    conceptLines.push({
      code: "200",
      name: "Asignación No Remunerativa",
      qty: "Fijo",
      remunerative: 0,
      nonRemunerative: extraNoRem,
      deduction: 0
    });
  }

  // 7. Retenciones / Deducciones de Ley (calculadas sobre el total remunerativo)
  
  // Jubilación (11%)
  const jubilacionVal = totalRemunerativo * (pctJubilacion / 100);
  conceptLines.push({
    code: "300",
    name: "Jubilación (SIPA)",
    qty: `${pctJubilacion}%`,
    remunerative: 0,
    nonRemunerative: 0,
    deduction: jubilacionVal
  });

  // Obra Social (3%)
  const obraSocialVal = totalRemunerativo * (pctObraSocial / 100);
  conceptLines.push({
    code: "310",
    name: `Obra Social (${employee.ObraSocial})`,
    qty: `${pctObraSocial}%`,
    remunerative: 0,
    nonRemunerative: 0,
    deduction: obraSocialVal
  });

  // Ley 19032 INSSJP (3%)
  const ley19032Val = totalRemunerativo * (pctLey19032 / 100);
  conceptLines.push({
    code: "320",
    name: "Aporte Ley 19032 INSSJP",
    qty: `${pctLey19032}%`,
    remunerative: 0,
    nonRemunerative: 0,
    deduction: ley19032Val
  });

  // Otras deducciones manuales
  if (otherDeductions > 0) {
    conceptLines.push({
      code: "390",
      name: "Otras Deducciones / Adelanto",
      qty: "Fijo",
      remunerative: 0,
      nonRemunerative: 0,
      deduction: otherDeductions
    });
  }

  const totalNoRemunerativo = extraNoRem;
  const totalDeducciones = jubilacionVal + obraSocialVal + ley19032Val + otherDeductions;
  const neto = totalRemunerativo + totalNoRemunerativo - totalDeducciones;

  return {
    employee,
    period,
    concepts: conceptLines,
    totalRemunerative: totalRemunerativo,
    totalNoRemunerative: totalNoRemunerativo,
    totalDeducciones,
    neto,
    dateGenerated: new Date().toISOString()
  };
}

// Convertidor de números a letras en español
function numberToWords(num) {
  const temp = parseFloat(num).toFixed(2).split(".");
  const pesos = parseInt(temp[0]);
  const centavos = parseInt(temp[1]);
  
  if (pesos === 0) return "SON PESOS CERO CON " + centavos + "/100 M.N.";

  function Unidades(num) {
    switch (num) {
      case 1: return "UN";
      case 2: return "DOS";
      case 3: return "TRES";
      case 4: return "CUATRO";
      case 5: return "CINCO";
      case 6: return "SEIS";
      case 7: return "SIETE";
      case 8: return "OCHO";
      case 9: return "NUEVE";
    }
    return "";
  }

  function Decenas(num) {
    const decena = Math.floor(num / 10);
    const unidad = num - (decena * 10);

    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return "DIEZ";
          case 1: return "ONCE";
          case 2: return "DOCE";
          case 3: return "TRECE";
          case 4: return "CATORCE";
          case 5: return "QUINCE";
          default: return "DIECI" + Unidades(unidad);
        }
      case 2:
        if (unidad === 0) return "VEINTE";
        return "VEINTI" + Unidades(unidad);
      case 3: return DecenasY("TREINTA", unidad);
      case 4: return DecenasY("CUARENTA", unidad);
      case 5: return DecenasY("CINCUENTA", unidad);
      case 6: return DecenasY("SESENTA", unidad);
      case 7: return DecenasY("SETENTA", unidad);
      case 8: return DecenasY("OCHENTA", unidad);
      case 9: return DecenasY("NOVENTA", unidad);
      case 0: return Unidades(unidad);
    }
  }

  function DecenasY(strSin, numUnidad) {
    if (numUnidad > 0) return strSin + " Y " + Unidades(numUnidad);
    return strSin;
  }

  function Centenas(num) {
    const centenas = Math.floor(num / 100);
    const decenas = num - (centenas * 100);

    switch (centenas) {
      case 1:
        if (decenas > 0) return "CIENTO " + Decenas(decenas);
        return "CIEN";
      case 2: return "DOSCIENTOS " + Decenas(decenas);
      case 3: return "TRESCIENTOS " + Decenas(decenas);
      case 4: return "CUATROCIENTOS " + Decenas(decenas);
      case 5: return "QUINIENTOS " + Decenas(decenas);
      case 6: return "SEISCIENTOS " + Decenas(decenas);
      case 7: return "SETECIENTOS " + Decenas(decenas);
      case 8: return "OCHOCIENTOS " + Decenas(decenas);
      case 9: return "NOVECIENTOS " + Decenas(decenas);
      case 0: return Decenas(decenas);
    }
  }

  function Seccion(num, divisor, strSingular, strPlural) {
    const cientos = Math.floor(num / divisor);
    const resto = num - (cientos * divisor);

    let letras = "";

    if (cientos > 0) {
      if (cientos > 1) {
        letras = Centenas(cientos) + " " + strPlural;
      } else {
        letras = strSingular;
      }
    }

    if (resto > 0) {
      letras += " " + Centenas(resto);
    }

    return letras;
  }

  function Miles(num) {
    const divisor = 1000;
    const cientos = Math.floor(num / divisor);
    const resto = num - (cientos * divisor);

    let strMiles = Seccion(num, divisor, "UN MIL", "MIL");
    let strCentenas = Centenas(resto);

    if (strMiles === "") return strCentenas;
    return strMiles + " " + strCentenas;
  }

  function Millones(num) {
    const divisor = 1000000;
    const miles = Math.floor(num / divisor);
    const resto = num - (miles * divisor);

    let strMillones = Seccion(num, divisor, "UN MILLON", "MILLONES");
    let strMiles = Miles(resto);

    if (strMillones === "") return strMiles;
    return strMillones + " " + strMiles;
  }

  const outputPesos = Millones(pesos);
  const outputCentavos = centavos < 10 ? "0" + centavos : centavos;
  
  return `SON PESOS ${outputPesos} CON ${outputCentavos}/100 M.N.`;
}

// Format currency standard
function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
}

// Format period e.g. 2026-08 to "Agosto de 2026"
function formatPeriod(periodStr) {
  if (!periodStr) return "";
  const [year, month] = periodStr.split("-");
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${monthNames[parseInt(month) - 1]} de ${year}`;
}

// Format Date standard (YYYY-MM-DD to DD/MM/YYYY)
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// --- RENDERIZADORES DE UI (VISTAS) ---

// 1. Estadísticas del Dashboard
function updateDashboardStats() {
  const activeCount = state.employees.filter(e => e.Activo).length;
  document.getElementById("stat-total-employees").innerText = activeCount;
  
  // Total liquidado en el periodo actual
  const today = new Date();
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  document.getElementById("stat-current-period-name").innerText = formatPeriod(currentPeriod);
  
  const currentPeriodLiqs = state.liquidations.filter(l => l.Periodo === currentPeriod);
  const totalPayroll = currentPeriodLiqs.reduce((acc, l) => acc + parseFloat(l.Neto), 0);
  document.getElementById("stat-total-payroll").innerText = formatCurrency(totalPayroll);
  
  document.getElementById("stat-total-receipts").innerText = state.liquidations.length;
  
  // Información de la empresa rápida en barra lateral
  document.getElementById("company-lbl-name").innerText = state.config.empresa_nombre || "-";
  document.getElementById("company-lbl-cuit").innerText = state.config.empresa_cuit || "-";
  document.getElementById("company-lbl-address").innerText = state.config.empresa_direccion || "-";
}

// 2. Tabla de liquidaciones recientes en Dashboard
function renderRecentLiquidations() {
  const tbody = document.getElementById("dashboard-recent-liquidations");
  tbody.innerHTML = "";
  
  if (state.liquidations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center py-4">No hay liquidaciones en el historial.</td></tr>`;
    return;
  }
  
  // Ordenar de más reciente a más antiguo
  const sorted = [...state.liquidations].reverse().slice(0, 5);
  
  sorted.forEach(liq => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${liq.Nombre}</strong><br><span class="text-muted text-sm">Legajo ${liq.Legajo}</span></td>
      <td>${formatPeriod(liq.Periodo)}</td>
      <td class="text-success">${formatCurrency(liq.TotalBruto)}</td>
      <td class="text-danger">${formatCurrency(liq.TotalDeducciones)}</td>
      <td><strong>${formatCurrency(liq.Neto)}</strong></td>
      <td>
        <button class="action-btn-sm print" onclick="reprintReceipt('${liq.ID}')" title="Reimprimir">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 3. Tabla de la sección de Empleados
function renderEmployeesTable() {
  const tbody = document.getElementById("employees-table-body");
  tbody.innerHTML = "";
  
  const searchVal = document.getElementById("employee-search").value.toLowerCase();
  const filterVal = document.getElementById("employee-status-filter").value;
  
  const filtered = state.employees.filter(emp => {
    // Filtro de búsqueda
    const matchesSearch = 
      emp.Nombre.toLowerCase().includes(searchVal) ||
      String(emp.Legajo).includes(searchVal) ||
      emp.CUIL.includes(searchVal);
      
    // Filtro de estado
    let matchesStatus = true;
    if (filterVal === "active") matchesStatus = emp.Activo;
    else if (filterVal === "inactive") matchesStatus = !emp.Activo;
    
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center py-4">No se encontraron empleados registrados.</td></tr>`;
    return;
  }

  filtered.forEach(emp => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${emp.Legajo}</strong></td>
      <td><strong>${emp.Nombre}</strong></td>
      <td>${emp.CUIL}</td>
      <td>${formatDate(emp.FechaIngreso)}</td>
      <td>${emp.Puesto}</td>
      <td>${formatCurrency(emp.Basico)}</td>
      <td>${emp.ObraSocial}</td>
      <td>
        <span class="badge ${emp.Activo ? 'badge-success' : 'badge-danger'}">
          ${emp.Activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <button class="action-btn-sm edit mr-2" onclick="openEditEmployeeModal('${emp.Legajo}')" title="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        ${emp.Activo ? `
          <button class="action-btn-sm delete" onclick="deactivateEmployee('${emp.Legajo}')" title="Desactivar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
          </button>
        ` : `
          <button class="action-btn-sm edit" onclick="reactivateEmployee('${emp.Legajo}')" title="Reactivar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          </button>
        `}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Reactivar empleado inactivo
function reactivateEmployee(legajo) {
  const emp = state.employees.find(e => String(e.Legajo) === String(legajo));
  if (emp) {
    emp.Activo = true;
    dbSaveEmployee(emp).then(() => {
      renderEmployeesTable();
    });
  }
}

// 4. Selector de empleados en pestaña Liquidar
function populateEmployeesSelect() {
  const select = document.getElementById("liq-employee-select");
  select.innerHTML = '<option value="">Seleccione un empleado...</option>';
  
  // Solo liquidar sobre empleados activos
  const activeEmployees = state.employees.filter(e => e.Activo);
  
  activeEmployees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.Legajo;
    opt.innerText = `[Legajo ${emp.Legajo}] ${emp.Nombre}`;
    select.appendChild(opt);
  });
}

// Prepara el cuadro de información al seleccionar empleado
function handleEmployeeSelectionChange() {
  const legajo = document.getElementById("liq-employee-select").value;
  const box = document.getElementById("preview-employee-info-box");
  
  if (!legajo) {
    clearLiquidationPreview();
    return;
  }
  
  const emp = state.employees.find(e => String(e.Legajo) === String(legajo));
  if (!emp) return;
  
  const antigüedadAños = calculateAntiguedadAnios(emp.FechaIngreso, document.getElementById("liq-period").value);

  box.innerHTML = `
    <h4 class="mb-3">Información del Colaborador</h4>
    <div class="preview-employee-grid">
      <p><strong>Legajo:</strong> ${emp.Legajo}</p>
      <p><strong>Empleado:</strong> ${emp.Nombre}</p>
      <p><strong>CUIL:</strong> ${emp.CUIL}</p>
      <p><strong>Fecha Ingreso:</strong> ${formatDate(emp.FechaIngreso)}</p>
      <p><strong>Puesto/Cat.:</strong> ${emp.Puesto}</p>
      <p><strong>Antigüedad:</strong> ${antigüedadAños} años</p>
      <p><strong>Sueldo Básico:</strong> ${formatCurrency(emp.Basico)}</p>
      <p><strong>Obra Social:</strong> ${emp.ObraSocial}</p>
    </div>
  `;
}

function clearLiquidationPreview() {
  document.getElementById("preview-employee-info-box").innerHTML = `
    <div class="text-center text-muted py-5">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 text-muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      <p>Selecciona un empleado y periodo para calcular la liquidación.</p>
    </div>
  `;
  document.getElementById("payroll-details-table-wrapper").classList.add("d-none");
  state.calculatedPayroll = null;
}

// 5. Previsualizar el cálculo de liquidación
function handleCalculatePayroll() {
  const legajo = document.getElementById("liq-employee-select").value;
  const period = document.getElementById("liq-period").value;
  
  if (!legajo) {
    showToast("Por favor, selecciona un empleado", "error");
    return;
  }
  if (!period) {
    showToast("Por favor, ingresa un período de liquidación", "error");
    return;
  }
  
  const emp = state.employees.find(e => String(e.Legajo) === String(legajo));
  if (!emp) return;
  
  // Capturar opciones
  const options = {
    daysWorked: parseInt(document.getElementById("liq-days-worked").value),
    presentismo: document.getElementById("liq-presentismo-opt").value,
    hs50: parseFloat(document.getElementById("liq-hs-50").value) || 0,
    hs100: parseFloat(document.getElementById("liq-hs-100").value) || 0,
    extraNoRem: parseFloat(document.getElementById("liq-extra-no-rem").value) || 0,
    otherDeductions: parseFloat(document.getElementById("liq-other-deductions").value) || 0
  };
  
  // Validar días
  if (options.daysWorked < 0 || options.daysWorked > 30) {
    showToast("Los días trabajados deben ser entre 0 y 30", "error");
    return;
  }
  
  // Realizar cálculo
  const payroll = runPayrollCalculation(emp, period, options);
  state.calculatedPayroll = payroll;
  
  // Renderizar la tabla de cálculo
  const tbody = document.getElementById("payroll-calculation-lines");
  tbody.innerHTML = "";
  
  payroll.concepts.forEach(c => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="text-muted">${c.code}</span></td>
      <td><strong>${c.name}</strong></td>
      <td class="text-right text-success">${c.remunerative > 0 ? formatCurrency(c.remunerative) : "-"}</td>
      <td class="text-right text-info">${c.nonRemunerative > 0 ? formatCurrency(c.nonRemunerative) : "-"}</td>
      <td class="text-right text-danger">${c.deduction > 0 ? formatCurrency(c.deduction) : "-"}</td>
    `;
    tbody.appendChild(row);
  });
  
  // Totales
  document.getElementById("tot-remunerative").innerText = formatCurrency(payroll.totalRemunerative);
  document.getElementById("tot-non-remunerative").innerText = formatCurrency(payroll.totalNoRemunerative);
  document.getElementById("tot-deductions").innerText = formatCurrency(payroll.totalDeducciones);
  document.getElementById("tot-net").innerText = formatCurrency(payroll.neto);
  
  // Letras
  document.getElementById("tot-net-text").innerText = numberToWords(payroll.neto);
  
  // Mostrar tabla y botón de confirmación
  document.getElementById("payroll-details-table-wrapper").classList.remove("d-none");
  
  showToast("Cálculo realizado con éxito. Listo para confirmar.", "success");
}

// 6. Confirmar, guardar la liquidación y disparar impresión
async function handleConfirmAndPrint() {
  if (!state.calculatedPayroll) {
    showToast("Calcula primero la liquidación", "error");
    return;
  }
  
  const payroll = state.calculatedPayroll;
  
  // Estructurar el registro de liquidación para la base de datos
  const liquidationRecord = {
    ID: "LIQ-" + Date.now(),
    Periodo: payroll.period,
    Legajo: payroll.employee.Legajo,
    Nombre: payroll.employee.Nombre,
    CUIL: payroll.employee.CUIL,
    ConceptosJSON: payroll.concepts,
    TotalBruto: payroll.totalRemunerative,
    TotalDeducciones: payroll.totalDeducciones,
    Neto: payroll.neto,
    FechaLiquidacion: new Date().toISOString().split("T")[0]
  };
  
  showToast("Guardando liquidación...", "info");
  
  // Guardar en DB
  await dbSaveLiquidation(liquidationRecord);
  
  // Preparar e Imprimir Recibo
  preparePrintReceipt(liquidationRecord, state.config);
  
  // Limpiar campos e ir al historial
  clearLiquidationPreview();
  document.getElementById("liq-employee-select").value = "";
  document.getElementById("liq-days-worked").value = "30";
  document.getElementById("liq-presentismo-opt").value = "si";
  document.getElementById("liq-hs-50").value = "0";
  document.getElementById("liq-hs-100").value = "0";
  document.getElementById("liq-extra-no-rem").value = "0";
  document.getElementById("liq-other-deductions").value = "0";
  
  // Ejecutar comando de impresión
  window.print();
  
  // Navegar al historial para ver la liquidación guardada
  navigate("historial");
}

// 7. Preparación del HTML para la impresión del Recibo A4
function preparePrintReceipt(liq, cfg) {
  const concepts = Array.isArray(liq.ConceptosJSON) ? liq.ConceptosJSON : [];
  
  // Rellenar Original (Empleado)
  document.getElementById("pr-emp-name").innerText = cfg.empresa_nombre.toUpperCase();
  document.getElementById("pr-emp-address").innerText = cfg.empresa_direccion;
  document.getElementById("pr-emp-cuit").innerText = cfg.empresa_cuit;
  document.getElementById("pr-period").innerText = formatPeriod(liq.Periodo);
  document.getElementById("pr-legajo").innerText = liq.Legajo;
  document.getElementById("pr-name").innerText = liq.Nombre;
  document.getElementById("pr-cuil").innerText = liq.CUIL;
  
  const emp = state.employees.find(e => String(e.Legajo) === String(liq.Legajo));
  document.getElementById("pr-entry").innerText = emp ? formatDate(emp.FechaIngreso) : "-";
  document.getElementById("pr-job").innerText = emp ? emp.Puesto : "-";
  document.getElementById("pr-cbu").innerText = emp && emp.CBU ? emp.CBU : "Depósito cuenta sueldo";

  // Rellenar Duplicado (Empleador)
  document.getElementById("pr2-emp-name").innerText = cfg.empresa_nombre.toUpperCase();
  document.getElementById("pr2-emp-address").innerText = cfg.empresa_direccion;
  document.getElementById("pr2-emp-cuit").innerText = cfg.empresa_cuit;
  document.getElementById("pr2-period").innerText = formatPeriod(liq.Periodo);
  document.getElementById("pr2-legajo").innerText = liq.Legajo;
  document.getElementById("pr2-name").innerText = liq.Nombre;
  document.getElementById("pr2-cuil").innerText = liq.CUIL;
  document.getElementById("pr2-entry").innerText = emp ? formatDate(emp.FechaIngreso) : "-";
  document.getElementById("pr2-job").innerText = emp ? emp.Puesto : "-";
  document.getElementById("pr2-cbu").innerText = emp && emp.CBU ? emp.CBU : "Depósito cuenta sueldo";

  // Renderizar conceptos en ambas tablas
  const conceptsBody1 = document.getElementById("pr-concepts-body");
  const conceptsBody2 = document.getElementById("pr2-concepts-body");
  
  conceptsBody1.innerHTML = "";
  conceptsBody2.innerHTML = "";

  concepts.forEach(c => {
    const rowHTML = `
      <tr>
        <td>${c.code}</td>
        <td>${c.name}</td>
        <td class="text-center">${c.qty || "-"}</td>
        <td class="text-right">${c.remunerative > 0 ? formatCurrency(c.remunerative) : ""}</td>
        <td class="text-right">${c.nonRemunerative > 0 ? formatCurrency(c.nonRemunerative) : ""}</td>
        <td class="text-right">${c.deduction > 0 ? formatCurrency(c.deduction) : ""}</td>
      </tr>
    `;
    conceptsBody1.insertAdjacentHTML("beforeend", rowHTML);
    conceptsBody2.insertAdjacentHTML("beforeend", rowHTML);
  });

  // Agregar filas vacías estéticas si son pocos conceptos para que el recibo mantenga estructura rígida
  const minRows = 8;
  const neededEmpty = minRows - concepts.length;
  if (neededEmpty > 0) {
    for (let i = 0; i < neededEmpty; i++) {
      const emptyRowHTML = `
        <tr class="empty-concept-row" style="height: 24px;">
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `;
      conceptsBody1.insertAdjacentHTML("beforeend", emptyRowHTML);
      conceptsBody2.insertAdjacentHTML("beforeend", emptyRowHTML);
    }
  }

  // Totales
  const totalRem = concepts.reduce((acc, c) => acc + c.remunerative, 0);
  const totalNoRem = concepts.reduce((acc, c) => acc + c.nonRemunerative, 0);
  const totalDesc = concepts.reduce((acc, c) => acc + c.deduction, 0);

  document.getElementById("pr-tot-rem").innerText = formatCurrency(totalRem);
  document.getElementById("pr-tot-norem").innerText = formatCurrency(totalNoRem);
  document.getElementById("pr-tot-desc").innerText = formatCurrency(totalDesc);
  document.getElementById("pr-tot-net").innerText = formatCurrency(liq.Neto);

  document.getElementById("pr2-tot-rem").innerText = formatCurrency(totalRem);
  document.getElementById("pr2-tot-norem").innerText = formatCurrency(totalNoRem);
  document.getElementById("pr2-tot-desc").innerText = formatCurrency(totalDesc);
  document.getElementById("pr2-tot-net").innerText = formatCurrency(liq.Neto);

  // Neto en letras
  const netInWords = numberToWords(liq.Neto);
  document.getElementById("pr-net-words").innerText = netInWords;
  document.getElementById("pr2-net-words").innerText = netInWords;
}

// Reimprimir desde cualquier tabla (Dashboard / Historial)
function reprintReceipt(liqId) {
  const liq = state.liquidations.find(l => l.ID === liqId);
  if (!liq) {
    showToast("Liquidación no encontrada", "error");
    return;
  }
  
  preparePrintReceipt(liq, state.config);
  window.print();
}

// 8. Tabla de la sección Historial
function renderHistoryTable() {
  const tbody = document.getElementById("history-table-body");
  tbody.innerHTML = "";

  const searchVal = document.getElementById("history-search").value.toLowerCase();
  const periodVal = document.getElementById("history-period-filter").value;

  const filtered = state.liquidations.filter(liq => {
    // Búsqueda
    const matchesSearch = 
      liq.Nombre.toLowerCase().includes(searchVal) ||
      String(liq.Legajo).includes(searchVal) ||
      liq.ID.toLowerCase().includes(searchVal);
      
    // Período
    const matchesPeriod = !periodVal || liq.Periodo === periodVal;

    return matchesSearch && matchesPeriod;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center py-4">No se encontraron liquidaciones cargadas.</td></tr>`;
    return;
  }

  // Orden descendente (más recientes arriba)
  const sorted = [...filtered].reverse();

  sorted.forEach(liq => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="text-muted text-sm">${liq.ID}</span></td>
      <td><strong>${liq.Legajo}</strong></td>
      <td><strong>${liq.Nombre}</strong></td>
      <td>${formatPeriod(liq.Periodo)}</td>
      <td class="text-success">${formatCurrency(liq.TotalBruto)}</td>
      <td class="text-danger">${formatCurrency(liq.TotalDeducciones)}</td>
      <td><strong>${formatCurrency(liq.Neto)}</strong></td>
      <td>${formatDate(liq.FechaLiquidacion)}</td>
      <td>
        <button class="action-btn-sm print" onclick="reprintReceipt('${liq.ID}')" title="Imprimir">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 9. Configuración y carga de inputs
function populateConfigFields() {
  // Google Sheets
  document.getElementById("cfg-sheets-url").value = state.sheetsUrl;

  // Datos empresa
  document.getElementById("cfg-emp-name").value = state.config.empresa_nombre || "";
  document.getElementById("cfg-emp-cuit").value = state.config.empresa_cuit || "";
  document.getElementById("cfg-emp-address").value = state.config.empresa_direccion || "";

  // Parámetros LCT
  document.getElementById("cfg-lct-jubilacion").value = state.config.lct_jubilacion_pct;
  document.getElementById("cfg-lct-obrasocial").value = state.config.lct_obrasocial_pct;
  document.getElementById("cfg-lct-ley19032").value = state.config.lct_ley19032_pct;
  document.getElementById("cfg-lct-presentismo").value = state.config.lct_presentismo_pct;
  document.getElementById("cfg-lct-antiguedad").value = state.config.lct_antiguedad_pct;
  
  setOnlineStatus(state.isOnline);
}

// --- CONTROL DE MODALES (EMPLEADOS MODAL) ---

function openAddEmployeeModal() {
  document.getElementById("form-employee").reset();
  document.getElementById("emp-action").value = "create";
  document.getElementById("emp-legajo").disabled = false;
  document.getElementById("modal-employee-title").innerText = "Agregar Nuevo Empleado";
  document.getElementById("modal-employee").classList.remove("d-none");
}

function openEditEmployeeModal(legajo) {
  const emp = state.employees.find(e => String(e.Legajo) === String(legajo));
  if (!emp) return;

  document.getElementById("emp-action").value = "edit";
  document.getElementById("emp-legajo").value = emp.Legajo;
  document.getElementById("emp-legajo").disabled = true; // No permitir cambiar legajo clave
  document.getElementById("emp-nombre").value = emp.Nombre;
  document.getElementById("emp-cuil").value = emp.CUIL;
  document.getElementById("emp-fecha-ingreso").value = emp.FechaIngreso;
  document.getElementById("emp-puesto").value = emp.Puesto;
  document.getElementById("emp-basico").value = emp.Basico;
  document.getElementById("emp-obrasocial").value = emp.ObraSocial;
  document.getElementById("emp-cbu").value = emp.CBU || "";
  document.getElementById("emp-activo").checked = emp.Activo;

  document.getElementById("modal-employee-title").innerText = "Editar Empleado";
  document.getElementById("modal-employee").classList.remove("d-none");
}

function closeEmployeeModal() {
  document.getElementById("modal-employee").classList.add("d-none");
}

function deactivateEmployee(legajo) {
  if (confirm(`¿Estás seguro de que deseas desactivar al empleado con legajo ${legajo}?`)) {
    dbDeleteEmployee(legajo).then(() => {
      renderEmployeesTable();
    });
  }
}

// --- EVENT LISTENERS (UI EVENT HANDLERS) ---

function initEventListeners() {
  // --- ACCIONES GENERALES ---
  
  // Modal Empleados
  document.getElementById("btn-add-employee").addEventListener("click", openAddEmployeeModal);
  document.getElementById("btn-close-employee-modal").addEventListener("click", closeEmployeeModal);
  document.getElementById("btn-cancel-employee-form").addEventListener("click", closeEmployeeModal);
  
  // Submit Form Empleado
  document.getElementById("form-employee").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const legajo = document.getElementById("emp-legajo").value;
    const isEdit = document.getElementById("emp-action").value === "edit";
    
    // Validar duplicado si es nuevo legajo
    if (!isEdit) {
      const exists = state.employees.some(emp => String(emp.Legajo) === String(legajo));
      if (exists) {
        showToast("Ya existe un empleado con este número de legajo", "error");
        return;
      }
    }
    
    const employeeData = {
      Legajo: legajo,
      Nombre: document.getElementById("emp-nombre").value,
      CUIL: document.getElementById("emp-cuil").value,
      FechaIngreso: document.getElementById("emp-fecha-ingreso").value,
      Puesto: document.getElementById("emp-puesto").value,
      Basico: parseFloat(document.getElementById("emp-basico").value),
      ObraSocial: document.getElementById("emp-obrasocial").value,
      CBU: document.getElementById("emp-cbu").value,
      Activo: document.getElementById("emp-activo").checked
    };
    
    closeEmployeeModal();
    showToast("Guardando empleado...", "info");
    
    await dbSaveEmployee(employeeData);
    renderEmployeesTable();
  });
  
  // Filtros de búsqueda en empleados
  document.getElementById("employee-search").addEventListener("input", renderEmployeesTable);
  document.getElementById("employee-status-filter").addEventListener("change", renderEmployeesTable);

  // --- TABLERO ACCIONES RÁPIDAS ---
  document.getElementById("btn-quick-liquidate").addEventListener("click", () => navigate("liquidar"));
  document.getElementById("btn-quick-add-employee").addEventListener("click", () => {
    navigate("empleados");
    openAddEmployeeModal();
  });
  document.getElementById("btn-quick-config-sheets").addEventListener("click", () => navigate("configuracion"));
  document.getElementById("btn-dashboard-view-history").addEventListener("click", () => navigate("historial"));

  // --- SECCIÓN LIQUIDAR ---
  document.getElementById("liq-employee-select").addEventListener("change", handleEmployeeSelectionChange);
  document.getElementById("liq-period").addEventListener("change", () => {
    // Si cambia el período, recalcular antigüedad en info box
    const leg = document.getElementById("liq-employee-select").value;
    if (leg) handleEmployeeSelectionChange();
  });
  document.getElementById("btn-calculate-payroll").addEventListener("click", handleCalculatePayroll);
  document.getElementById("btn-save-and-print").addEventListener("click", handleConfirmAndPrint);

  // --- SECCIÓN HISTORIAL ---
  document.getElementById("history-search").addEventListener("input", renderHistoryTable);
  document.getElementById("history-period-filter").addEventListener("change", renderHistoryTable);
  document.getElementById("btn-clear-history-filters").addEventListener("click", () => {
    document.getElementById("history-search").value = "";
    document.getElementById("history-period-filter").value = "";
    renderHistoryTable();
  });

  // --- SECCIÓN CONFIGURACIÓN ---
  
  // Probar Conexión
  document.getElementById("btn-test-sheets-conn").addEventListener("click", async () => {
    const url = document.getElementById("cfg-sheets-url").value;
    if (!url) {
      showToast("Ingresa una URL antes de probar", "error");
      return;
    }
    
    showToast("Probando conexión...", "info");
    
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error();
      const testData = await res.json();
      
      if (testData.status === "success") {
        showToast("Conexión exitosa con Google Sheets", "success");
      } else {
        showToast("Respuesta incorrecta del script", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión. Revisa la URL y los permisos.", "error");
    }
  });

  // Guardar URL de Sheets
  document.getElementById("btn-save-sheets-config").addEventListener("click", async () => {
    const url = document.getElementById("cfg-sheets-url").value;
    state.sheetsUrl = url;
    localStorage.setItem("spectra_sheets_url", url);
    
    showToast("Buscando datos en Google Sheets...", "info");
    await refreshData();
    setOnlineStatus(state.isOnline);
    populateConfigFields();
  });

  // Sincronizar local a Sheets
  document.getElementById("btn-sync-local-to-sheets").addEventListener("click", syncLocalDataToSheets);

  // Guardar Datos Empleador
  document.getElementById("form-config-employer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newConfig = {
      empresa_nombre: document.getElementById("cfg-emp-name").value,
      empresa_cuit: document.getElementById("cfg-emp-cuit").value,
      empresa_direccion: document.getElementById("cfg-emp-address").value
    };
    
    showToast("Guardando datos...", "info");
    await dbSaveConfig(newConfig);
    updateDashboardStats();
  });

  // Guardar Parámetros LCT (Formulas)
  document.getElementById("form-config-lct").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newConfig = {
      lct_jubilacion_pct: parseFloat(document.getElementById("cfg-lct-jubilacion").value),
      lct_obrasocial_pct: parseFloat(document.getElementById("cfg-lct-obrasocial").value),
      lct_ley19032_pct: parseFloat(document.getElementById("cfg-lct-ley19032").value),
      lct_presentismo_pct: parseFloat(document.getElementById("cfg-lct-presentismo").value),
      lct_antiguedad_pct: parseFloat(document.getElementById("cfg-lct-antiguedad").value)
    };
    
    showToast("Actualizando fórmulas legales...", "info");
    await dbSaveConfig(newConfig);
  });
}

// --- SISTEMA DE TOASTS FLOTANTES ---
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // Iconos del toast
  let icon = "";
  if (type === "success") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === "error") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Eliminar toast después de 4 segundos con fundido de salida
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// --- EXPONER MÉTODOS AL OBJETO GLOBAL PARA EVENTOS EN HTML ENLACES ---
window.openEditEmployeeModal = openEditEmployeeModal;
window.deactivateEmployee = deactivateEmployee;
window.reactivateEmployee = reactivateEmployee;
window.reprintReceipt = reprintReceipt;
