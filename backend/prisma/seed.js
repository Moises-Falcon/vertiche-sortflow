const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: hora de hoy
const hoy = new Date();
const hora = (h, m) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), h, m, 0);

async function main() {
  console.log('Seeding V5 Definitivo...');

  // ── Limpiar datos transaccionales ─────────────────────────────────────────
  await prisma.paletEtapaLog.deleteMany({});
  await prisma.prepackCaja.deleteMany({});
  await prisma.anomalia.deleteMany({});
  await prisma.eventoLectura.deleteMany({});

  // ── Proveedores ──────────────────────────────────────────────────────────
  const prov1 = await prisma.proveedor.upsert({
    where: { codigo: 'PROV-001' },
    update: {},
    create: { nombre: 'Textiles Monterrey SA', codigo: 'PROV-001', contacto: 'Carlos Mendez', email: 'cmendez@textilesmty.mx' }
  });
  const prov2 = await prisma.proveedor.upsert({
    where: { codigo: 'PROV-002' },
    update: {},
    create: { nombre: 'Confecciones del Norte', codigo: 'PROV-002', contacto: 'Ana Torres', email: 'atorres@confnorte.mx' }
  });

  // ── Tiendas ──────────────────────────────────────────────────────────────
  const tiendas = [
    { tienda_id: 'TDA-007', nombre: 'Vertiche Monterrey Centro', ciudad: 'Monterrey',              region: 'Noreste',   bahia_asignada: 'BAHIA-1' },
    { tienda_id: 'TDA-015', nombre: 'Vertiche San Pedro',        ciudad: 'San Pedro Garza Garcia',  region: 'Noreste',   bahia_asignada: 'BAHIA-2' },
    { tienda_id: 'TDA-029', nombre: 'Vertiche Guadalajara',      ciudad: 'Guadalajara',             region: 'Occidente', bahia_asignada: 'BAHIA-3' },
    { tienda_id: 'TDA-033', nombre: 'Vertiche CDMX Polanco',     ciudad: 'Ciudad de Mexico',        region: 'Centro',    bahia_asignada: 'BAHIA-4' },
    { tienda_id: 'TDA-044', nombre: 'Vertiche Puebla',           ciudad: 'Puebla',                  region: 'Centro',    bahia_asignada: 'BAHIA-1' },
    { tienda_id: 'TDA-051', nombre: 'Vertiche Cancun',           ciudad: 'Cancun',                  region: 'Sureste',   bahia_asignada: 'BAHIA-2' },
  ];
  for (const t of tiendas) {
    await prisma.tienda.upsert({ where: { tienda_id: t.tienda_id }, update: {}, create: t });
  }

  // ── Pedidos ──────────────────────────────────────────────────────────────
  await prisma.pedido.upsert({
    where: { pedido_id: 'PED-2026-001' },
    update: {},
    create: { pedido_id: 'PED-2026-001', proveedor_id: prov1.id, estado: 'EN_PROCESO', total_esperados: 8, total_recibidos: 7, fecha_llegada: hora(7, 30), fecha_entrega_estimada: hora(18, 0) }
  });
  await prisma.pedido.upsert({
    where: { pedido_id: 'PED-2026-002' },
    update: {},
    create: { pedido_id: 'PED-2026-002', proveedor_id: prov2.id, estado: 'EN_PROCESO', total_esperados: 7, total_recibidos: 5, fecha_llegada: hora(8, 30), fecha_entrega_estimada: hora(18, 0) }
  });

  // ── Ordenes de compra ────────────────────────────────────────────────────
  await prisma.ordenCompra.upsert({
    where: { orden_id: 'OC-2026-001' },
    update: { nombre_producto: 'Playera Basica Temporada Primavera' },
    create: {
      orden_id: 'OC-2026-001', proveedor_id: prov1.id,
      modelo: 'PB-PRIM-26', nombre_producto: 'Playera Basica Temporada Primavera',
      descripcion: 'Coleccion primavera-verano 2026 — tallas S a XL, 4 colores',
      estado: 'EN_PROCESO', total_esperados: 8, total_recibidos: 7,
    }
  });
  await prisma.ordenCompra.upsert({
    where: { orden_id: 'OC-2026-002' },
    update: { nombre_producto: 'Pantalon Cargo Denim' },
    create: {
      orden_id: 'OC-2026-002', proveedor_id: prov2.id,
      modelo: 'PC-DENIM-26', nombre_producto: 'Pantalon Cargo Denim',
      descripcion: 'Linea denim casual Q2 — tallas S a XL, 3 colores',
      estado: 'EN_PROCESO', total_esperados: 7, total_recibidos: 5,
    }
  });

  // ── Detalles de orden ────────────────────────────────────────────────────
  await prisma.detalleOrden.deleteMany({ where: { orden_id: { in: ['OC-2026-001', 'OC-2026-002'] } } });
  await prisma.detalleOrden.createMany({ data: [
    { orden_id: 'OC-2026-001', sku: 'BLU-F-M-001',  talla: 'M',  color: 'Azul',   cantidad: 2 },
    { orden_id: 'OC-2026-001', sku: 'ROJ-F-S-002',  talla: 'S',  color: 'Rojo',   cantidad: 2 },
    { orden_id: 'OC-2026-001', sku: 'NEG-M-L-003',  talla: 'L',  color: 'Negro',  cantidad: 2 },
    { orden_id: 'OC-2026-001', sku: 'BLA-F-XS-004', talla: 'XS', color: 'Blanco', cantidad: 2 },
    { orden_id: 'OC-2026-002', sku: 'VER-F-M-006',  talla: 'M',  color: 'Verde',   cantidad: 2 },
    { orden_id: 'OC-2026-002', sku: 'AZU-M-S-007',  talla: 'S',  color: 'Azul',    cantidad: 2 },
    { orden_id: 'OC-2026-002', sku: 'NRJ-F-L-008',  talla: 'L',  color: 'Naranja', cantidad: 2 },
    { orden_id: 'OC-2026-002', sku: 'VIO-F-M-009',  talla: 'M',  color: 'Violeta', cantidad: 1 },
  ]});

  // ── Palets con historias distintas ───────────────────────────────────────

  // PAL-001: Playera Basica — completo sin errores, DESPACHADO
  // PAL-002: Playera Basica — con fallo QA, en BAHIA
  // PAL-003: Pantalon Cargo — bahia incorrecta, en AUDITORIA
  // PAL-004: Pantalon Cargo — recien llegado, en PREREGISTRO
  const paletsData = [
    { palet_id: 'PAL-001', pedido_id: 'PED-2026-001', orden_id: 'OC-2026-001', estado: 'DESPACHADO', total_prepacks: 4, timestamp_llegada: hora(8, 0), timestamp_salida: hora(10, 5), tiempo_ciclo_min: 125 },
    { palet_id: 'PAL-002', pedido_id: 'PED-2026-001', orden_id: 'OC-2026-001', estado: 'ACTIVO',     total_prepacks: 3, timestamp_llegada: hora(8, 30) },
    { palet_id: 'PAL-003', pedido_id: 'PED-2026-002', orden_id: 'OC-2026-002', estado: 'ACTIVO',     total_prepacks: 2, timestamp_llegada: hora(9, 0) },
    { palet_id: 'PAL-004', pedido_id: 'PED-2026-002', orden_id: 'OC-2026-002', estado: 'ACTIVO',     total_prepacks: 3, timestamp_llegada: hora(10, 30) },
  ];
  for (const p of paletsData) {
    await prisma.palet.upsert({ where: { palet_id: p.palet_id }, update: p, create: p });
  }

  // ── Tags ─────────────────────────────────────────────────────────────────
  const tagsData = [
    // PAL-001: 4 tags — todos en ENVIO (completado)
    { epc: 'E2003411B802011803B96101', sku: 'BLU-F-M-001',  talla: 'M',  color: 'Azul',   cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-007', palet_id: 'PAL-001', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'ENVIO' },
    { epc: 'E2003411B802011803B96102', sku: 'ROJ-F-S-002',  talla: 'S',  color: 'Rojo',   cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-015', palet_id: 'PAL-001', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'ENVIO' },
    { epc: 'E2003411B802011803B96103', sku: 'NEG-M-L-003',  talla: 'L',  color: 'Negro',  cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-029', palet_id: 'PAL-001', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'ENVIO' },
    { epc: 'E2003411B802011803B96104', sku: 'BLA-F-XS-004', talla: 'XS', color: 'Blanco', cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-033', palet_id: 'PAL-001', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'ENVIO' },
    // PAL-002: 3 tags — 1 fallido en QA, 2 en BAHIA
    { epc: 'E2003411B802011803B96105', sku: 'BLU-F-M-001',  talla: 'M',  color: 'Azul',   cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-007', palet_id: 'PAL-002', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'BAHIA' },
    { epc: 'E2003411B802011803B96106', sku: 'ROJ-F-S-002',  talla: 'S',  color: 'Rojo',   cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-015', palet_id: 'PAL-002', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'BAHIA' },
    { epc: 'E2003411B802011803B96107', sku: 'NEG-M-L-003',  talla: 'L',  color: 'Negro',  cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-029', palet_id: 'PAL-002', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'COMPLETADO', qa_fallido: true, qa_motivo_fallo: 'Prenda defectuosa', qa_timestamp: hora(9, 7) },
    // PAL-003: 2 tags — 1 con bahia incorrecta, ambos en AUDITORIA
    { epc: 'E2003411B802011803B96108', sku: 'VER-F-M-006',  talla: 'M',  color: 'Verde',  cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-029', palet_id: 'PAL-003', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'AUDITORIA' },
    { epc: 'E2003411B802011803B96109', sku: 'AZU-M-S-007',  talla: 'S',  color: 'Azul',   cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-029', palet_id: 'PAL-003', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'AUDITORIA' },
    // PAL-004: 3 tags — todos en PREREGISTRO
    { epc: 'E2003411B802011803B96110', sku: 'NRJ-F-L-008',  talla: 'L',  color: 'Naranja',cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-033', palet_id: 'PAL-004', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'PREREGISTRO' },
    { epc: 'E2003411B802011803B96111', sku: 'VIO-F-M-009',  talla: 'M',  color: 'Violeta',cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-044', palet_id: 'PAL-004', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'PREREGISTRO' },
    { epc: 'E2003411B802011803B96112', sku: 'VER-F-M-006',  talla: 'M',  color: 'Verde',  cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-051', palet_id: 'PAL-004', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'PREREGISTRO' },
    // Demo tags
    { epc: 'DEMO0000000000000000OK01', sku: 'BLU-F-M-001', talla: 'M', color: 'Azul', cantidad_piezas: 12, proveedor_id: prov1.id, tienda_id: 'TDA-007', palet_id: 'PAL-001', pedido_id: 'PED-2026-001', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'ENVIO' },
    { epc: 'DEMO000000000000000ERR02', sku: 'VER-F-M-006', talla: 'M', color: 'Verde', cantidad_piezas: 12, proveedor_id: prov2.id, tienda_id: 'TDA-029', palet_id: 'PAL-003', pedido_id: 'PED-2026-002', tipo_flujo: 'CROSS_DOCK', etapa_actual: 'BAHIA' },
  ];
  for (const t of tagsData) {
    await prisma.tag.upsert({ where: { epc: t.epc }, update: t, create: t });
  }

  // ── Cajas ────────────────────────────────────────────────────────────────
  const cajasData = [
    { caja_id: 'CAJA-TDA007-001', tienda_id: 'TDA-007', bahia: 'BAHIA-1', estado: 'SELLADA'  },
    { caja_id: 'CAJA-TDA007-002', tienda_id: 'TDA-007', bahia: 'BAHIA-1', estado: 'LLENANDO' },
    { caja_id: 'CAJA-TDA015-001', tienda_id: 'TDA-015', bahia: 'BAHIA-2', estado: 'SELLADA'  },
    { caja_id: 'CAJA-TDA029-001', tienda_id: 'TDA-029', bahia: 'BAHIA-3', estado: 'ABIERTA'  },
  ];
  for (const c of cajasData) {
    await prisma.caja.upsert({ where: { caja_id: c.caja_id }, update: {}, create: c });
  }

  await prisma.prepackCaja.upsert({
    where: { epc_caja_id: { epc: 'DEMO0000000000000000OK01', caja_id: 'CAJA-TDA007-001' } },
    update: {},
    create: { epc: 'DEMO0000000000000000OK01', caja_id: 'CAJA-TDA007-001', es_correcto: true }
  });

  // ── PaletEtapaLog — PAL-001: completo sin anomalias ──────────────────────
  const logs001 = [
    { palet_id: 'PAL-001', etapa: 'PREREGISTRO', timestamp_entrada: hora(8,0),  timestamp_salida: hora(8,12),  prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'QA',          timestamp_entrada: hora(8,12), timestamp_salida: hora(8,28),  prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'REGISTRO',    timestamp_entrada: hora(8,28), timestamp_salida: hora(8,40),  prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'SORTER',      timestamp_entrada: hora(8,40), timestamp_salida: hora(9,5),   prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'BAHIA',       timestamp_entrada: hora(9,5),  timestamp_salida: hora(9,35),  prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'AUDITORIA',   timestamp_entrada: hora(9,35), timestamp_salida: hora(9,50),  prepacks_entrada: 4, prepacks_salida: 4 },
    { palet_id: 'PAL-001', etapa: 'ENVIO',       timestamp_entrada: hora(9,50), timestamp_salida: hora(10,5),  prepacks_entrada: 4, prepacks_salida: 4 },
  ];
  for (const l of logs001) await prisma.paletEtapaLog.create({ data: l });

  // ── PaletEtapaLog — PAL-002: fallo QA, en BAHIA ──────────────────────────
  const logs002 = [
    { palet_id: 'PAL-002', etapa: 'PREREGISTRO', timestamp_entrada: hora(8,30), timestamp_salida: hora(8,45), prepacks_entrada: 3, prepacks_salida: 3 },
    { palet_id: 'PAL-002', etapa: 'QA',          timestamp_entrada: hora(8,45), timestamp_salida: hora(9,10), prepacks_entrada: 3, prepacks_salida: 2, tiene_anomalia: true, notas: '1 prepack rechazado — prenda defectuosa' },
    { palet_id: 'PAL-002', etapa: 'REGISTRO',    timestamp_entrada: hora(9,10), timestamp_salida: hora(9,22), prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-002', etapa: 'SORTER',      timestamp_entrada: hora(9,22), timestamp_salida: hora(9,45), prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-002', etapa: 'BAHIA',       timestamp_entrada: hora(9,45), timestamp_salida: null,       prepacks_entrada: 2, prepacks_salida: 0 },
  ];
  for (const l of logs002) await prisma.paletEtapaLog.create({ data: l });

  // ── PaletEtapaLog — PAL-003: bahia incorrecta, en AUDITORIA ──────────────
  const logs003 = [
    { palet_id: 'PAL-003', etapa: 'PREREGISTRO', timestamp_entrada: hora(9,0),  timestamp_salida: hora(9,14),  prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-003', etapa: 'QA',          timestamp_entrada: hora(9,14), timestamp_salida: hora(9,30),  prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-003', etapa: 'REGISTRO',    timestamp_entrada: hora(9,30), timestamp_salida: hora(9,42),  prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-003', etapa: 'SORTER',      timestamp_entrada: hora(9,42), timestamp_salida: hora(10,8),  prepacks_entrada: 2, prepacks_salida: 2 },
    { palet_id: 'PAL-003', etapa: 'BAHIA',       timestamp_entrada: hora(10,8), timestamp_salida: hora(10,35), prepacks_entrada: 2, prepacks_salida: 2, tiene_anomalia: true, notas: '1 prepack detectado en bahia incorrecta' },
    { palet_id: 'PAL-003', etapa: 'AUDITORIA',   timestamp_entrada: hora(10,35),timestamp_salida: null,        prepacks_entrada: 2, prepacks_salida: 0 },
  ];
  for (const l of logs003) await prisma.paletEtapaLog.create({ data: l });

  // ── PaletEtapaLog — PAL-004: recien llegado ──────────────────────────────
  await prisma.paletEtapaLog.create({ data: {
    palet_id: 'PAL-004', etapa: 'PREREGISTRO', timestamp_entrada: hora(10,30), prepacks_entrada: 3
  }});

  // ── Demo eventos para Trazabilidad (7 etapas) ────────────────────────────
  const eventosOK = [
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-RECEPCION-1',  bahia: 'RAMPA-ENTRADA',  etapa: 'PREREGISTRO', rssi: -52.1, timestamp: hora(8,0) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-QA-1',         bahia: 'ZONA-QA',        etapa: 'QA',          rssi: -54.3, timestamp: hora(8,12) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-REGISTRO-1',   bahia: 'ZONA-REGISTRO',  etapa: 'REGISTRO',    rssi: -53.0, timestamp: hora(8,28) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-SORTER-1',     bahia: 'ZONA-SORTER',    etapa: 'SORTER',      rssi: -55.7, timestamp: hora(8,40) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-BAHIA-1',      bahia: 'BAHIA-1',        etapa: 'BAHIA',       rssi: -51.2, timestamp: hora(9,5) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-AUDITORIA-1',  bahia: 'ZONA-AUDITORIA', etapa: 'AUDITORIA',   rssi: -53.8, timestamp: hora(9,35) },
    { epc: 'DEMO0000000000000000OK01', lector_id: 'RFID-ENVIO-1',      bahia: 'MUELLE-SALIDA',  etapa: 'ENVIO',       rssi: -52.0, timestamp: hora(9,50) },
  ];
  for (const e of eventosOK) await prisma.eventoLectura.create({ data: e });

  const eventosERR = [
    { epc: 'DEMO000000000000000ERR02', lector_id: 'RFID-RECEPCION-1',  bahia: 'RAMPA-ENTRADA',  etapa: 'PREREGISTRO', rssi: -57.4, timestamp: hora(9,0) },
    { epc: 'DEMO000000000000000ERR02', lector_id: 'RFID-QA-1',         bahia: 'ZONA-QA',        etapa: 'QA',          rssi: -55.1, timestamp: hora(9,14) },
    { epc: 'DEMO000000000000000ERR02', lector_id: 'RFID-REGISTRO-1',   bahia: 'ZONA-REGISTRO',  etapa: 'REGISTRO',    rssi: -54.6, timestamp: hora(9,30) },
    { epc: 'DEMO000000000000000ERR02', lector_id: 'RFID-SORTER-1',     bahia: 'ZONA-SORTER',    etapa: 'SORTER',      rssi: -56.2, timestamp: hora(9,42) },
    { epc: 'DEMO000000000000000ERR02', lector_id: 'RFID-BAHIA-3',      bahia: 'BAHIA-3',        etapa: 'BAHIA',       rssi: -58.9, timestamp: hora(10,8) },
  ];
  for (const e of eventosERR) await prisma.eventoLectura.create({ data: e });

  await prisma.anomalia.create({ data: {
    epc: 'DEMO000000000000000ERR02', tipo_error: 'BAHIA_INCORRECTA',
    lector_id: 'RFID-BAHIA-3', bahia: 'BAHIA-3', etapa: 'BAHIA', proveedor_id: prov2.id,
    descripcion: 'Prepack enrutado a BAHIA-3 pero corresponde a BAHIA-3 (TDA-029) — bahia correcta pero posicion incorrecta',
    timestamp: hora(10,8)
  }});

  // Anomalia QA para PAL-002
  await prisma.anomalia.create({ data: {
    epc: 'E2003411B802011803B96107', tipo_error: 'QA_RECHAZADO',
    lector_id: 'RFID-QA-1', bahia: 'ZONA-QA', etapa: 'QA', proveedor_id: prov1.id,
    descripcion: 'Prenda defectuosa — rechazada en control de calidad',
    timestamp: hora(9,7)
  }});

  console.log('Seed V5 Definitivo completado.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
