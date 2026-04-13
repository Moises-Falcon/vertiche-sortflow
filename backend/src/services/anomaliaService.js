const prisma = require('../db');

async function registrarAnomalia({ epc, tipo_error, lector_id, bahia, proveedor_id, descripcion }) {
  return prisma.anomalia.create({
    data: {
      epc: epc || null,
      tipo_error,
      lector_id,
      bahia,
      proveedor_id: proveedor_id || null,
      descripcion: descripcion || null
    }
  });
}

async function resolverAnomalia(id) {
  return prisma.anomalia.update({
    where: { id },
    data: { resuelto: true }
  });
}

module.exports = { registrarAnomalia, resolverAnomalia };
