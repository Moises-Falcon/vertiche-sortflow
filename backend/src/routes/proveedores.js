const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/proveedores/resumen
router.get('/resumen', async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      include: {
        tags: { select: { epc: true } },
        anomalias: { select: { id: true, tipo_error: true, timestamp: true } }
      }
    });

    const resumen = proveedores.map(p => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      contacto: p.contacto,
      total_tags: p.tags.length,
      total_anomalias: p.anomalias.length,
      tasa_error: p.tags.length > 0
        ? ((p.anomalias.length / p.tags.length) * 100).toFixed(2) + '%'
        : '0%',
      anomalias_por_tipo: p.anomalias.reduce((acc, a) => {
        acc[a.tipo_error] = (acc[a.tipo_error] || 0) + 1;
        return acc;
      }, {})
    }));

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/proveedores/:id/anomalias
router.get('/:id/anomalias', async (req, res) => {
  try {
    const anomalias = await prisma.anomalia.findMany({
      where: { proveedor_id: parseInt(req.params.id) },
      include: { tag: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(anomalias);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/proveedores — lista todos los proveedores
router.get('/', async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
