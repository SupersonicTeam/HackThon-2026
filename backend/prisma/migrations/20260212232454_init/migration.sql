-- CreateTable
CREATE TABLE "produtores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "estado" TEXT,
    "cidade" TEXT,
    "regime" TEXT NOT NULL,
    "culturas" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "chaveAcesso" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "cfop" TEXT,
    "naturezaOperacao" TEXT,
    "nomeEmitente" TEXT,
    "cpfCnpjEmitente" TEXT,
    "destino" TEXT,
    "exportacao" BOOLEAN NOT NULL DEFAULT false,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "valorProdutos" DOUBLE PRECISION,
    "valorFrete" DOUBLE PRECISION,
    "valorSeguro" DOUBLE PRECISION,
    "valorDesconto" DOUBLE PRECISION,
    "valorOutros" DOUBLE PRECISION,
    "valorCbs" DOUBLE PRECISION,
    "valorIbs" DOUBLE PRECISION,
    "valorFunrural" DOUBLE PRECISION,
    "valorIcms" DOUBLE PRECISION,
    "valorIpi" DOUBLE PRECISION,
    "arquivoUrl" TEXT,
    "arquivoTipo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_nota_fiscal" (
    "id" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
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

    CONSTRAINT "itens_nota_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impostos_calculados" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "faturamento" DOUBLE PRECISION NOT NULL,
    "custos" DOUBLE PRECISION,
    "lucro" DOUBLE PRECISION,
    "cbs" DOUBLE PRECISION NOT NULL,
    "ibs" DOUBLE PRECISION NOT NULL,
    "funrural" DOUBLE PRECISION NOT NULL,
    "outrosImpostos" DOUBLE PRECISION,
    "totalImpostos" DOUBLE PRECISION NOT NULL,
    "regime" TEXT NOT NULL,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impostos_calculados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produtores_cpfCnpj_key" ON "produtores"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_chaveAcesso_key" ON "notas_fiscais"("chaveAcesso");

-- CreateIndex
CREATE INDEX "notas_fiscais_produtorId_idx" ON "notas_fiscais"("produtorId");

-- CreateIndex
CREATE INDEX "notas_fiscais_tipo_idx" ON "notas_fiscais"("tipo");

-- CreateIndex
CREATE INDEX "notas_fiscais_dataEmissao_idx" ON "notas_fiscais"("dataEmissao");

-- CreateIndex
CREATE INDEX "notas_fiscais_chaveAcesso_idx" ON "notas_fiscais"("chaveAcesso");

-- CreateIndex
CREATE INDEX "itens_nota_fiscal_notaFiscalId_idx" ON "itens_nota_fiscal"("notaFiscalId");

-- CreateIndex
CREATE INDEX "itens_nota_fiscal_numeroItem_idx" ON "itens_nota_fiscal"("numeroItem");

-- CreateIndex
CREATE INDEX "impostos_calculados_produtorId_idx" ON "impostos_calculados"("produtorId");

-- CreateIndex
CREATE INDEX "impostos_calculados_anoReferencia_mesReferencia_idx" ON "impostos_calculados"("anoReferencia", "mesReferencia");

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos_calculados" ADD CONSTRAINT "impostos_calculados_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
