-- AlterEnum
ALTER TYPE "TipoAnomalia" ADD VALUE 'QA_RECHAZADO';

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "qa_fallido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qa_motivo_fallo" TEXT,
ADD COLUMN     "qa_timestamp" TIMESTAMP(3);
