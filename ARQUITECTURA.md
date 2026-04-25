# 🔧 CALIBRE (Neural Garage OS) - Documento de Arquitectura y Contexto

**CALIBRE** es una plataforma SaaS B2B diseñada para digitalizar la gestión de talleres mecánicos. Destaca por su visualización de daños en 3D interactivo, integración de IA (Gemini) para traducción técnica de diagnósticos y un fuerte enfoque en el mantenimiento predictivo para la retención de clientes.

---

## 🛠️ Stack Tecnológico
* **Framework Core:** Next.js (App Router) con TypeScript.
* **Estilos:** Tailwind CSS (Dark Mode Premium).
* **Backend y Auth:** Supabase (PostgreSQL, Auth, Storage).
* **Motor 3D:** Three.js / React Three Fiber (Visor de modelos `.glb`).
* **Inteligencia Artificial:** Google Gemini API.
* **Utilidades:** jsPDF (Reportes técnicos), browser-image-compression, React Hot Toast.

---

## 📂 Mapa de Rutas y Estructura de Archivos (Frontend)

La aplicación utiliza un **Patrón de Contenedor/Presentación**, donde un Orquestador principal distribuye los datos a componentes modulares, aislando la lógica y optimizando el rendimiento.

### 1. Directorio Raíz (`/app`)
* **`app/page.tsx` (El Orquestador):** Punto de entrada. Protege la ruta verificando la sesión (`<Login />`), invoca el hook maestro (`useTaller`), y distribuye los datos a la Columna Izquierda (`<Recepcion />`), la Columna Derecha (`<Pizarra />`) y la capa de Modales.
* **`app/api/scanner/route.ts`**: Endpoint que conecta con Gemini para interpretar códigos DTC de OBD2.
* **`app/api/resumen/route.ts`**: Endpoint que conecta con Gemini para redactar el cierre técnico final.

### 2. El Cerebro de Datos (`/hooks`)
* **`hooks/useTaller.ts`:** Archivo crítico. Contiene **toda** la lógica de comunicación con Supabase. Maneja la sesión, verifica el estado de pago (Lock-In comercial) y descarga los datos. Procesa cálculos derivados pesados (Telemetría, Finanzas, Ticket Promedio, Agenda Predictiva).

### 3. Componentes Principales (`/components/taller`)
* **`components/taller/Recepcion.tsx` (La Puerta):** Maneja el formulario de ingreso, validador de RUT, buscador rápido y pestañas de "Alertas" y "Agenda Predictiva".
* **`components/taller/Pizarra.tsx` (El Corazón):** Dibuja el Kanban. Contiene la lógica transaccional: cambiar estados, asignar mecánicos, cobrar, descontar y generar links de WhatsApp.

### 4. Capa de Modales (`/components/modals`)
* **`ModalNuevaOrden.tsx`**: UI de ingreso. Incluye IA de voz, reloj de combustible analógico, matriz de testigos, cámara inicial y `<Car3DViewer />`.
* **`ModalEditarOrden.tsx`**: Formulario de actualización rápida (KM, mecánico, fallas).
* **`ModalActaRecepcion.tsx`**: Visor de solo lectura del estado de ingreso.
* **`ModalItem.tsx`**: Formulario de repuestos/servicios (Checklist).
* **`ModalAlerta.tsx`**: Registro manual de piezas con desgaste (marketing predictivo).

---

## 🗄️ Esquema de Base de Datos SQL (Supabase)

El sistema utiliza un enfoque **Multi-Tenant (Multi-Inquilino)**. El `taller_id` (vinculado a `auth.users(id)`) es la clave foránea principal que aísla los datos de cada negocio.

### 1. Tablas Core (B2B & Clientes)
* **`talleres`**: Tabla maestra B2B. Maneja la identidad (`nombre_taller`, `logo_url`) y el control SaaS (`fecha_vencimiento`, `pago_confirmado` para activar el modo Solo Lectura).
* **`clientes`**: Propietarios de los vehículos (`rut`, `nombre`, `telefono`, `correo`). Vinculado por `taller_id`.
* **`vehiculos`**: Vinculado a `clientes`. Almacena `patente` (identificador visual principal), `marca`, `modelo` y `anho`.

### 2. Tablas Transaccionales (El Taller)
* **`ordenes_trabajo`**: El motor principal. Guarda la metadata del proceso (`estado`, `sub_estado`, `mecanico`, `costo_revision`, `descuento`, `resumen_ia`).
  * *Killer Features:* Usa tipo `jsonb` para almacenar `testigos` encendidos y los marcadores del 3D (`danos_carroceria`). Guarda strings para `nivel_combustible`, `objetos_valor` y `danos_previos`.
* **`items_orden`**: Checklist técnico. Registra `descripcion`, `precio`, `tipo_item` (servicio/repuesto) y si está `realizado` (boolean). Permite el ocultamiento estratégico de precios individuales al cliente final.
* **`fotos_orden`**: Guarda la `url` de la evidencia alojada en Supabase Storage y su `descripcion`.
* **`comentarios_orden`**: Bitácora inmutable de notas de turno entre mecánicos (`texto`, `autor_nombre`).
* **`diagnostico_items`**: Estructura detallada de diagnóstico (categorías, niveles de urgencia).
* **`gastos`**: Control financiero interno del local (`monto`, `categoria`, `descripcion`).

### 3. Tablas Predictivas (Fidelización)
* **`alertas_desgaste`**: Base del marketing predictivo. Registra la `pieza` comprometida, el `nivel_riesgo` ('Amarillo', 'Rojo') y su `estado` ('Pendiente', 'Resuelto'). Alimenta el panel de agenda para contactar clientes vía WhatsApp en el futuro.

---

## 🔄 Reglas de Negocio Clave
1. **Lock-In Comercial:** Si la consulta a `talleres` devuelve `pago_confirmado = false` o una `fecha_vencimiento` superada, el frontend activa el estado `soloLectura`, bloqueando operaciones de escritura pero permitiendo visualizar historial.
2. **Live Tracker (Transparencia):** Cada ID UUID de `ordenes_trabajo` genera una ruta dinámica pública (`/estado/[id]`) que expone datos filtrados (sin mostrar precios de repuestos individuales) al cliente.