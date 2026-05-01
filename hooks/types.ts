export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  [key: string]: any;
}

export interface AlertaDesgaste {
  id: string;
  vehiculo_id: string;
  componente: string;
  nivel_riesgo: 'Amarillo' | 'Rojo';
  estado: 'Pendiente' | 'Corregido';
  created_at: string;
  [key: string]: any;
}

export interface Vehiculo {
  id: string;
  taller_id: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  placa: string;
  color?: string;
  vin?: string;
  clientes?: Cliente;
  alertas_desgaste?: AlertaDesgaste[];
  created_at: string;
  [key: string]: any;
}

export interface ItemOrden {
  id: string;
  orden_id: string;
  tipo_item: 'servicio' | 'repuesto';
  precio: number;
  descripcion: string;
  cantidad?: number;
  [key: string]: any;
}

export interface FotoOrden {
  id: string;
  orden_id: string;
  url: string;
  created_at: string;
  [key: string]: any;
}

export interface ComentarioOrden {
  id: string;
  orden_id: string;
  texto: string;
  created_at: string;
  [key: string]: any;
}

export interface OrdenTrabajo {
  id: string;
  vehiculo_id: string;
  estado: string;
  sub_estado: string;
  costo_revision: number;
  descuento: number;
  mecanico: string;
  feedback_final_estrellas: number | null;
  created_at: string;
  updated_at: string;
  vehiculos?: Vehiculo;
  items_orden?: ItemOrden[];
  fotos_orden?: FotoOrden[];
  comentarios_orden?: ComentarioOrden[];
  [key: string]: any;
}

export interface TallerConfig {
  id: string;
  nombre_taller: string;
  fecha_vencimiento: string | null;
  pago_confirmado: boolean;
  [key: string]: any;
}
