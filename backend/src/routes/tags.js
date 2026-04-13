const express = require('express');
const router = express.Router();
const prisma = require('../db');

// POST /api/tags — vincular nuevo tag RFID con su prepack
router.post('/', async (req, res) => {
  try {
    const { epc, sku, talla, color, cantidad_piezas, tienda_id, proveedor_id, palet_id, pedido_id, tipo_flujo } = req.body;

    if (!epc || !sku || !tienda_id) {
      return res.status(400).json({ error: 'epc, sku y tienda_id son requeridos' });
    }

    const tag = await prisma.tag.create({
      data: {
        epc,
        sku,
        talla: talla || '',
        color: color || '',
        cantidad_piezas: parseInt(cantidad_piezas) || 12,
        tienda_id,
        proveedor_id: parseInt(proveedor_id) || 1,
        palet_id: palet_id || null,
        pedido_id: pedido_id || null,
        tipo_flujo: tipo_flujo || 'CROSS_DOCK',
        etapa_actual: 'EN_TRANSITO'
      },
      include: { proveedor: true, tienda: true }
    });

    res.status(201).json(tag);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El EPC ya esta registrado en el sistema' });
    }
    console.error('Error creando tag:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tags/:epc — datos completos de un prepack
router.get('/:epc', async (req, res) => {
  try {
    const tag = await prisma.tag.findUnique({
      where: { epc: req.params.epc },
      include: { proveedor: true, tienda: true }
    });

    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tags — listar todos los tags
router.get('/', async (req, res) => {
  try {
    const { proveedor_id, tienda_id } = req.query;
    const where = {};
    if (proveedor_id) where.proveedor_id = parseInt(proveedor_id);
    if (tienda_id)    where.tienda_id = tienda_id;

    const tags = await prisma.tag.findMany({
      where,
      include: { proveedor: true, tienda: true },
      orderBy: { registrado_en: 'desc' }
    });

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/tags/:epc/qa-fallo — marcar prepack como fallido en QA
router.patch('/:epc/qa-fallo', async (req, res) => {
  try {
    const { motivo } = req.body;
    const tag = await prisma.tag.findUnique({ where: { epc: req.params.epc } });
    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });

    await prisma.tag.update({
      where: { epc: req.params.epc },
      data: {
        qa_fallido: true,
        qa_motivo_fallo: motivo || 'Sin motivo especificado',
        qa_timestamp: new Date(),
        etapa_actual: 'COMPLETADO'
      }
    });

    await prisma.anomalia.create({
      data: {
        epc: req.params.epc,
        tipo_error: 'QA_RECHAZADO',
        lector_id: 'RFID-QA-1',
        bahia: 'ZONA-QA',
        etapa: 'QA',
        proveedor_id: tag.proveedor_id,
        descripcion: motivo || 'Prepack rechazado en QA'
      }
    });

    // Actualizar palet_etapa_log de QA si existe
    if (tag.palet_id) {
      const logQA = await prisma.paletEtapaLog.findFirst({
        where: { palet_id: tag.palet_id, etapa: 'QA' }
      });
      if (logQA) {
        await prisma.paletEtapaLog.update({
          where: { id: logQA.id },
          data: {
            tiene_anomalia: true,
            notas: logQA.notas
              ? `${logQA.notas}; ${motivo}`
              : motivo || 'Prepack rechazado'
          }
        });
      }
    }

    res.json({ ok: true, epc: req.params.epc });
  } catch (error) {
    console.error('Error en qa-fallo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
