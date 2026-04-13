const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET /api/palets/:id — detalle completo de un palet
router.get('/:id', async (req, res) => {
  try {
    const palet = await prisma.palet.findUnique({
      where: { palet_id: req.params.id },
      include: {
        etapa_logs: { orderBy: { timestamp_entrada: 'asc' } },
        pedido: { include: { proveedor: true } },
        orden: true,
        tags: {
          include: {
            proveedor: { select: { nombre: true, codigo: true } },
            tienda: { select: { tienda_id: true, nombre: true, bahia_asignada: true } },
            eventos: { orderBy: { timestamp: 'asc' } },
            anomalias: { orderBy: { timestamp: 'desc' }, take: 3 }
          },
          orderBy: { registrado_en: 'asc' }
        }
      }
    });

    if (!palet) return res.status(404).json({ error: 'Palet no encontrado' });

    // Campos calculados
    const tags = palet.tags || [];
    const totalEsperados = palet.total_prepacks || tags.length;
    const tagsOk = tags.filter(t => !t.qa_fallido);
    const enBahia = tagsOk.filter(t => t.etapa_actual === 'BAHIA').length;
    const enAuditoria = tagsOk.filter(t => t.etapa_actual === 'AUDITORIA').length;
    const enEnvio = tagsOk.filter(t => t.etapa_actual === 'ENVIO' || t.etapa_actual === 'COMPLETADO').length;
    const procesados = enBahia + enAuditoria + enEnvio;

    res.json({
      ...palet,
      nombre_producto: palet.orden?.nombre_producto || palet.orden?.modelo || palet.palet_id,
      tags_ok: tagsOk.length,
      tags_fallidos: tags.filter(t => t.qa_fallido).length,
      progreso: {
        sorter: totalEsperados > 0 ? Math.round(procesados / totalEsperados * 100) : 0,
        bahia: totalEsperados > 0 ? Math.round((enAuditoria + enEnvio) / totalEsperados * 100) : 0,
        auditoria: totalEsperados > 0 ? Math.round(enEnvio / totalEsperados * 100) : 0,
        envio: totalEsperados > 0 ? Math.round(enEnvio / totalEsperados * 100) : 0,
      }
    });
  } catch (error) {
    console.error('Error en /api/palets/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/palets/:id/validacion — comparar recibido vs esperado en orden de compra
router.get('/:id/validacion', async (req, res) => {
  try {
    const palet = await prisma.palet.findUnique({
      where: { palet_id: req.params.id },
      include: {
        orden: { include: { detalles: true } },
        tags: { select: { sku: true, talla: true, color: true, qa_fallido: true } }
      }
    });

    if (!palet) return res.status(404).json({ error: 'Palet no encontrado' });

    const detalles = palet.orden?.detalles || [];
    const tagsActivos = palet.tags.filter(t => !t.qa_fallido);
    const esperados = detalles.reduce((s, d) => s + d.cantidad, 0);
    const recibidos = tagsActivos.length;

    // Comparar por color+talla
    const detalleFaltantes = detalles.map(d => {
      const recibido = tagsActivos.filter(t => t.color === d.color && t.talla === d.talla).length;
      return {
        color: d.color,
        talla: d.talla,
        sku: d.sku,
        cantidad_esperada: d.cantidad,
        cantidad_recibida: recibido,
        diferencia: recibido - d.cantidad
      };
    }).filter(d => d.diferencia !== 0);

    const faltantes = Math.max(0, esperados - recibidos);
    const excedentes = Math.max(0, recibidos - esperados);

    res.json({
      palet_id: palet.palet_id,
      orden_id: palet.orden_id,
      esperados,
      recibidos,
      faltantes,
      excedentes,
      estado_validacion: faltantes > 0 ? 'INCOMPLETO' : excedentes > 0 ? 'EXCEDENTE' : 'COMPLETO',
      detalle_faltantes: detalleFaltantes
    });
  } catch (error) {
    console.error('Error en validacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/palets/:id/qa-fallidos — tags rechazados en QA
router.get('/:id/qa-fallidos', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { palet_id: req.params.id, qa_fallido: true },
      include: { tienda: true }
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
