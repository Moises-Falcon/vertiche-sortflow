const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/cajas — lista todas las cajas con prepacks
router.get('/', async (req, res) => {
  try {
    const cajas = await prisma.caja.findMany({
      include: { prepack_cajas: true },
      orderBy: { timestamp_creacion: 'desc' }
    });
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/cajas/:id/estado — estado de una caja especifica
router.get('/:id/estado', async (req, res) => {
  try {
    const caja = await prisma.caja.findUnique({
      where: { caja_id: req.params.id },
      include: { prepack_cajas: true }
    });

    if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });

    res.json({
      caja_id: caja.caja_id,
      tienda_destino: caja.tienda_destino,
      bahia: caja.bahia,
      estado: caja.estado,
      prepacks_dentro: caja.prepack_cajas.length,
      prepacks_esperados: null,
      completa: caja.estado === 'SELLADA'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/cajas — crear nueva caja
router.post('/', async (req, res) => {
  try {
    const { caja_id, tienda_destino, bahia } = req.body;

    if (!caja_id || !tienda_destino || !bahia) {
      return res.status(400).json({ error: 'caja_id, tienda_destino y bahia son requeridos' });
    }

    const caja = await prisma.caja.create({
      data: { caja_id, tienda_destino, bahia }
    });

    res.status(201).json(caja);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'La caja ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/cajas/:id/sellar — marcar caja como sellada
router.post('/:id/sellar', async (req, res) => {
  try {
    const caja = await prisma.caja.update({
      where: { caja_id: req.params.id },
      data: { estado: 'SELLADA', timestamp_sellado: new Date() }
    });
    res.json({ ok: true, timestamp_sellado: caja.timestamp_sellado });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
