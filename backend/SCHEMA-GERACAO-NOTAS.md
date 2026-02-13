# 📋 Schema Prisma - Tabelas para Sistema de Geração de Nota Fiscal

## 🔧 Adicionar ao schema.prisma

Adicione os seguintes modelos ao seu arquivo `schema.prisma` para suportar o sistema de geração de notas fiscais com rascunhos:

```prisma
// Rascunho de Nota Fiscal
model RascunhoNota {
  id                   String   @id @default(cuid())
  
  // Relacionamentos
  produtorId          String
  produtor            Produtor @relation(fields: [produtorId], references: [id])
  contadorId          String?
  
  // Dados da Nota
  tipo                String   // 'entrada' | 'saida'
  cfop                String?
  naturezaOperacao    String?
  nomeDestinatario    String
  cpfCnpjDestinatario String?
  ufDestino           String?
  dataEmissao         DateTime
  valorTotal          Float    @default(0)
  observacoes         String?
  
  // Controle de Workflow
  status              String   @default("draft") // draft, enviado, revisao, aprovado, reprovado, finalizado
  chaveTemporaria     String   @unique
  
  // Feedback do Contador
  feedbackContador    String?
  correcoesSugeridas  String?
  dadosCorrigidos     String? // JSON com correções
  
  // Relacionamento com Nota Final
  notaFinalId         String?
  notaFinal          NotaFiscal? @relation(fields: [notaFinalId], references: [id])
  
  // Timestamps
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  dataEnvio          DateTime?
  dataFeedback       DateTime?
  dataFinalizacao    DateTime?
  
  // Itens do Rascunho
  itens              ItemRascunhoNota[]
  
  @@map("rascunhos_nota")
}

// Item do Rascunho de Nota Fiscal
model ItemRascunhoNota {
  id                String  @id @default(cuid())
  
  // Relacionamento com Rascunho
  rascunhoNotaId    String
  rascunhoNota      RascunhoNota @relation(fields: [rascunhoNotaId], references: [id], onDelete: Cascade)
  
  // Dados do Item
  numeroItem        Int
  codigoProduto     String?
  descricao         String
  ncm               String?
  cfop              String?
  unidade           String?
  quantidade        Float
  valorUnitario     Float
  valorTotal        Float
  valorDesconto     Float?
  valorFrete        Float?
  
  // Impostos do Item
  baseCalculoIcms   Float?
  valorIcms         Float?
  aliquotaIcms      Float?
  baseCalculoIpi    Float?
  valorIpi          Float?
  aliquotaIpi       Float?
  valorCbs          Float?
  valorIbs          Float?
  valorFunrural     Float?
  
  informacoes       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("itens_rascunho_nota")
}
```

## 🔄 Atualizar Modelo NotaFiscal

Adicione esta linha ao modelo `NotaFiscal` existente para suportar a relação com rascunhos:

```prisma
model NotaFiscal {
  // ... campos existentes ...
  
  // Relacionamento com Rascunhos (uma nota pode vir de um rascunho)
  rascunhos         RascunhoNota[]
  
  // ... resto do modelo ...
}
```

## 🔄 Atualizar Modelo Produtor

Adicione esta linha ao modelo `Produtor` existente:

```prisma
model Produtor {
  // ... campos existentes ...
  
  // Relacionamento com Rascunhos
  rascunhos         RascunhoNota[]
  
  // ... resto do modelo ...
}
```

## 🚀 Como Aplicar as Mudanças

1. **Adicione os modelos** ao seu arquivo `schema.prisma`

2. **Gere as migrações**:
```bash
npx prisma migrate dev --name add-rascunho-nota-system
```

3. **Gere o cliente Prisma**:
```bash
npx prisma generate
```

## 📊 Relacionamentos

### Fluxo do Sistema:
```
Produtor → RascunhoNota → ItemRascunhoNota
    ↓
RascunhoNota → NotaFiscal (quando finalizado)
```

### Estados do Rascunho:
- `draft`: Rascunho sendo criado/editado
- `enviado`: Enviado para análise do contador
- `revisao`: Contador solicitou revisão
- `aprovado`: Contador aprovou
- `reprovado`: Contador reprovou
- `finalizado`: Nota fiscal gerada

## 🎯 Funcionalidades Suportadas

- ✅ Criação de rascunhos de nota fiscal
- ✅ Edição de rascunhos (apenas em draft)
- ✅ Envio para contador
- ✅ Sistema de feedback do contador
- ✅ Aprovação/reprovação/revisão
- ✅ Geração da nota fiscal final
- ✅ Histórico completo do processo
- ✅ Múltiplos itens por rascunho
- ✅ Cálculo automático de totais
- ✅ Relacionamento com nota final

## 🔍 Consultas Úteis

### Rascunhos pendentes do contador:
```typescript
const rascunhosPendentes = await prisma.rascunhoNota.findMany({
  where: { status: 'enviado' },
  include: { produtor: true, itens: true }
});
```

### Rascunhos do produtor:
```typescript
const rascunhosProdutor = await prisma.rascunhoNota.findMany({
  where: { produtorId: 'xxx' },
  orderBy: { createdAt: 'desc' }
});
```

### Notas geradas a partir de rascunhos:
```typescript
const notasDeRascunho = await prisma.notaFiscal.findMany({
  include: { rascunhos: true }
});
```