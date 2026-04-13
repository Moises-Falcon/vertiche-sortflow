-- CreateEnum
CREATE TYPE "EtapaRFID" AS ENUM ('RECEPCION', 'CONTROL_CALIDAD', 'DESVIACION', 'CROSS_DOCK', 'BAHIA', 'AUDITORIA');

-- CreateEnum
CREATE TYPE "EstadoPrepack" AS ENUM ('EN_TRANSITO', 'EN_RECEPCION', 'EN_CONTROL_CALIDAD', 'EN_DESVIACION', 'EN_ALMACEN', 'EN_CROSS_DOCK', 'EN_BAHIA', 'AUDITADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "TipoFlujo" AS ENUM ('CROSS_DOCK', 'NUEVA_TIENDA', 'REFILL');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPalet" AS ENUM ('ABIERTO', 'CERRADO', 'DESPACHADO');

-- CreateEnum
CREATE TYPE "EstadoCaja" AS ENUM ('ABIERTA', 'LLENANDO', 'LLENA', 'SELLADA');

-- CreateEnum
CREATE TYPE "TipoAnomalia" AS ENUM ('TAG_DESCONOCIDO', 'TAG_DUPLICADO', 'BAHIA_INCORRECTA', 'TIENDA_INCORRECTA', 'LECTURA_FALLIDA');

-- CreateTable
CREATE TABLE "tiendas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega_estimada" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "palets" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "estado" "EstadoPalet" NOT NULL DEFAULT 'ABIERTO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "epc" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "cantidad_piezas" INTEGER NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "tienda_id" TEXT,
    "palet_id" TEXT,
    "pedido_id" TEXT,
    "tipo_flujo" "TipoFlujo" NOT NULL DEFAULT 'CROSS_DOCK',
    "etapa_actual" "EstadoPrepack" NOT NULL DEFAULT 'EN_TRANSITO',
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("epc")
);

-- CreateTable
CREATE TABLE "eventos_lectura" (
    "id" SERIAL NOT NULL,
    "epc" TEXT NOT NULL,
    "lector_id" TEXT NOT NULL,
    "bahia" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etapa" "EtapaRFID" NOT NULL,
    "rssi" DOUBLE PRECISION,
    "antenna_port" TEXT,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "eventos_lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "caja_id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "bahia" TEXT NOT NULL,
    "estado" "EstadoCaja" NOT NULL DEFAULT 'ABIERTA',
    "timestamp_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp_sellado" TIMESTAMP(3),

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("caja_id")
);

-- CreateTable
CREATE TABLE "prepack_caja" (
    "id" SERIAL NOT NULL,
    "epc" TEXT NOT NULL,
    "caja_id" TEXT NOT NULL,
    "timestamp_vinculacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_correcto" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "prepack_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalias" (
    "id" SERIAL NOT NULL,
    "epc" TEXT,
    "tipo_error" "TipoAnomalia" NOT NULL,
    "lector_id" TEXT NOT NULL,
    "bahia" TEXT NOT NULL,
    "etapa" "EtapaRFID",
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor_id" INTEGER,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,

    CONSTRAINT "anomalias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE INDEX "eventos_lectura_epc_idx" ON "eventos_lectura"("epc");

-- CreateIndex
CREATE INDEX "eventos_lectura_timestamp_idx" ON "eventos_lectura"("timestamp");

-- CreateIndex
CREATE INDEX "eventos_lectura_bahia_idx" ON "eventos_lectura"("bahia");

-- CreateIndex
CREATE UNIQUE INDEX "prepack_caja_epc_caja_id_key" ON "prepack_caja"("epc", "caja_id");

-- CreateIndex
CREATE INDEX "anomalias_timestamp_idx" ON "anomalias"("timestamp");

-- CreateIndex
CREATE INDEX "anomalias_proveedor_id_idx" ON "anomalias"("proveedor_id");

-- CreateIndex
CREATE INDEX "anomalias_tipo_error_idx" ON "anomalias"("tipo_error");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palets" ADD CONSTRAINT "palets_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_palet_id_fkey" FOREIGN KEY ("palet_id") REFERENCES "palets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_lectura" ADD CONSTRAINT "eventos_lectura_epc_fkey" FOREIGN KEY ("epc") REFERENCES "tags"("epc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepack_caja" ADD CONSTRAINT "prepack_caja_epc_fkey" FOREIGN KEY ("epc") REFERENCES "tags"("epc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepack_caja" ADD CONSTRAINT "prepack_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("caja_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalias" ADD CONSTRAINT "anomalias_epc_fkey" FOREIGN KEY ("epc") REFERENCES "tags"("epc") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalias" ADD CONSTRAINT "anomalias_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
