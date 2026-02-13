-- CreateTable
CREATE TABLE "rascunhos_nota" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "contadorId" TEXT,
    "tipo" TEXT NOT NULL,
    "cfop" TEXT,
    "naturezaOperacao" TEXT,
    "nomeDestinatario" TEXT NOT NULL,
    "cpfCnpjDestinatario" TEXT,
    "ufDestino" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "chaveTemporaria" TEXT NOT NULL,
    "feedbackContador" TEXT,
    "correcoesSugeridas" TEXT,
    "dadosCorrigidos" TEXT,
    "notaFinalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataEnvio" TIMESTAMP(3),
    "dataFeedback" TIMESTAMP(3),
    "dataFinalizacao" TIMESTAMP(3),

    CONSTRAINT "rascunhos_nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_rascunho_nota" (
    "id" TEXT NOT NULL,
    "rascunhoNotaId" TEXT NOT NULL,
    "numeroItem" INTEGER NOT NULL,
    "codigoProduto" TEXT,
    "descricao" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "unidade" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "valorDesconto" DOUBLE PRECISION,
    "valorFrete" DOUBLE PRECISION,
    "baseCalculoIcms" DOUBLE PRECISION,
    "valorIcms" DOUBLE PRECISION,
    "aliquotaIcms" DOUBLE PRECISION,
    "baseCalculoIpi" DOUBLE PRECISION,
    "valorIpi" DOUBLE PRECISION,
    "aliquotaIpi" DOUBLE PRECISION,
    "valorCbs" DOUBLE PRECISION,
    "valorIbs" DOUBLE PRECISION,
    "valorFunrural" DOUBLE PRECISION,
    "informacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_rascunho_nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rascunhos_nota_chaveTemporaria_key" ON "rascunhos_nota"("chaveTemporaria");

-- AddForeignKey
ALTER TABLE "rascunhos_nota" ADD CONSTRAINT "rascunhos_nota_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunhos_nota" ADD CONSTRAINT "rascunhos_nota_notaFinalId_fkey" FOREIGN KEY ("notaFinalId") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_rascunho_nota" ADD CONSTRAINT "itens_rascunho_nota_rascunhoNotaId_fkey" FOREIGN KEY ("rascunhoNotaId") REFERENCES "rascunhos_nota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
