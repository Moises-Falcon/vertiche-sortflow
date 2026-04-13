const prisma = require('../db');

const VENTANA_DUPLICADO_MS = 5000;

// Mapa lector_id -> EtapaRFID (fallback para lecturas sin campo etapa)
function lectorAEtapa(lector_id) {
  if (lector_id.includes('RECEPCION')) return 'PREREGISTRO';
  if (lector_id.includes('QA'))        return 'QA';
  if (lector_id.includes('REGISTRO'))  return 'REGISTRO';
  if (lector_id.includes('SORTER'))    return 'SORTER';
  if (lector_id.includes('BAHIA'))     return 'BAHIA';
  if (lector_id.includes('AUDITORIA')) return 'AUDITORIA';
  if (lector_id.includes('ENVIO'))     return 'ENVIO';
  return 'PREREGISTRO';
}

// Etapa -> EstadoPrepack para actualizar tag.etapa_actual
function etapaAEstado(etapa) {
  const mapa = {
    PREREGISTRO: 'PREREGISTRO',
    QA:          'QA',
    REGISTRO:    'REGISTRO',
    SORTER:      'SORTER',
    BAHIA:       'BAHIA',
    AUDITORIA:   'AUDITORIA',
    ENVIO:       'ENVIO',
  };
  return mapa[etapa] || 'EN_TRANSITO';
}

// Registrar cambio de etapa en palet_etapa_log
async function registrarCambioEtapaPalet(palet_id, etapa_nueva) {
  if (!palet_id) return;

  // Cerrar logs de etapas DIFERENTES que estén abiertas
  await prisma.paletEtapaLog.updateMany({
    where: { palet_id, timestamp_salida: null, etapa: { not: etapa_nueva } },
    data: { timestamp_salida: new Date() }
  });

  // Buscar si ya existe un log abierto para esta etapa
  const existente = await prisma.paletEtapaLog.findFirst({
    where: { palet_id, etapa: etapa_nueva, timestamp_salida: null }
  });

  if (!existente) {
    await prisma.paletEtapaLog.create({
      data: { palet_id, etapa: etapa_nueva, prepacks_entrada: 1 }
    });
  } else {
    await prisma.paletEtapaLog.update({
      where: { id: existente.id },
      data: { prepacks_entrada: { increment: 1 } }
    });
  }
}

async function procesarLectura({ epc, lector_id, bahia, etapa, rssi, antenna_port }, io) {
  const timestamp = new Date();
  const etapaRFID = etapa || lectorAEtapa(lector_id);

  // 1. Buscar el tag
  const tag = await prisma.tag.findUnique({
    where: { epc },
    include: { proveedor: true, tienda: true }
  });

  // 2. Tag desconocido
  if (!tag) {
    await prisma.anomalia.create({
      data: {
        epc: null,
        tipo_error: 'TAG_DESCONOCIDO',
        lector_id,
        bahia,
        etapa: etapaRFID,
        descripcion: `EPC desconocido: ${epc}`
      }
    });
    io.emit('anomalia', { tipo: 'TAG_DESCONOCIDO', epc, lector_id, bahia, etapa: etapaRFID, timestamp });
    return { status: 'anomalia', tipo: 'TAG_DESCONOCIDO' };
  }

  // 3. Verificar duplicado reciente
  const lecturaReciente = await prisma.eventoLectura.findFirst({
    where: { epc, timestamp: { gte: new Date(timestamp - VENTANA_DUPLICADO_MS) } }
  });
  const esDuplicado = !!lecturaReciente;

  if (esDuplicado) {
    await prisma.anomalia.create({
      data: {
        epc,
        tipo_error: 'TAG_DUPLICADO',
        lector_id,
        bahia,
        etapa: etapaRFID,
        proveedor_id: tag.proveedor_id
      }
    });
    io.emit('anomalia', { tipo: 'TAG_DUPLICADO', epc, lector_id, bahia, etapa: etapaRFID, timestamp });
  }

  // 4. Verificar bahia correcta usando bahia_asignada de la tienda
  if (etapaRFID === 'BAHIA' && tag.tienda?.bahia_asignada) {
    const bahiaEsperada = tag.tienda.bahia_asignada;
    if (bahia !== bahiaEsperada) {
      await prisma.anomalia.create({
        data: {
          epc,
          tipo_error: 'BAHIA_INCORRECTA',
          lector_id,
          bahia,
          etapa: etapaRFID,
          proveedor_id: tag.proveedor_id,
          descripcion: `Esperada: ${bahiaEsperada}, recibida: ${bahia}`
        }
      });
      io.emit('anomalia', { tipo: 'BAHIA_INCORRECTA', epc, lector_id, bahia, etapa: etapaRFID, tienda: tag.tienda_id, timestamp });
    }
  }

  // 5. Guardar evento de lectura
  const evento = await prisma.eventoLectura.create({
    data: {
      epc,
      lector_id,
      bahia,
      etapa: etapaRFID,
      rssi: rssi || null,
      antenna_port: antenna_port || null,
      es_duplicado: esDuplicado,
      timestamp
    },
    include: { tag: { include: { proveedor: true, tienda: true } } }
  });

  // 6. Actualizar etapa_actual del tag
  await prisma.tag.update({
    where: { epc },
    data: { etapa_actual: etapaAEstado(etapaRFID) }
  });

  // 7. Registrar cambio de etapa en palet
  await registrarCambioEtapaPalet(tag.palet_id, etapaRFID);

  // 8. Emitir lectura en tiempo real
  io.emit('lectura', {
    id: evento.id,
    epc,
    lector_id,
    bahia,
    etapa: etapaRFID,
    timestamp,
    tienda_id: tag.tienda_id,
    tienda_nombre: tag.tienda?.nombre || null,
    sku: tag.sku,
    proveedor: tag.proveedor.nombre,
    es_duplicado: esDuplicado,
    pedido_id: tag.pedido_id
  });

  return { status: 'ok', evento };
}

module.exports = { procesarLectura };
