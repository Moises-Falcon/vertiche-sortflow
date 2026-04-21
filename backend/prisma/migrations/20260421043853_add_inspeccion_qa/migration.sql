-- CreateEnum
CREATE TYPE "ResultadoQA" AS ENUM ('APROBADO', 'OBSERVADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "inspeccion_qa" (
    "id" SERIAL NOT NULL,
    "tag_epc" TEXT NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "operador_id" TEXT NOT NULL,
    "resultado" "ResultadoQA" NOT NULL,
    "defecto_tipo" TEXT,
    "observacion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspeccion_qa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspeccion_qa_tag_epc_idx" ON "inspeccion_qa"("tag_epc");

-- CreateIndex
CREATE INDEX "inspeccion_qa_proveedor_id_idx" ON "inspeccion_qa"("proveedor_id");

-- CreateIndex
CREATE INDEX "inspeccion_qa_fecha_idx" ON "inspeccion_qa"("fecha");

-- AddForeignKey
ALTER TABLE "inspeccion_qa" ADD CONSTRAINT "inspeccion_qa_tag_epc_fkey" FOREIGN KEY ("tag_epc") REFERENCES "tags"("epc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_qa" ADD CONSTRAINT "inspeccion_qa_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
