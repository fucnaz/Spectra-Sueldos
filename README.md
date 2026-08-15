# SpectraSueldos - Base de Datos con Google Sheets

SpectraSueldos puede guardar todos los datos localmente en tu navegador (Modo Local) o utilizar una planilla de **Google Sheets** como base de datos en tiempo real (Modo Online).

Para configurar Google Sheets como tu base de datos, sigue los siguientes pasos:

## Paso 1: Crear la Hoja de Cálculo
1. Ve a [Google Sheets](https://sheets.google.com/) y crea una nueva planilla vacía.
2. Nómbrala como quieras, por ejemplo: `SpectraSueldos DB`.

## Paso 2: Copiar el Código de Google Apps Script
1. En tu nueva planilla de Google Sheets, ve al menú superior: **Extensiones** -> **Apps Script**.
2. Verás un editor de código. Borra cualquier código existente en el archivo `Código.gs`.
3. Abre el archivo [google-apps-script.js](google-apps-script.js) de este proyecto, copia todo su contenido y pégalo en el editor de Apps Script.
4. Haz clic en el ícono de **Guardar** (el disquete) o presiona `Ctrl + S`.

## Paso 3: Desplegar como Aplicación Web
1. En la esquina superior derecha del editor de Apps Script, haz clic en **Implementar** (o *Deploy*) -> **Nueva implementación** (o *New deployment*).
2. Haz clic en el ícono de engranaje al lado de "Seleccionar tipo" y elige **Aplicación web**.
3. Configura los siguientes campos:
   - **Descripción:** `Backend de SpectraSueldos`
   - **Ejecutar como:** `Tú (tu-correo@gmail.com)`
   - **Quién tiene acceso:** **`Cualquiera`** *(Importante: Debe ser "Cualquiera" o "Anyone" para permitir que la aplicación web se comunique con la planilla sin necesidad de iniciar sesión en Google).*
4. Haz clic en **Implementar**.
5. Si es la primera vez, Google te pedirá "Autorizar acceso". Haz clic en **Autorizar acceso**, selecciona tu cuenta de Google, haz clic en **Configuración avanzada** (abajo a la izquierda en letra chica) y luego en **Ir a Proyecto sin nombre (no seguro)**. Finalmente, presiona **Permitir**.
6. Una vez completado el despliegue, verás una ventana con la **URL de la aplicación web**. Copia esa URL (debe terminar en `/exec`).

## Paso 4: Enlazar en SpectraSueldos
1. Abre SpectraSueldos en tu navegador.
2. Dirígete a la sección de **Configuración** (ícono de engranaje).
3. Pega la URL copiada en el campo **"URL de Google Sheets Web App"**.
4. Haz clic en **Guardar Configuración**.
5. ¡Listo! El sistema sincronizará los datos. Si tenías datos guardados de forma local, la aplicación te ofrecerá subirlos a la planilla para no perderlos.

---

*Nota: La primera vez que el script se ejecute, creará automáticamente tres pestañas (`config`, `empleados` y `liquidaciones`) con columnas de cabecera y datos de ejemplo.*
