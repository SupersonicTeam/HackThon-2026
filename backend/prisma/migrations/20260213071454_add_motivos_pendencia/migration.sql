-- DropIndex
DROP INDEX "pendencias_contador_dataLimite_idx";

-- DropIndex
DROP INDEX "pendencias_contador_prioridade_idx";

-- DropIndex
DROP INDEX "pendencias_contador_produtorId_idx";

-- DropIndex
DROP INDEX "pendencias_contador_status_idx";

-- AlterTable
ALTER TABLE "pendencias_contador" ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "motivoRejeicao" TEXT;

-- CreateTable
CREATE TABLE "agenda_itens" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "pendenciaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "tipo" TEXT NOT NULL DEFAULT 'pendencia-contador',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agenda_itens_pendenciaId_key" ON "agenda_itens"("pendenciaId");

-- CreateIndex
CREATE INDEX "agenda_itens_produtorId_idx" ON "agenda_itens"("produtorId");

-- CreateIndex
CREATE INDEX "agenda_itens_data_idx" ON "agenda_itens"("data");

-- CreateIndex
CREATE INDEX "agenda_itens_status_idx" ON "agenda_itens"("status");

-- AddForeignKey
ALTER TABLE "agenda_itens" ADD CONSTRAINT "agenda_itens_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_itens" ADD CONSTRAINT "agenda_itens_pendenciaId_fkey" FOREIGN KEY ("pendenciaId") REFERENCES "pendencias_contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
