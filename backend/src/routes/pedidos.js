const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/pedidos — lista todos los pedidos con resumen
router.get('/', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        proveedor: { select: { nombre: true, codigo: true } },
        palets: {
          include: {
            tags: {
              select: { epc: true, etapa_actual: true, tipo_flujo: true, anomalias: { select: { id: true } } }
            }
          }
        }
      },
      orderBy: { fecha_pedido: 'desc' }
    });

    const resultado = pedidos.map(p => {
      const tags = p.palets.flatMap(pal => pal.tags);
      const total_tags = tags.length;
      const total_anomalias = tags.reduce((acc, t) => acc + t.anomalias.length, 0);

      const por_etapa = tags.reduce((acc, t) => {
        acc[t.etapa_actual] = (acc[t.etapa_actual] || 0) + 1;
        return acc;
      }, {});

      const completados = tags.filter(t =>
        t.etapa_actual === 'AUDITORIA' || t.etapa_actual === 'EN_ALMACEN' || t.etapa_actual === 'COMPLETADO'
      ).length;

      return {
        pedido_id: p.pedido_id,
        proveedor: p.proveedor,
        estado: p.estado,
        fecha_pedido: p.fecha_pedido,
        fecha_llegada: p.fecha_llegada,
        fecha_entrega_estimada: p.fecha_entrega_estimada,
        total_esperados: p.total_esperados,
        total_recibidos: p.total_recibidos,
        total_palets: p.palets.length,
        palets: p.palets.map(pal => ({ palet_id: pal.palet_id, estado: pal.estado })),
        total_tags,
        total_anomalias,
        completados,
        progreso_pct: total_tags > 0 ? Math.round((completados / total_tags) * 100) : 0,
        por_etapa
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error en /api/pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pedidos/:id — detalle completo de un pedido
router.get('/:id', async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { pedido_id: req.params.id },
      include: {
        proveedor: true,
        palets: {
          include: {
            tags: {
              select: {
                epc: true, sku: true, talla: true, color: true,
                tipo_flujo: true, etapa_actual: true,
                tienda: { select: { tienda_id: true, nombre: true, bahia_asignada: true } },
                anomalias: { select: { id: true, tipo_error: true } }
              }
            }
          }
        }
      }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const tags = pedido.palets.flatMap(pal => pal.tags);
    const por_flujo = tags.reduce((acc, t) => {
      acc[t.tipo_flujo] = (acc[t.tipo_flujo] || 0) + 1;
      return acc;
    }, {});
    const por_etapa = tags.reduce((acc, t) => {
      acc[t.etapa_actual] = (acc[t.etapa_actual] || 0) + 1;
      return acc;
    }, {});

    res.json({ ...pedido, resumen: { por_flujo, por_etapa, total_tags: tags.length } });
  } catch (error) {
    console.error('Error en /api/pedidos/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
