const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/tiendas — lista tiendas activas
router.get('/', async (req, res) => {
  try {
    const tiendas = await prisma.tienda.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tiendas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
