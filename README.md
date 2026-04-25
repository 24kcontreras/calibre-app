🔧 CALIBRE (Neural Garage OS)
La Revolución de la Gestión Automotriz Potenciada por IA y Visualización 3D
CALIBRE es una plataforma SaaS (Software as a Service) B2B de nueva generación diseñada para digitalizar, automatizar y optimizar la gestión integral de talleres mecánicos. Su propuesta de valor se centra en romper la "caja negra" del servicio técnico tradicional, sustituyéndola por una experiencia de usuario transparente, tecnológica y altamente profesional.

🚀 Punto de Innovación Principal
El punto innovador de Calibre radica en su capacidad para transformar la gestión automotriz tradicional en una experiencia digital de vanguardia, integrando una experiencia visual inmersiva mediante el mapeo de daños en 3D que garantiza una transparencia total y elimina cualquier rastro de desconfianza en el cliente. La plataforma utiliza la inteligencia artificial como un traductor técnico capaz de convertir diagnósticos complejos de scanner en informes simples y persuasivos, logrando digitalizar por completo el flujo de vida del vehículo y agilizar la toma de decisiones en tiempo real. Este ecosistema se potencia con un sistema de mantenimiento predictivo y proactivo que, más allá de solo organizar la operación interna, actúa como un motor generador de demanda; al anticiparse a las necesidades del vehículo y emitir alertas inteligentes, llama activamente a los clientes de vuelta al taller, asegurando un aumento constante en el flujo de trabajo, una mayor rentabilidad y una fidelización inquebrantable.

🛠️ Stack Tecnológico
Framework: Next.js (App Router) con TypeScript.

Estilos: Tailwind CSS para una interfaz oscura (Dark Mode) premium.

Base de Datos y Auth: Supabase (PostgreSQL) con Realtime enabled.

Almacenamiento: Supabase Storage (Bucket de evidencias fotográficas).

Motor 3D: Three.js / React Three Fiber (Visualización de archivos .glb).

Inteligencia Artificial: Google Gemini API (Análisis de fallas y resúmenes).

Documentación: jsPDF para generación dinámica de informes técnicos.

💎 Killer Features (Características Principales)
1. Inspección de Carrocería 3D Interactiva
Mapeo de Daños: Los mecánicos pueden rotar un modelo 3D del vehículo y colocar marcadores de daños (puntos rojos) en tiempo real.

Transparencia Legal: Protege al taller documentando el estado estético inicial del vehículo, evitando reclamos por daños preexistentes.

UX del Cliente: El cliente puede interactuar con su propio auto en 3D desde su celular mediante el Live Tracker.

2. IA Technical Assistant (Cerebro Gemini)
Scanner Translator: Traduce códigos DTC complejos a lenguaje humano comprensible para el cliente.

Resumen de Cierre: Genera automáticamente el informe de trabajo realizado, facilitando la entrega técnica.

Dictado por Voz: Integración de Speech-to-Text para que el mecánico registre fallas sin dejar de trabajar con las manos.

3. Live Tracker & WhatsApp Connect
Enlace Único: Cada orden genera un link encriptado (/estado/[id]) que se envía al cliente.

Seguimiento en Vivo: El cliente visualiza el progreso (Diagnóstico > Esperando Repuestos > En Reparación > Listo).

Fricción Cero: Sin descargas de apps; todo funciona desde el navegador móvil del cliente.

4. Gestión de Taller y "God Mode"
Pizarra Kanban: Control visual de todas las unidades en el taller con cálculo automático de tiempo de estancia.

Ficha Clínica: Historial centralizado por patente, incluyendo fotos de evidencia de cada visita.

Panel de Administración (/admin-calibre): Control total de suscripciones, validación de pagos y gestión de inquilinos (Talleres).

5. Fidelización Predictiva
Alertas de Desgaste: Registro de componentes que requerirán atención futura (Frenos, Neumáticos, etc.).

Agenda Proactiva: El sistema detecta periodos de inactividad y sugiere al mecánico contactar al cliente para mantenimientos preventivos.

📊 Arquitectura de Datos (Modelado Relacional)
talleres: Núcleo B2B (Tenant). Maneja suscripción, logo y configuración del local.

clientes: Datos de contacto vinculados al taller.

vehiculos: Historial técnico único por patente.

ordenes_trabajo: El motor operativo. Almacena estados, daños 3D, nivel de combustible y testigos.

items_orden: Servicios y repuestos. Implementa la lógica de "Ocultamiento Estratégico" (protege el margen de repuestos ocultando el precio unitario en la vista pública).

alertas_desgaste: Base de datos para el marketing predictivo.

🌍 Estrategia de Negocio (SaaS B2B)
CALIBRE no es solo un gestor de órdenes; es una herramienta de ventas.

Atracción: El taller proyecta una imagen tecnológica superior con el acta 3D.

Conversión: La IA ayuda a explicar la necesidad de reparaciones, aumentando la aprobación de presupuestos.

Protección: Evidencia fotográfica y notas de turno protegen la rentabilidad y la legalidad del taller.

Retención: Las alertas predictivas aseguran que el cliente regrese de forma recurrente.

Estado del Proyecto: Operativo con integración de IA, Motor 3D y sistema de informes PDF profesional. Preparado para escalamiento comercial.