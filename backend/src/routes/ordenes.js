const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/ordenes — lista todas las ordenes de compra con resumen
router.get('/', async (req, res) => {
  try {
    const ordenes = await prisma.ordenCompra.findMany({
      include: {
        proveedor: { select: { nombre: true, codigo: true } },
        detalles: true,
        palets: {
          select: {
            palet_id: true,
            estado: true,
            tiempo_ciclo_min: true,
          }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    const resultado = ordenes.map(o => {
      const total_palets = o.palets.length;
      const tiemposCiclo = o.palets.filter(p => p.tiempo_ciclo_min != null).map(p => p.tiempo_ciclo_min);
      const tiempo_ciclo_promedio = tiemposCiclo.length > 0
        ? Math.round(tiemposCiclo.reduce((a, b) => a + b, 0) / tiemposCiclo.length)
        : null;

      return {
        orden_id: o.orden_id,
        proveedor: o.proveedor,
        modelo: o.modelo,
        descripcion: o.descripcion,
        estado: o.estado,
        total_esperados: o.total_esperados,
        total_recibidos: o.total_recibidos,
        faltantes: o.total_esperados - o.total_recibidos,
        porcentaje: o.total_esperados > 0
          ? Math.round((o.total_recibidos / o.total_esperados) * 100)
          : 0,
        detalles: o.detalles,
        total_palets,
        tiempo_ciclo_promedio,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error en /api/ordenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ordenes/:id — detalle completo de una orden con palets y tags
router.get('/:id', async (req, res) => {
  try {
    const orden = await prisma.ordenCompra.findUnique({
      where: { orden_id: req.params.id },
      include: {
        proveedor: true,
        detalles: true,
        palets: {
          include: {
            pedido: true,
            tags: {
              select: {
                epc: true, sku: true, talla: true, color: true,
                etapa_actual: true, tipo_flujo: true,
                tienda: { select: { tienda_id: true, nombre: true, bahia_asignada: true } },
                anomalias: { select: { id: true, tipo_error: true } }
              }
            }
          }
        }
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(orden);
  } catch (error) {
    console.error('Error en /api/ordenes/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
