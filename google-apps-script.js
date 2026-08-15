/**
 * SpectraSueldos - Google Apps Script Backend
 * Este script actúa como API web para conectar la aplicación SpectraSueldos con Google Sheets.
 * Colócalo en Extensiones -> Apps Script en tu hoja de cálculo de Google.
 */

// Configura las cabeceras de CORS para permitir solicitudes desde la aplicación web
function getCorsResponse(content) {
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}

// Inicializa las hojas de cálculo con su estructura si no existen
function checkAndInitSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja de Configuración
  let configSheet = ss.getSheetByName("config");
  if (!configSheet) {
    configSheet = ss.insertSheet("config");
    configSheet.appendRow(["Clave", "Valor"]);
    configSheet.appendRow(["empresa_nombre", "Mi Empresa S.A."]);
    configSheet.appendRow(["empresa_cuit", "30-12345678-9"]);
    configSheet.appendRow(["empresa_direccion", "Av. Corrientes 1234, CABA"]);
    configSheet.appendRow(["lct_jubilacion_pct", "11.0"]);
    configSheet.appendRow(["lct_obrasocial_pct", "3.0"]);
    configSheet.appendRow(["lct_ley19032_pct", "3.0"]);
    configSheet.appendRow(["lct_presentismo_pct", "8.33"]);
    configSheet.appendRow(["lct_antiguedad_pct", "1.0"]);
  }

  // 2. Hoja de Empleados
  let empleadosSheet = ss.getSheetByName("empleados");
  if (!empleadosSheet) {
    empleadosSheet = ss.insertSheet("empleados");
    empleadosSheet.appendRow(["Legajo", "Nombre", "CUIL", "FechaIngreso", "Puesto", "Basico", "ObraSocial", "CBU", "Activo"]);
    // Datos de ejemplo
    empleadosSheet.appendRow(["101", "Juan Pérez", "20-34567890-9", "2020-03-15", "Administrativo A", "450000", "OSECAC", "0170001234567890123456", "true"]);
    empleadosSheet.appendRow(["102", "María García", "27-45678901-8", "2018-06-01", "Supervisor B", "620000", "OSDE", "0170001234567890123457", "true"]);
  }

  // 3. Hoja de Liquidaciones
  let liquidacionesSheet = ss.getSheetByName("liquidaciones");
  if (!liquidacionesSheet) {
    liquidacionesSheet = ss.insertSheet("liquidaciones");
    liquidacionesSheet.appendRow(["ID", "Periodo", "Legajo", "Nombre", "CUIL", "ConceptosJSON", "TotalBruto", "TotalDeducciones", "Neto", "FechaLiquidacion"]);
  }
}

// GET: Devuelve toda la información en JSON
function doGet(e) {
  try {
    checkAndInitSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Leer Config
    const configSheet = ss.getSheetByName("config");
    const configData = configSheet.getDataRange().getValues();
    const config = {};
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0]) {
        config[configData[i][0]] = configData[i][1];
      }
    }
    
    // Leer Empleados
    const empleadosSheet = ss.getSheetByName("empleados");
    const empleadosValues = empleadosSheet.getDataRange().getValues();
    const empleadosHeaders = empleadosValues[0];
    const empleados = [];
    for (let i = 1; i < empleadosValues.length; i++) {
      const row = empleadosValues[i];
      if (!row[0]) continue; // Saltear filas vacías
      const emp = {};
      empleadosHeaders.forEach((header, index) => {
        emp[header] = row[index];
      });
      // Convertir Activo a boolean si es string
      emp.Activo = String(emp.Activo).toLowerCase() === 'true';
      empleados.push(emp);
    }
    
    // Leer Liquidaciones
    const liquidacionesSheet = ss.getSheetByName("liquidaciones");
    const liqValues = liquidacionesSheet.getDataRange().getValues();
    const liqHeaders = liqValues[0];
    const liquidaciones = [];
    for (let i = 1; i < liqValues.length; i++) {
      const row = liqValues[i];
      if (!row[0]) continue;
      const liq = {};
      liqHeaders.forEach((header, index) => {
        if (header === 'ConceptosJSON') {
          try {
            liq[header] = JSON.parse(row[index]);
          } catch(err) {
            liq[header] = [];
          }
        } else {
          liq[header] = row[index];
        }
      });
      liquidaciones.push(liq);
    }
    
    return getCorsResponse({
      status: "success",
      data: {
        config: config,
        empleados: empleados,
        liquidaciones: liquidaciones
      }
    });
  } catch (error) {
    return getCorsResponse({ status: "error", message: error.toString() });
  }
}

// POST: Realiza acciones de guardado o eliminación
function doPost(e) {
  try {
    checkAndInitSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No payload found in the request body");
    }
    
    const action = payload.action;
    
    if (action === "saveEmployee") {
      const emp = payload.employee;
      const sheet = ss.getSheetByName("empleados");
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      
      let foundIndex = -1;
      // Buscar por Legajo (columna 0)
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(emp.Legajo)) {
          foundIndex = i + 1; // +1 porque las filas en Sheets son 1-indexed
          break;
        }
      }
      
      const newRow = headers.map(header => {
        if (header === "Activo") return String(emp[header]) === 'true';
        return emp[header] !== undefined ? emp[header] : "";
      });
      
      if (foundIndex !== -1) {
        // Actualizar empleado existente
        const range = sheet.getRange(foundIndex, 1, 1, newRow.length);
        range.setValues([newRow]);
      } else {
        // Insertar nuevo empleado
        sheet.appendRow(newRow);
      }
      return getCorsResponse({ status: "success", message: "Empleado guardado correctamente" });
      
    } else if (action === "deleteEmployee") {
      const legajo = payload.legajo;
      const sheet = ss.getSheetByName("empleados");
      const values = sheet.getDataRange().getValues();
      
      let foundIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(legajo)) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        // En lugar de borrar la fila físicamente, desactivamos al empleado para conservar integridad referencial
        const activoColIndex = values[0].indexOf("Activo") + 1;
        if (activoColIndex > 0) {
          sheet.getRange(foundIndex, activoColIndex).setValue(false);
          return getCorsResponse({ status: "success", message: "Empleado desactivado correctamente" });
        } else {
          sheet.deleteRow(foundIndex);
          return getCorsResponse({ status: "success", message: "Empleado eliminado de la planilla" });
        }
      } else {
        throw new Error("Empleado no encontrado");
      }
      
    } else if (action === "saveLiquidation") {
      const liq = payload.liquidation;
      const sheet = ss.getSheetByName("liquidaciones");
      const headers = sheet.getDataRange().getValues()[0];
      
      // Auto-generar ID si no existe
      if (!liq.ID) {
        liq.ID = "LIQ-" + Date.now();
      }
      
      const newRow = headers.map(header => {
        if (header === "ConceptosJSON") return JSON.stringify(liq[header] || []);
        return liq[header] !== undefined ? liq[header] : "";
      });
      
      sheet.appendRow(newRow);
      return getCorsResponse({ status: "success", message: "Liquidación registrada correctamente", id: liq.ID });
      
    } else if (action === "saveConfig") {
      const config = payload.config; // Objeto clave-valor
      const sheet = ss.getSheetByName("config");
      const range = sheet.getDataRange();
      const values = range.getValues();
      
      // Actualizar claves existentes o agregar nuevas
      const keysUpdated = [];
      for (let i = 1; i < values.length; i++) {
        const key = values[i][0];
        if (key && config[key] !== undefined) {
          sheet.getRange(i + 1, 2).setValue(config[key]);
          keysUpdated.push(key);
        }
      }
      
      // Agregar claves nuevas que no existían
      for (const key in config) {
        if (keysUpdated.indexOf(key) === -1) {
          sheet.appendRow([key, config[key]]);
        }
      }
      return getCorsResponse({ status: "success", message: "Configuración actualizada correctamente" });
      
    } else {
      throw new Error("Acción desconocida o no autorizada");
    }
    
  } catch (error) {
    return getCorsResponse({ status: "error", message: error.toString() });
  }
}
