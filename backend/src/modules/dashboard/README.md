# Módulo Dashboard

Módulo completo para gerenciamento financeiro do produtor rural com Prisma ORM e PostgreSQL.

## 📦 Estrutura do Banco de Dados

### Modelos Prisma

#### Produtor
- **id**: UUID único
- **nome**: Nome do produtor
- **cpfCnpj**: CPF ou CNPJ (único)
- **email**: E-mail (opcional)
- **telefone**: Telefone (opcional)
- **estado**: Estado (opcional)
- **cidade**: Cidade (opcional)
- **regime**: Regime tributário (MEI, Simples Nacional, Lucro Presumido, Lucro Real)
- **culturas**: JSON com array de culturas produzidas
- **createdAt**: Data de criação
- **updatedAt**: Data de atualização

#### NotaFiscal
- **id**: UUID único
- **produtorId**: Referência ao produtor
- **tipo**: "entrada" ou "saida"
- **numero**: Número da nota (opcional)
- **serie**: Série da nota (opcional)
- **produto**: Nome do produto/cultura
- **ncm**: Código NCM (opcional)
- **valor**: Valor total
- **quantidade**: Quantidade (opcional)
- **unidade**: Unidade de medida (opcional)
- **nomeEmitente**: Nome do emitente (opcional)
- **cpfCnpjEmitente**: CPF/CNPJ do emitente (opcional)
- **destino**: Estado de destino (opcional)
- **exportacao**: Se é exportação (boolean)
- **arquivoUrl**: URL do arquivo (foto ou PDF) (opcional)
- **arquivoTipo**: Tipo do arquivo ("foto" ou "pdf") (opcional)
- **valorCbs**: Valor CBS calculado
- **valorIbs**: Valor IBS calculado
- **valorFunrural**: Valor FUNRURAL calculado
- **valorTotal**: Valor total dos impostos
- **status**: Status da nota ("pendente", "validada", "erro")
- **observacoes**: Observações gerais
- **dataEmissao**: Data de emissão da nota
- **createdAt**: Data de criação
- **updatedAt**: Data de atualização

#### ImpostoCalculado
- **id**: UUID único
- **produtorId**: Referência ao produtor
- **mes**: Mês de referência (1-12)
- **ano**: Ano de referência
- **valorCbs**: Total CBS do mês
- **valorIbs**: Total IBS do mês
- **valorFunrural**: Total FUNRURAL do mês
- **valorTotal**: Total de impostos do mês
- **faturamento**: Faturamento bruto do mês
- **createdAt**: Data do cálculo

## 🚀 Endpoints Disponíveis

### Produtores

#### `POST /api/dashboard/produtores`
Criar novo produtor
```json
{
  "nome": "João Silva",
  "cpfCnpj": "123.456.789-00",
  "email": "joao@fazenda.com.br",
  "telefone": "(44) 99999-9999",
  "estado": "PR",
  "cidade": "Cascavel",
  "regime": "Simples Nacional",
  "culturas": "[\"Soja\", \"Milho\"]"
}
```

#### `GET /api/dashboard/produtores`
Listar todos os produtores com contagem de notas e impostos

#### `GET /api/dashboard/produtores/:id`
Buscar um produtor específico com suas últimas notas e histórico de impostos

#### `PATCH /api/dashboard/produtores/:id`
Atualizar dados do produtor

#### `DELETE /api/dashboard/produtores/:id`
Remover produtor (remove em cascata notas e impostos)

---

### Notas Fiscais

#### `POST /api/dashboard/notas`
Criar nova nota fiscal
```json
{
  "produtorId": "uuid-do-produtor",
  "tipo": "saida",
  "numero": "12345",
  "serie": "1",
  "produto": "Soja",
  "ncm": "12010000",
  "valor": 50000,
  "quantidade": 100,
  "unidade": "ton",
  "nomeEmitente": "Cooperativa ABC",
  "cpfCnpjEmitente": "12.345.678/0001-00",
  "destino": "SP",
  "exportacao": false,
  "arquivoUrl": "https://storage.exemplo.com/nota123.pdf",
  "arquivoTipo": "pdf",
  "valorCbs": 1760,
  "valorIbs": 3540,
  "valorFunrural": 600,
  "valorTotal": 5900,
  "observacoes": "Nota validada automaticamente",
  "dataEmissao": "2026-02-01T00:00:00.000Z"
}
```

#### `GET /api/dashboard/notas?produtorId=:id&ano=2026&mes=2`
Listar notas fiscais com filtros opcionais:
- **produtorId** (obrigatório): ID do produtor
- **ano**: Filtrar por ano
- **mes**: Filtrar por mês (requer ano)
- **dataInicio**: Data inicial do período
- **dataFim**: Data final do período

#### `GET /api/dashboard/notas/:id`
Buscar nota fiscal específica com dados do produtor

#### `PATCH /api/dashboard/notas/:id`
Atualizar nota fiscal (número, série, impostos, status, observações)

#### `DELETE /api/dashboard/notas/:id`
Remover nota fiscal

#### `GET /api/dashboard/notas/estatisticas/tipo?produtorId=:id`
Estatísticas de notas por tipo (entrada/saída)

---

### Dashboard Analytics

#### `GET /api/dashboard/:produtorId/resumo?ano=2026&mes=2`
Obter resumo completo do dashboard com:
- Fluxo de caixa (entradas, saídas, saldo, impostos, lucro estimado)
- Notas pendentes
- Top 5 produtos principais por faturamento
- Impostos por tipo (CBS, IBS, FUNRURAL)

**Resposta:**
```json
{
  "fluxoCaixa": {
    "totalEntradas": 150000,
    "totalSaidas": 250000,
    "saldo": 100000,
    "totalImpostos": 15000,
    "lucroEstimado": 85000,
    "qtdNotasEntrada": 5,
    "qtdNotasSaida": 8
  },
  "notasPendentes": 2,
  "produtosPrincipais": [
    { "produto": "Soja", "valor": 120000, "quantidade": 200 },
    { "produto": "Milho", "valor": 80000, "quantidade": 150 }
  ],
  "impostosPorTipo": {
    "cbs": 5000,
    "ibs": 8000,
    "funrural": 2000,
    "total": 15000
  }
}
```

#### `GET /api/dashboard/:produtorId/fluxo-caixa?ano=2026&mes=2`
Obter apenas fluxo de caixa detalhado

#### `GET /api/dashboard/:produtorId/produtos-principais?ano=2026`
Obter os 5 produtos com maior faturamento

#### `GET /api/dashboard/:produtorId/impostos?ano=2026&mes=2`
Obter detalhamento de impostos por tipo

#### `GET /api/dashboard/:produtorId/evolucao/:ano`
Obter evolução mensal do ano especificado (todos os 12 meses)
```
GET /api/dashboard/uuid-produtor/evolucao/2026
```

---

## 🎯 Casos de Uso

### 1. Upload de Nota Fiscal (Foto ou PDF)
```typescript
// 1. Fazer upload do arquivo para storage (S3, Azure Blob, etc)
const arquivoUrl = await uploadToStorage(file);

// 2. Criar nota fiscal com referência ao arquivo
POST /api/dashboard/notas
{
  "produtorId": "uuid",
  "tipo": "saida",
  "produto": "Soja",
  "valor": 50000,
  "arquivoUrl": "https://storage.com/notas/2026/nota-123.pdf",
  "arquivoTipo": "pdf",
  "dataEmissao": "2026-02-01T00:00:00.000Z"
}
```

### 2. Registro Automático de Entradas/Saídas
```typescript
// Entrada (compra de insumos)
POST /api/dashboard/notas
{
  "produtorId": "uuid",
  "tipo": "entrada",
  "produto": "Fertilizante",
  "valor": 10000,
  "dataEmissao": "2026-01-15T00:00:00.000Z"
}

// Saída (venda de produção)
POST /api/dashboard/notas
{
  "produtorId": "uuid",
  "tipo": "saida",
  "produto": "Soja",
  "valor": 50000,
  "valorCbs": 1760,
  "valorIbs": 3540,
  "valorFunrural": 600,
  "valorTotal": 5900,
  "dataEmissao": "2026-02-01T00:00:00.000Z"
}
```

### 3. Visualizar Fluxo de Caixa Mensal
```typescript
// Obter fluxo de caixa de fevereiro/2026
GET /api/dashboard/uuid-produtor/fluxo-caixa?ano=2026&mes=2

// Obter fluxo de caixa do ano completo
GET /api/dashboard/uuid-produtor/fluxo-caixa?ano=2026
```

### 4. Calcular Impostos Estimados
```typescript
// 1. Obter impostos do mês atual
GET /api/dashboard/uuid-produtor/impostos?ano=2026&mes=2

// 2. Integrar com o assistente de IA para cálculo detalhado
POST /api/chat/calcular
{
  "produto": "Soja",
  "valor": 50000,
  "destino": "SP"
}
```

---

## 🛠️ Configuração do Banco de Dados

### 1. Configurar PostgreSQL

Certifique-se de ter o PostgreSQL instalado e rodando. Crie o banco de dados:
```sql
CREATE DATABASE agrotributos;
```

### 2. Configurar Variável de Ambiente

No arquivo `.env`, configure a connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrotributos"
```

### 3. Executar Migration

Para criar as tabelas no banco:
```bash
npx prisma migrate dev --name init
```

### 4. (Opcional) Visualizar Dados com Prisma Studio
```bash
npx prisma studio
```

Acesse http://localhost:5555 para visualizar e editar dados visualmente.

---

## 🏗️ Arquitetura

```
src/modules/dashboard/
├── dashboard.module.ts         # Módulo principal
├── dashboard.controller.ts     # Endpoints REST
├── dashboard.service.ts        # Lógica de agregação e analytics
├── produtor.service.ts         # CRUD de produtores
├── nota-fiscal.service.ts      # CRUD de notas fiscais
├── dto/
│   └── dashboard.dto.ts        # DTOs com validação
└── README.md                   # Esta documentação
```

### Clean Architecture
- **DTOs**: Validação de entrada com class-validator e documentação Swagger
- **Services**: Lógica de negócio isolada
- **Controller**: Apenas roteamento e transformação de dados
- **Prisma**: Camada de acesso a dados type-safe

---

## 📊 Integração com IA

O módulo Dashboard integra-se perfeitamente com o módulo Chat (assistente de IA):

### Fluxo de Integração
1. Produtor cria nota fiscal via Dashboard
2. Dashboard pode chamar `POST /api/chat/analisar-nota` para validação automática
3. IA valida a nota e retorna sugestões/correções
4. Dashboard atualiza status da nota para "validada" ou "erro"
5. Cálculo de impostos pode usar `POST /api/chat/calcular` para estimativas

---

## 🔒 Segurança

- **Validação**: Todos os DTOs usam class-validator
- **Type Safety**: Prisma garante tipos corretos em tempo de compilação
- **Sanitização**: Dados são validados antes de serem salvos
- **Relacionamentos**: Cascade delete garante integridade referencial

---

## 📈 Roadmap

- [ ] Implementar upload de arquivos com Multer
- [ ] Adicionar autenticação JWT
- [ ] Criar serviço de cálculo automático de impostos
- [ ] Integração com OCR para leitura de notas fiscais
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Dashboard em tempo real com WebSockets
- [ ] Notificações de vencimentos de impostos

---

## 📝 Exemplos de Testes

```bash
# Testar criação de produtor
curl -X POST http://localhost:3000/api/dashboard/produtores \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpfCnpj": "123.456.789-00",
    "regime": "Simples Nacional",
    "culturas": "[\"Soja\", \"Milho\"]"
  }'

# Testar criação de nota
curl -X POST http://localhost:3000/api/dashboard/notas \
  -H "Content-Type: application/json" \
  -d '{
    "produtorId": "uuid-do-produtor",
    "tipo": "saida",
    "produto": "Soja",
    "valor": 50000,
    "dataEmissao": "2026-02-01T00:00:00.000Z"
  }'

# Testar dashboard
curl http://localhost:3000/api/dashboard/uuid-produtor/resumo?ano=2026&mes=2
```
