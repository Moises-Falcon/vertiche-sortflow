const prisma = require('../db');

async function actualizarEstadoCaja(caja_id) {
  const caja = await prisma.caja.findUnique({
    where: { caja_id },
    include: { prepack_cajas: true }
  });

  if (!caja || caja.estado === 'SELLADA') return caja;

  const nuevoEstado = caja.prepack_cajas.length === 0 ? 'ABIERTA' : 'LLENANDO';

  if (nuevoEstado !== caja.estado) {
    return prisma.caja.update({
      where: { caja_id },
      data: { estado: nuevoEstado }
    });
  }

  return caja;
}

async function vincularPrepackACaja(epc, caja_id) {
  const vinculacion = await prisma.prepackCaja.upsert({
    where: { epc_caja_id: { epc, caja_id } },
    update: {},
    create: { epc, caja_id }
  });

  await actualizarEstadoCaja(caja_id);
  return vinculacion;
}

module.exports = { actualizarEstadoCaja, vincularPrepackACaja };
