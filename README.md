# 🚀 CALIBRE - El Taller del Futuro

CALIBRE es un software SaaS premium diseñado para modernizar y optimizar la gestión de talleres mecánicos. Permite administrar clientes, vehículos, órdenes de trabajo, evidencia fotográfica, y finanzas, integrando Inteligencia Artificial para diagnósticos y resúmenes automáticos.

## ✨ Características Principales

* **Pizarra Activa:** Sistema Kanban visual para gestionar el estado de los vehículos en tiempo real (Diagnóstico, Reparando, Listo, etc.).
* **Recepción Ágil:** Registro de clientes (RUT) y vehículos (Patente, Marca, Modelo) con validaciones y auto-completado.
* **Gestión de Órdenes:** Creación de presupuestos, asignación de mecánicos y control de repuestos/servicios.
* **Scanner IA:** Integración con IA para leer códigos de error (OBD2) y sugerir planes de acción.
* **Módulo de Evidencia:** Subida de fotos del estado del vehículo comprimidas automáticamente y guardadas en la nube.
* **Generación de PDF y Correo:** Creación automática de informes detallados y envío directo al WhatsApp o correo del cliente.
* **Telemetría y Finanzas:** Dashboard interactivo con el flujo de caja, métricas de rendimiento y ticket promedio.

---

## 🛠️ Stack Tecnológico

* **Frontend:** Next.js (App Router), React, TypeScript.
* **Estilos:** Tailwind CSS (Arquitectura Glassmorphism, UI oscura y resplandores de neón).
* **Backend & Base de Datos:** Supabase (PostgreSQL, Authentication, Storage).
* **Procesamiento IA:** OpenAI API (Para Scanner y Resúmenes de cierre de orden).
* **Utilidades:** * `pdfmake` (Generación de documentos PDF).
    * `browser-image-compression` (Optimización de fotos).
    * `lucide-react` (Iconografía).
    * `react-hot-toast` (Sistema de notificaciones emergentes).

---

## 📂 Arquitectura del Proyecto (Mapa de Archivos)

Para mantener el código limpio y escalable, el proyecto está modularizado de la siguiente manera:

### 1. Núcleo (Página Principal)
* `src/app/taller/page.tsx`: Es el cerebro del Taller. Mantiene los estados globales, hace las consultas a Supabase y renderiza la Pizarra Activa y la sección de Recepción.

### 2. Componentes UI
* `src/components/Header.tsx`: Barra de navegación superior con métricas rápidas y botones de acceso a modales.
* `src/components/Login.tsx`: Pantalla de inicio de sesión.

### 3. Modales (Sistema de Ventanas)
Toda la lógica secundaria fue extraída a la carpeta `src/components/modals/` para evitar saturar la página principal:
* `ModalVehiculoInfo.tsx`: Muestra la ficha técnica del vehículo y su cliente.
* `ModalTelemetria.tsx`: Dashboard financiero y estadísticas del mes.
* `ModalScanner.tsx`: Interfaz para consultar códigos a la IA.
* `ModalItem.tsx`: Formulario para agregar repuestos/servicios a una orden.
* `ModalHistorial.tsx`: Tabla con todas las órdenes finalizadas.
* `ModalEvidencia.tsx`: Cámara y subida de fotos del auto a Supabase.
* `ModalConfiguracion.tsx`: Ajustes del taller (nombre) y botón de cierre de sesión.
* `ModalCaja.tsx`: Resumen de ingresos brutos.

### 4. Utilidades y APIs
* `src/utils/pdfGenerator.ts`: Motor de creación de facturas e informes en base64.
* `src/app/api/`: Carpeta que contiene los Endpoints (Rutas de servidor) para conectarse de forma segura a OpenAI y Resend (Correos).
* `src/app/globals.css`: Contiene las directivas de Tailwind y estilos personalizados (como la *custom-scrollbar* verde esmeralda).

---

## 🗄️ Estructura de Base de Datos (Supabase)

El sistema opera bajo las siguientes tablas conectadas por relaciones relacionales (Foreign Keys):

1.  **`clientes`**: `id`, `rut`, `nombre`, `telefono`, `taller_id`.
2.  **`vehiculos`**: `id`, `patente`, `marca`, `modelo`, `anho`, `cliente_id`, `taller_id`.
3.  **`ordenes_trabajo`**: `id`, `vehiculo_id`, `estado` (Abierta/Finalizada), `sub_estado`, `descripcion`, `mecanico`, `resumen_ia`.
4.  **`items_orden`**: `id`, `orden_id`, `descripcion`, `precio`, `tipo_item` (repuesto/servicio), `procedencia`.
5.  **`fotos_orden`**: `id`, `orden_id`, `url`, `descripcion`.

---

## ⚙️ Configuración e Instalación Local

### 1. Clonar el repositorio y bajar dependencias
```bash
git clone [https://github.com/tu-usuario/calibre-app.git](https://github.com/tu-usuario/calibre-app.git)
cd calibre-app
npm install