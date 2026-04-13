const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/trazabilidad/:epc — historial completo de un prepack
router.get('/:epc', async (req, res) => {
  try {
    const { epc } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { epc },
      include: {
        proveedor: true,
        tienda: true,
        palet: { include: { pedido: { include: { proveedor: true } } } },
        eventos: { orderBy: { timestamp: 'asc' } },
        prepack_cajas: { include: { caja: { include: { tienda: true } } } },
        anomalias: { orderBy: { timestamp: 'asc' } }
      }
    });

    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });

    const timeline = [
      ...tag.eventos.map(e => ({
        tiempo: e.timestamp,
        tipo: 'LECTURA',
        lector: e.lector_id,
        bahia: e.bahia,
        detalle: e.etapa,
        es_duplicado: e.es_duplicado
      })),
      ...tag.anomalias.map(a => ({
        tiempo: a.timestamp,
        tipo: 'ANOMALIA',
        lector: a.lector_id,
        bahia: a.bahia,
        detalle: a.tipo_error,
        etapa: a.etapa,
        descripcion: a.descripcion
      })),
      ...tag.prepack_cajas.map(p => ({
        tiempo: p.timestamp_vinculacion,
        tipo: 'VINCULACION_CAJA',
        caja: p.caja_id,
        tienda: p.caja.tienda?.nombre || p.caja.tienda_id,
        es_correcto: p.es_correcto
      }))
    ].sort((a, b) => new Date(a.tiempo) - new Date(b.tiempo));

    res.json({ tag, timeline });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/trazabilidad?sku=BLU-F-M-001 — buscar por SKU
router.get('/', async (req, res) => {
  try {
    const { sku } = req.query;
    if (!sku) return res.status(400).json({ error: 'Se requiere parametro sku' });

    const tags = await prisma.tag.findMany({
      where: { sku },
      include: {
        proveedor: true,
        tienda: true,
        eventos: { orderBy: { timestamp: 'desc' }, take: 1 }
      }
    });

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
