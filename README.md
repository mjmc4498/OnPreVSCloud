# CostScope

Un sistema de observabilidad de costos para comparar gastos on-prem vs. cloud a través de las fases de una migración tecnológica.

## Objetivo del Proyecto

CostScope tiene como objetivo proporcionar una visión clara y unificada de la economía unitaria (unit economics), FinOps y la observabilidad en un solo panel. El MVP se centra en calcular el costo por transacción, vincularlo a trazas de telemetría y asociarlo a recursos específicos, permitiendo a los equipos de ingeniería y finanzas entender el impacto real de sus migraciones a la nube.

## Instalación y Uso

Este proyecto es una Progressive Web App (PWA) que funciona 100% en el navegador, por lo que no requiere un backend complejo para su funcionamiento básico.

### Requisitos

-   Un navegador web moderno (Chrome, Firefox, Edge).
-   Node.js y npm para la gestión de dependencias y scripts de desarrollo.

### Pasos para la Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd costscope
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    Esto iniciará un servidor web local y abrirá la aplicación en tu navegador.

## Guía de Usuario

La interfaz principal se divide en un panel de control lateral y un área de contenido principal.

### Controles Principales

-   **Cargar Datos de Ejemplo:** Carga el conjunto de datos de muestra (`resources.csv`, `costs.csv`, etc.) en la base de datos del navegador (IndexedDB). Esto permite probar la aplicación sin necesidad de archivos propios.
-   **Importar Archivo:** Abre un selector de archivos para que puedas importar tus propios datos en formato CSV. (Funcionalidad futura: soportar mapeo de columnas y validaciones avanzadas).
-   **Ejecutar Asignación:** Corre el motor de asignación de costos. Este proceso toma los costos mensuales de los recursos y los distribuye entre las transacciones y spans que los utilizaron. Los resultados se muestran en la consola del navegador.
-   **Calcular (Worker):** Botón de demostración para ejecutar un cálculo pesado en un Web Worker, mostrando cómo la aplicación puede realizar tareas intensivas sin bloquear la interfaz.

### ¿Cómo funciona?

1.  **Carga tus datos:** Usa los botones del panel de control para cargar los datos de ejemplo o tus propios archivos.
2.  **Ejecuta la asignación:** Haz clic en "Ejecutar Asignación". El sistema procesará los datos y calculará los costos.
3.  **Analiza los resultados:** Abre la consola de desarrollador de tu navegador (`F12` o `Ctrl+Shift+I`) para ver los resultados detallados del cálculo de costos por transacción, costos fantasma, etc. (En el futuro, esta información se mostrará en gráficos y tablas en el panel principal).

## Arquitectura

-   **Frontend:** Aplicación de una sola página (SPA) sin frameworks, construida con JavaScript moderno (módulos ES).
-   **Almacenamiento:** IndexedDB se utiliza como base de datos en el lado del cliente para persistir todos los datos.
-   **Procesamiento en Background:** Los Web Workers se utilizan para cálculos pesados para no congelar la interfaz de usuario.
-   **Estilos:** Bootstrap 5 para el layout principal, complementado con CSS personalizado.
-   **Tooling:** `vitest` para pruebas unitarias y `prettier` para formateo de código.

## Troubleshooting

-   **Los botones no funcionan:** Asegúrate de que no haya errores en la consola del desarrollador. La causa más común puede ser un fallo al iniciar la base de datos IndexedDB.
-   **Los tests fallan:** Si ejecutas `npm run test` y falla, asegúrate de que todas las dependencias de desarrollo se hayan instalado correctamente con `npm install`.
-   **Los datos no se cargan:** Verifica que los archivos CSV tengan el formato esperado (columnas correctas, etc.). La consola del navegador puede mostrar advertencias si el parseador de CSV encuentra problemas.
