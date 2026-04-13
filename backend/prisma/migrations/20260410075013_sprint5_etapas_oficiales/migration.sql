-- AlterTable: agregar campos a ordenes_compra primero
ALTER TABLE "ordenes_compra" ADD COLUMN     "foto_url" TEXT,
ADD COLUMN     "nombre_producto" TEXT;

-- CreateTable: palet_etapa_log (antes de alterar enums porque lo referencia)
CREATE TABLE "palet_etapa_log" (
    "id" SERIAL NOT NULL,
    "palet_id" TEXT NOT NULL,
    "etapa" "EtapaRFID" NOT NULL,
    "timestamp_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp_salida" TIMESTAMP(3),
    "prepacks_entrada" INTEGER NOT NULL DEFAULT 0,
    "prepacks_salida" INTEGER NOT NULL DEFAULT 0,
    "tiene_anomalia" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,

    CONSTRAINT "palet_etapa_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "palet_etapa_log_palet_id_idx" ON "palet_etapa_log"("palet_id");
CREATE INDEX "palet_etapa_log_etapa_idx" ON "palet_etapa_log"("etapa");
ALTER TABLE "palet_etapa_log" ADD CONSTRAINT "palet_etapa_log_palet_id_fkey" FOREIGN KEY ("palet_id") REFERENCES "palets"("palet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Limpiar datos que usan los enums viejos (reset limpio)
DELETE FROM "palet_etapa_log";
DELETE FROM "anomalias";
DELETE FROM "eventos_lectura";
UPDATE "tags" SET "etapa_actual" = 'EN_TRANSITO';

-- AlterEnum EstadoPrepack
CREATE TYPE "EstadoPrepack_new" AS ENUM ('EN_TRANSITO', 'PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO', 'COMPLETADO');
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" DROP DEFAULT;
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" TYPE "EstadoPrepack_new" USING ("etapa_actual"::text::"EstadoPrepack_new");
ALTER TYPE "EstadoPrepack" RENAME TO "EstadoPrepack_old";
ALTER TYPE "EstadoPrepack_new" RENAME TO "EstadoPrepack";
DROP TYPE "EstadoPrepack_old";
ALTER TABLE "tags" ALTER COLUMN "etapa_actual" SET DEFAULT 'EN_TRANSITO';

-- AlterEnum EtapaRFID
CREATE TYPE "EtapaRFID_new" AS ENUM ('PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO');
ALTER TABLE "palet_etapa_log" ALTER COLUMN "etapa" TYPE "EtapaRFID_new" USING ("etapa"::text::"EtapaRFID_new");
ALTER TABLE "eventos_lectura" ALTER COLUMN "etapa" TYPE "EtapaRFID_new" USING ("etapa"::text::"EtapaRFID_new");
ALTER TABLE "anomalias" ALTER COLUMN "etapa" TYPE "EtapaRFID_new" USING ("etapa"::text::"EtapaRFID_new");
ALTER TYPE "EtapaRFID" RENAME TO "EtapaRFID_old";
ALTER TYPE "EtapaRFID_new" RENAME TO "EtapaRFID";
DROP TYPE "EtapaRFID_old";
