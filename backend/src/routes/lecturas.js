const express = require('express');
const router = express.Router();
const { procesarLectura } = require('../services/lecturaService');
const prisma = require('../db');

// POST /api/lecturas — recibe del lector RFID o del simulador
router.post('/', async (req, res) => {
  try {
    const { epc, lector_id, bahia, etapa, rssi, antenna_port } = req.body;

    if (!epc || !lector_id || !bahia) {
      return res.status(400).json({ error: 'epc, lector_id y bahia son requeridos' });
    }

    const resultado = await procesarLectura({ epc, lector_id, bahia, etapa, rssi, antenna_port }, req.io);
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error procesando lectura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/lecturas?bahia=BAHIA-3&limit=50
router.get('/', async (req, res) => {
  try {
    const { bahia, limit = 50 } = req.query;

    const eventos = await prisma.eventoLectura.findMany({
      where: bahia ? { bahia } : {},
      include: { tag: { include: { proveedor: true } } },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
