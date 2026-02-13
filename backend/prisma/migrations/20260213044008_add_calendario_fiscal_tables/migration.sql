-- CreateTable
CREATE TABLE "eventos_fiscais" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "mesVencimento" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "regime" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes_fiscais" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "eventoFiscalId" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "diasAntecedencia" INTEGER NOT NULL,
    "dataNotificacao" TIMESTAMP(3) NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tentativasEnvio" INTEGER NOT NULL DEFAULT 0,
    "ultimaTentativa" TIMESTAMP(3),
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_mensais" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkDownload" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "contadorEmail" TEXT,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "envioAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "diaEnvio" INTEGER,
    "incluirAnexos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendencias_contador" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "contadorId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataLimite" TIMESTAMP(3) NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtendimento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "prioridade" TEXT NOT NULL,
    "tiposDocumentos" TEXT NOT NULL,
    "observacoes" TEXT,
    "observacoesProduto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendencias_contador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_anexados" (
    "id" TEXT NOT NULL,
    "pendenciaId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "checksum" TEXT,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_anexados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacotes_documentos" (
    "id" TEXT NOT NULL,
    "pendenciaId" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "nomePacote" TEXT NOT NULL,
    "nomeArquivoZip" TEXT NOT NULL,
    "linkDownload" TEXT NOT NULL,
    "senha" TEXT,
    "tamanho" INTEGER NOT NULL,
    "quantidadeArquivos" INTEGER NOT NULL,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "ultimoDownload" TIMESTAMP(3),
    "contadorNotificado" BOOLEAN NOT NULL DEFAULT false,
    "dataNotificacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacotes_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_fiscais_produtorId_idx" ON "eventos_fiscais"("produtorId");

-- CreateIndex
CREATE INDEX "eventos_fiscais_tipo_idx" ON "eventos_fiscais"("tipo");

-- CreateIndex
CREATE INDEX "eventos_fiscais_diaVencimento_idx" ON "eventos_fiscais"("diaVencimento");

-- CreateIndex
CREATE INDEX "notificacoes_fiscais_produtorId_idx" ON "notificacoes_fiscais"("produtorId");

-- CreateIndex
CREATE INDEX "notificacoes_fiscais_dataVencimento_idx" ON "notificacoes_fiscais"("dataVencimento");

-- CreateIndex
CREATE INDEX "notificacoes_fiscais_enviado_idx" ON "notificacoes_fiscais"("enviado");

-- CreateIndex
CREATE INDEX "relatorios_mensais_produtorId_idx" ON "relatorios_mensais"("produtorId");

-- CreateIndex
CREATE INDEX "relatorios_mensais_mes_ano_idx" ON "relatorios_mensais"("mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_mensais_produtorId_mes_ano_key" ON "relatorios_mensais"("produtorId", "mes", "ano");

-- CreateIndex
CREATE INDEX "pendencias_contador_produtorId_idx" ON "pendencias_contador"("produtorId");

-- CreateIndex
CREATE INDEX "pendencias_contador_status_idx" ON "pendencias_contador"("status");

-- CreateIndex
CREATE INDEX "pendencias_contador_dataLimite_idx" ON "pendencias_contador"("dataLimite");

-- CreateIndex
CREATE INDEX "pendencias_contador_prioridade_idx" ON "pendencias_contador"("prioridade");

-- CreateIndex
CREATE INDEX "documentos_anexados_pendenciaId_idx" ON "documentos_anexados"("pendenciaId");

-- CreateIndex
CREATE INDEX "documentos_anexados_tipoDocumento_idx" ON "documentos_anexados"("tipoDocumento");

-- CreateIndex
CREATE INDEX "pacotes_documentos_produtorId_idx" ON "pacotes_documentos"("produtorId");

-- CreateIndex
CREATE INDEX "pacotes_documentos_pendenciaId_idx" ON "pacotes_documentos"("pendenciaId");

-- CreateIndex
CREATE INDEX "pacotes_documentos_dataExpiracao_idx" ON "pacotes_documentos"("dataExpiracao");

-- AddForeignKey
ALTER TABLE "eventos_fiscais" ADD CONSTRAINT "eventos_fiscais_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_fiscais" ADD CONSTRAINT "notificacoes_fiscais_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_fiscais" ADD CONSTRAINT "notificacoes_fiscais_eventoFiscalId_fkey" FOREIGN KEY ("eventoFiscalId") REFERENCES "eventos_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_mensais" ADD CONSTRAINT "relatorios_mensais_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_contador" ADD CONSTRAINT "pendencias_contador_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_anexados" ADD CONSTRAINT "documentos_anexados_pendenciaId_fkey" FOREIGN KEY ("pendenciaId") REFERENCES "pendencias_contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacotes_documentos" ADD CONSTRAINT "pacotes_documentos_pendenciaId_fkey" FOREIGN KEY ("pendenciaId") REFERENCES "pendencias_contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacotes_documentos" ADD CONSTRAINT "pacotes_documentos_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "produtores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
