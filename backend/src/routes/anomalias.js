const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/anomalias?proveedor_id=1&tipo=TAG_DUPLICADO&desde=2026-04-01&limit=50
router.get('/', async (req, res) => {
  try {
    const { proveedor_id, tipo, desde, limit = 50 } = req.query;

    const where = {};
    if (proveedor_id) where.proveedor_id = parseInt(proveedor_id);
    if (tipo) where.tipo_error = tipo;
    if (desde) where.timestamp = { gte: new Date(desde) };

    const anomalias = await prisma.anomalia.findMany({
      where,
      include: { tag: true, proveedor: true },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json(anomalias);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/anomalias/:id/resolver — marcar anomalia como resuelta
router.patch('/:id/resolver', async (req, res) => {
  try {
    const anomalia = await prisma.anomalia.update({
      where: { id: parseInt(req.params.id) },
      data: { resuelto: true }
    });
    res.json(anomalia);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Anomalia no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
