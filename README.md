🔧 CALIBRE (Neural Garage OS)
CALIBRE es una plataforma SaaS (Software as a Service) de nueva generación diseñada específicamente para digitalizar, automatizar y optimizar la gestión de talleres mecánicos automotrices.

Construida con un enfoque en la transparencia hacia el cliente y la asistencia técnica mediante Inteligencia Artificial, CALIBRE elimina el papeleo, reduce las llamadas de clientes ansiosos y convierte un taller tradicional en una experiencia premium.

🚀 Killer Features (Características Principales)
📱 1. Live Tracker (Experiencia del Cliente)
Inspirado en la logística de apps como Uber o Cornershop. Cada orden de trabajo genera un enlace único y encriptado que se envía al cliente vía WhatsApp. El cliente puede ver en tiempo real el avance de su vehículo (Diagnóstico > Esperando Repuestos > En Reparación > Listo para Entrega) sin necesidad de descargar aplicaciones ni crear contraseñas.

💡 2. Segunda Opinión IA ("La Ampolleta")
Integración nativa con Google Gemini 2.5 Flash. Al ingresar una falla reportada por el cliente, el mecánico puede consultar a la IA para recibir un análisis técnico que incluye:

Las 3 causas más probables para ese modelo y año específico.

Qué sensores medir y qué pruebas realizar antes de desarmar.

Fallas crónicas conocidas del vehículo.

📋 3. Pizarra Activa & Checklist Interactivo
Interfaz tipo Kanban para la gestión del taller. Los mecánicos visualizan las órdenes abiertas y pueden interactuar con un To-Do List (Checklist) de repuestos y servicios, marcando visualmente lo que ya está completado para evitar errores de ensamblaje u olvidos en el cobro.

📊 4. Telemetría y Dashboard Financiero
Un centro de mando en tiempo real que calcula:

Ganancias del mes y Ticket Promedio.

División porcentual de ingresos (Mano de Obra vs. Venta de Repuestos).

Top Marcas más rentables y rendimiento por mecánico.

Flujo de caja histórico detallado.

🤖 5. Agenda Predictiva y Ficha Clínica
El sistema registra el kilometraje y guarda "Alertas de Desgaste" (Preventivas o Urgentes). Un algoritmo evalúa el tiempo transcurrido y alerta al taller para enviar campañas de marketing o recordatorios automáticos por WhatsApp (ej. "Toca cambio de aceite" o "Quedó pendiente el cambio de pastillas").

📄 6. Generación de Informes Técnicos PDF
Generación de documentos formales listos para imprimir o enviar, que incluyen:

Resumen generado por IA del trabajo realizado.

Evidencia fotográfica del desgaste o reparación.

Detalle de costos, cálculos de IVA y términos de garantía.

Logo personalizado del taller.

🛠️ Stack Tecnológico
Frontend: Next.js (App Router), React, Tailwind CSS, Lucide Icons.

Backend & Base de Datos: Supabase (PostgreSQL), Supabase Auth, Row Level Security (RLS).

Storage: Supabase Storage (Buckets para Logos y Evidencia fotográfica).

Inteligencia Artificial: Google Generative AI SDK (gemini-2.5-flash).

Utilidades: jspdf y jspdf-autotable (Informes), browser-image-compression (Optimización de imágenes), Web Share API (Compartir nativo).

Hosting: Vercel.

⚙️ Instalación y Configuración Local
Clonar el repositorio:

Bash
git clone https://github.com/tu-usuario/calibre-app.git
cd calibre-app
Instalar dependencias:

Bash
npm install
Configurar Variables de Entorno:
Crea un archivo .env.local en la raíz del proyecto y agrega las siguientes credenciales:

Fragmento de código
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
GEMINI_API_KEY=tu_google_gemini_api_key
Configuración de Supabase:

Habilita la autenticación por Email/Password o Google OAuth.

Crea los buckets de Storage: logos y evidencia (Ambos públicos).

Ejecuta las políticas RLS correspondientes para permitir la lectura pública de órdenes para el Live Tracker.

Ejecutar el servidor de desarrollo:

Bash
npm run dev
Abre http://localhost:3000 en tu navegador.

🗄️ Estructura de la Base de Datos (Supabase)
El ecosistema se sostiene sobre las siguientes tablas relacionales clave:

clientes: Guarda información de contacto (RUT, Nombre, Teléfono, Correo).

vehiculos: Vinculado a clientes. Guarda Patente, Marca, Modelo, Año.

ordenes_trabajo: El núcleo. Registra estados, subtotales, kilometraje, mecánicos asignados y resúmenes IA.

items_orden: Tareas individuales (Servicios o Repuestos) con estado booleano de realizado.

fotos_orden: Referencias a las URLs de Supabase Storage para evidencia.

alertas_desgaste: Registro de componentes a vigilar con niveles de riesgo (Amarillo/Rojo).

🌍 Casos de Uso (Flujo de Trabajo Típico)
Recepción: El vehículo ingresa. El asesor ingresa la patente y el kilometraje. Si es nuevo, el validador de RUT y los selectores predictivos de marcas agilizan el proceso.

Pizarra: El vehículo aparece en la Pizarra Activa. Se levanta el diagnóstico (asistido por IA si hay dudas).

Cotización: Se agregan los ítems al Checklist. Con un clic, se envía el Presupuesto + Link de Seguimiento por WhatsApp al cliente.

Reparación: El mecánico marca los ítems como realizados en la tablet/celular y sube fotos de las piezas dañadas.

Entrega: Se presiona "Listo". El sistema genera el PDF, avisa al cliente por WhatsApp, mueve el dinero a la Caja Histórica y archiva el vehículo para futuras campañas predictivas.

👨‍💻 Autor
Desarrollado y diseñado por Basty.
Pensado para revolucionar la industria automotriz en Chile y por qué no? LATAM!