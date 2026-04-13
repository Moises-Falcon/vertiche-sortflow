/*
  Warnings:

  - The values [ABIERTO,CERRADO] on the enum `EstadoPalet` will be removed. If these variants are still used in the database, this will fail.
  - The values [EN_RECEPCION,EN_CONTROL_CALIDAD,EN_DESVIACION,EN_CROSS_DOCK,EN_BAHIA,AUDITADO,ENTREGADO] on the enum `EstadoPrepack` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `palets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `palets` table. All the data in the column will be lost.
  - The primary key for the `pedidos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `tienda_id` on the `pedidos` table. All the data in the column will be lost.
  - The primary key for the `tiendas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `tiendas` table. All the data in the column will be lost.
  - Added the required column `palet_id` to the `palets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pedido_id` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proveedor_id` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bahia_asignada` to the `tiendas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tienda_id` to the `tiendas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPalet_new" AS ENUM ('ACTIVO', 'PROCESADO', 'DESPACHADO');
ALTER TABLE "palets" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "palets" ALTER COLUMN "estado" TYPE "EstadoPalet_new" USING ("estado"::text::"EstadoPalet_new");
ALTER TYPE "EstadoPalet" RENAME TO "EstadoPalet_old";
ALTER TYPE "EstadoPalet_new" RENAME TO "EstadoPalet";
DROP TYPE "EstadoPalet_old";
ALTER TABLE "palets" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPrepack_new" AS ENUM ('EN_TRANSITO', 'RECEPCION', 'CONTROL_CALIDAD', 'DESVIACION', 'EN_ALMACEN', 'CROSS_DOCK', 'BAHIA', 'AUDITORIA', 'COMPLETADO');
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" DROP DEFAULT;
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" TYPE "EstadoPrepack_new" USING ("etapa_actual"::text::"EstadoPrepack_new");
ALTER TYPE "EstadoPrepack" RENAME TO "EstadoPrepack_old";
ALTER TYPE "EstadoPrepack_new" RENAME TO "EstadoPrepack";
DROP TYPE "EstadoPrepack_old";
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" SET DEFAULT 'EN_TRANSITO';
COMMIT;

-- DropForeignKey
ALTER TABLE "cajas" DROP CONSTRAINT "cajas_tienda_id_fkey";

-- DropForeignKey
ALTER TABLE "palets" DROP CONSTRAINT "palets_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_tienda_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_palet_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_tienda_id_fkey";

-- AlterTable
ALTER TABLE "palets" DROP CONSTRAINT "palets_pkey",
DROP COLUMN "id",
ADD COLUMN     "orden_id" TEXT,
ADD COLUMN     "palet_id" TEXT NOT NULL,
ADD COLUMN     "tiempo_ciclo_min" INTEGER,
ADD COLUMN     "timestamp_llegada" TIMESTAMP(3),
ADD COLUMN     "timestamp_salida" TIMESTAMP(3),
ADD COLUMN     "total_prepacks" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "estado" SET DEFAULT 'ACTIVO',
ADD CONSTRAINT "palets_pkey" PRIMARY KEY ("palet_id");

-- AlterTable
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_pkey",
DROP COLUMN "id",
DROP COLUMN "tienda_id",
ADD COLUMN     "fecha_llegada" TIMESTAMP(3),
ADD COLUMN     "pedido_id" TEXT NOT NULL,
ADD COLUMN     "proveedor_id" INTEGER NOT NULL,
ADD COLUMN     "total_esperados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_recibidos" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "pedidos_pkey" PRIMARY KEY ("pedido_id");

-- AlterTable
ALTER TABLE "tiendas" DROP CONSTRAINT "tiendas_pkey",
DROP COLUMN "id",
ADD COLUMN     "bahia_asignada" TEXT NOT NULL,
ADD COLUMN     "estado_rep" TEXT,
ADD COLUMN     "tienda_id" TEXT NOT NULL,
ADD CONSTRAINT "tiendas_pkey" PRIMARY KEY ("tienda_id");

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "orden_id" TEXT NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "modelo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "total_esperados" INTEGER NOT NULL,
    "total_recibidos" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("orden_id")
);

-- CreateTable
CREATE TABLE "detalle_orden" (
    "id" SERIAL NOT NULL,
    "orden_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "detalle_orden_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_orden" ADD CONSTRAINT "detalle_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_compra"("orden_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palets" ADD CONSTRAINT "palets_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("pedido_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "palets" ADD CONSTRAINT "palets_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_compra"("orden_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("tienda_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_palet_id_fkey" FOREIGN KEY ("palet_id") REFERENCES "palets"("palet_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("pedido_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("tienda_id") ON DELETE RESTRICT ON UPDATE CASCADE;
