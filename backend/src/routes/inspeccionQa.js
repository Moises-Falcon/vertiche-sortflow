const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET /api/qa/prepacks-pendientes
// Lista tags en etapa QA que no tienen inspeccion_qa registrada
router.get('/prepacks-pendientes', async (req, res) => {
  try {
    const inspeccionados = await prisma.inspeccionQA.findMany({ select: { tag_epc: true } });
    const epcsInspeccionados = new Set(inspeccionados.map(i => i.tag_epc));

    const tagsEnQA = await prisma.tag.findMany({
      where: { etapa_actual: 'QA' },
      include: { proveedor: true, tienda: true, palet: true, pedido: true },
      orderBy: { registrado_en: 'desc' },
    });

    const pendientes = tagsEnQA.filter(t => !epcsInspeccionados.has(t.epc));
    res.json(pendientes);
  } catch (err) {
    console.error('Error en GET /qa/prepacks-pendientes:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inspeccion-qa
// Registra el resultado de una inspección de QA
router.post('/', async (req, res) => {
  try {
    const { tag_epc, proveedor_id, operador_id, resultado, defecto_tipo, observacion } = req.body;

    if (!tag_epc || !proveedor_id || !operador_id || !resultado) {
      return res.status(400).json({ error: 'Faltan campos requeridos: tag_epc, proveedor_id, operador_id, resultado' });
    }

    if (!['APROBADO', 'OBSERVADO', 'RECHAZADO'].includes(resultado)) {
      return res.status(400).json({ error: 'resultado debe ser APROBADO, OBSERVADO o RECHAZADO' });
    }

    const inspeccion = await prisma.inspeccionQA.create({
      data: {
        tag_epc,
        proveedor_id: parseInt(proveedor_id, 10),
        operador_id,
        resultado,
        defecto_tipo: defecto_tipo || null,
        observacion: observacion || null,
      },
    });

    if (resultado === 'RECHAZADO') {
      await prisma.tag.update({
        where: { epc: tag_epc },
        data: {
          qa_fallido: true,
          qa_motivo_fallo: defecto_tipo || observacion || 'Rechazado en inspección QA',
          qa_timestamp: new Date(),
        },
      });
    }

    res.status(201).json(inspeccion);
  } catch (err) {
    console.error('Error en POST /inspeccion-qa:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
