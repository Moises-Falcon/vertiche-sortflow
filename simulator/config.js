// config.js — Configuracion del simulador RFID Vertiche V5

const TAGS_CONOCIDOS = [
  { epc: 'E2003411B802011803B96101', sku: 'BLU-F-M-001',  tienda_id: 'TDA-007', bahia_correcta: 'BAHIA-1', tipo_flujo: 'CROSS_DOCK'  },
  { epc: 'E2003411B802011803B96102', sku: 'ROJ-F-S-002',  tienda_id: 'TDA-007', bahia_correcta: 'BAHIA-1', tipo_flujo: 'CROSS_DOCK'  },
  { epc: 'E2003411B802011803B96103', sku: 'NEG-M-L-003',  tienda_id: 'TDA-007', bahia_correcta: 'BAHIA-1', tipo_flujo: 'CROSS_DOCK'  },
  { epc: 'E2003411B802011803B96104', sku: 'BLA-F-XS-004', tienda_id: 'TDA-015', bahia_correcta: 'BAHIA-2', tipo_flujo: 'NUEVA_TIENDA' },
  { epc: 'E2003411B802011803B96105', sku: 'GRI-M-XL-005', tienda_id: 'TDA-015', bahia_correcta: 'BAHIA-2', tipo_flujo: 'NUEVA_TIENDA' },
  { epc: 'E2003411B802011803B96106', sku: 'VER-F-M-006',  tienda_id: 'TDA-029', bahia_correcta: 'BAHIA-3', tipo_flujo: 'CROSS_DOCK'  },
  { epc: 'E2003411B802011803B96107', sku: 'AZU-M-S-007',  tienda_id: 'TDA-029', bahia_correcta: 'BAHIA-3', tipo_flujo: 'CROSS_DOCK'  },
  { epc: 'E2003411B802011803B96108', sku: 'NRJ-F-L-008',  tienda_id: 'TDA-033', bahia_correcta: 'BAHIA-4', tipo_flujo: 'REFILL'      },
  { epc: 'E2003411B802011803B96109', sku: 'VIO-F-M-009',  tienda_id: 'TDA-033', bahia_correcta: 'BAHIA-4', tipo_flujo: 'REFILL'      },
  { epc: 'E2003411B802011803B96110', sku: 'AMA-M-XL-010', tienda_id: 'TDA-044', bahia_correcta: 'BAHIA-1', tipo_flujo: 'CROSS_DOCK'  },
];

// Flujo unico: CROSS_DOCK completo (7 etapas)
// NUEVA_TIENDA y REFILL solo recorren las primeras 3 etapas
const FLUJO_ETAPAS = [
  { etapa: 'PREREGISTRO', lector: 'RFID-RECEPCION-1',   bahia: 'RAMPA-ENTRADA',  delay_seg: 0 },
  { etapa: 'QA',          lector: 'RFID-QA-1',           bahia: 'ZONA-QA',        delay_seg: 4 },
  { etapa: 'REGISTRO',    lector: 'RFID-REGISTRO-1',     bahia: 'ZONA-REGISTRO',  delay_seg: 5 },
  { etapa: 'SORTER',      lector: 'RFID-SORTER-1',       bahia: 'ZONA-SORTER',    delay_seg: 4 },
  { etapa: 'BAHIA',       lector: 'RFID-BAHIA-{B}',      bahia: 'BAHIA-{B}',      delay_seg: 6 },
  { etapa: 'AUDITORIA',   lector: 'RFID-AUDITORIA-1',    bahia: 'ZONA-AUDITORIA', delay_seg: 4 },
  { etapa: 'ENVIO',       lector: 'RFID-ENVIO-1',        bahia: 'MUELLE-SALIDA',  delay_seg: 5 },
];

// Probabilidades de anomalia (bajas para demo limpia)
const ANOMALIAS = {
  TAG_DESCONOCIDO:  0.002,
  TAG_DUPLICADO:    0.002,
  BAHIA_INCORRECTA: 0.002,
};

const NUEVO_PREPACK_CADA_SEG = 6;

const BAHIAS = ['1', '2', '3', '4'];

// EPCs que NUNCA deben estar en el simulador (datos fijos para demo)
const EPCS_DEMO = ['DEMO0000000000000000OK01', 'DEMO000000000000000ERR02'];

module.exports = { TAGS_CONOCIDOS, FLUJO_ETAPAS, ANOMALIAS, NUEVO_PREPACK_CADA_SEG, BAHIAS, EPCS_DEMO };
