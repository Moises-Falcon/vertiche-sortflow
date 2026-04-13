const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/dashboard/eventos/resumen?fecha=2026-04-03
router.get('/eventos/resumen', async (req, res) => {
  try {
    const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const [totalEventos, porBahia, porHora] = await Promise.all([
      prisma.eventoLectura.count({ where: { timestamp: { gte: inicio, lte: fin } } }),
      prisma.eventoLectura.groupBy({
        by: ['bahia'],
        _count: { id: true },
        where: { timestamp: { gte: inicio, lte: fin } }
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('hour', timestamp) as hora, COUNT(*)::int as total
        FROM eventos_lectura
        WHERE timestamp >= ${inicio} AND timestamp <= ${fin}
        GROUP BY hora ORDER BY hora
      `
    ]);

    res.json({ totalEventos, porBahia, porHora });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/anomalias/resumen?fecha=2026-04-03
router.get('/anomalias/resumen', async (req, res) => {
  try {
    const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const [total, porTipo, porBahia] = await Promise.all([
      prisma.anomalia.count({ where: { timestamp: { gte: inicio, lte: fin } } }),
      prisma.anomalia.groupBy({
        by: ['tipo_error'],
        _count: { id: true },
        where: { timestamp: { gte: inicio, lte: fin } }
      }),
      prisma.anomalia.groupBy({
        by: ['bahia'],
        _count: { id: true },
        where: { timestamp: { gte: inicio, lte: fin } }
      })
    ]);

    res.json({ total, porTipo, porBahia });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/cajas/resumen
router.get('/cajas/resumen', async (req, res) => {
  try {
    const resumen = await prisma.caja.groupBy({
      by: ['estado'],
      _count: { caja_id: true }
    });
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/throughput?bahia=BAHIA-3
router.get('/throughput', async (req, res) => {
  try {
    const { bahia } = req.query;
    const hace5min = new Date(Date.now() - 5 * 60 * 1000);

    const count = await prisma.eventoLectura.count({
      where: {
        ...(bahia ? { bahia } : {}),
        timestamp: { gte: hace5min },
        es_duplicado: false
      }
    });

    res.json({
      bahia: bahia || 'todas',
      paquetes_ultimos_5min: count,
      paquetes_por_minuto: (count / 5).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/kpi-ciclo — KPI de tiempo de ciclo vs manual
router.get('/kpi-ciclo', async (req, res) => {
  try {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setHours(0, 0, 0, 0);

    const paletsCompletados = await prisma.palet.findMany({
      where: {
        tiempo_ciclo_min: { not: null },
        timestamp_salida: { gte: inicio }
      },
      select: { tiempo_ciclo_min: true }
    });

    const paletsActivos = await prisma.palet.count({
      where: { estado: 'ACTIVO' }
    });

    const TIEMPO_SIN_RFID = 180; // 3 horas referencia proceso manual
    const tiempos = paletsCompletados.map(p => p.tiempo_ciclo_min).filter(Boolean);
    const promedio = tiempos.length > 0 ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null;
    const mejora = promedio ? parseFloat(((TIEMPO_SIN_RFID - promedio) / TIEMPO_SIN_RFID * 100).toFixed(1)) : null;

    res.json({
      tiempo_promedio_hoy_min: promedio,
      tiempo_sin_rfid_min: TIEMPO_SIN_RFID,
      mejora_porcentaje: mejora,
      palets_completados_hoy: paletsCompletados.length,
      palets_activos: paletsActivos,
      objetivo_mejora_pct: 32
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
