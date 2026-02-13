# 🌾 AgroTributos API

Backend da plataforma educativa sobre reforma tributária no agronegócio brasileiro.

## 📋 Sobre o Projeto

API desenvolvida com NestJS que fornece um assistente de IA especializado em tributação do agronegócio, ajudando produtores rurais a entenderem a reforma tributária de 2026 (CBS e IBS).

### ✅ Funcionalidades Implementadas

#### 🤖 Assistente IA Personalizado

- ✅ **Chatbot com linguagem simples** - João, o contador tributarista amigável
- ✅ **Responde dúvidas fiscais** - Conhecimento completo sobre CBS, IBS, FUNRURAL
- ✅ **Utiliza dados reais das notas** - Análise personalizada de notas fiscais
- ✅ **Simulações e previsões tributárias** - Cálculo de impostos por regime
- ✅ **Orientações sobre preenchimento de notas** - Validação e prevenção de erros
- ✅ **Dicas para melhorar lucro** - Análise financeira com recomendações práticas
- ✅ **Prevenção de erros humanos** - Identificação de problemas antes de emitir notas

#### 💰 Calculadora de Impostos

- ✅ **Calcular imposto por produto** - Análise detalhada por cultura
- ✅ **Simulação de preço para melhor lucro** - Preço ideal considerando impostos e margem

#### 📊 Dashboard de Gerenciamento Financeiro

- ✅ **Cadastro de produtores** - Gestão completa de dados do produtor
- ✅ **Registro de notas fiscais** - Upload e armazenamento de notas (entrada/saída)
- ✅ **Fluxo de caixa** - Controle de entradas, saídas, saldo e impostos
- ✅ **Analytics financeiro** - Top produtos, evolução mensal, impostos por tipo
- ✅ **Banco de dados PostgreSQL** - Armazenamento persistente com Prisma ORM
- ✅ **Filtros inteligentes** - Consultas por período (ano, mês, datas)

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** >= 16.14
- **npm** >= 8.0
- **Chave API OpenAI** (obtenha em [platform.openai.com](https://platform.openai.com/api-keys))

### 1. Instalação

```bash
# Clone o repositório
git clone https://github.com/SupersonicTeam/HackThon-2026.git
cd HackThon-2026/backend

# Instale as dependências
npm install
```

### 2. Configuração

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione sua chave da OpenAI
# OPENAI_API_KEY=sk-sua-chave-aqui
```

**Variáveis obrigatórias:**

- `OPENAI_API_KEY` - Chave da API OpenAI
- `PORT` - Porta do servidor (padrão: 3001)

**Variáveis opcionais:**

- `CORS_ORIGINS` - URLs permitidas para CORS
- `NODE_ENV` - Ambiente de execução
- `SUPABASE_URL` e `SUPABASE_KEY` - Para futuras integrações

### 3. Executar

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A API estará disponível em:

- 🌐 **API**: http://localhost:3001
- 📚 **Swagger**: http://localhost:3001/api/docs

## 📡 Endpoints Disponíveis

### 1. Chat com IA (Dúvidas Gerais)

```http
POST /api/chat
Content-Type: application/json

{
  "message": "O que é CBS e como funciona no agronegócio?",
  "context": {
    "regimeTributario": "simples",
    "culturas": ["Soja", "Milho"],
    "history": []
  }
}
```

**Resposta:**

```json
{
  "response": "Olha só, a CBS...",
  "sources": ["openai"],
  "timestamp": "2026-02-12T22:30:00.000Z"
}
```

### 2. Calcular Impostos

```http
POST /api/chat/calcular
Content-Type: application/json

{
  "faturamentoAnual": 500000,
  "regime": "simples",
  "culturas": ["Soja", "Milho"],
  "custoInsumos": 150000
}
```

**Resposta:** Análise detalhada com impostos por regime, comparativo e recomendações.

### 3. Analisar Nota Fiscal ⭐ NOVO

```http
POST /api/chat/analisar-nota
Content-Type: application/json

{
  "nota": {
    "tipo": "saida",
    "produto": "Soja",
    "valor": 50000,
    "quantidade": 100,
    "destino": "SP",
    "exportacao": false
  },
  "regimeTributario": "simples"
}
```

**Funcionalidades:**

- ✅ Validação de dados da nota
- ✅ Identificação de erros
- ✅ Cálculo de impostos aplicáveis
- ✅ Orientações de preenchimento correto
- ✅ Dicas de economia tributária
- ✅ Prevenção de multas e penalidades

### 4. Simular Preço de Venda ⭐ NOVO

```http
POST /api/chat/simular-preco
Content-Type: application/json

{
  "produto": "Soja",
  "custoProducao": 30000,
  "quantidade": 100,
  "regime": "simples",
  "margemLucro": 20,
  "exportacao": false
}
```

**Retorna:**

- 💰 Preço mínimo (ponto de equilíbrio)
- 📊 Preço com margem desejada
- 📈 Simulação de múltiplos cenários
- 💡 Recomendações de precificação
- ⚠️ Alertas de prejuízo

### 5. Dicas para Aumentar Lucro ⭐ NOVO

```http
POST /api/chat/dicas-lucro
Content-Type: application/json

{
  "faturamentoAnual": 500000,
  "custoTotal": 350000,
  "regime": "simples",
  "culturas": ["Soja", "Milho"],
  "notas": [
    {
      "tipo": "saida",
      "produto": "Soja",
      "valor": 200000,
      "exportacao": false
    }
  ]
}
```

**Análise inclui:**

- 📊 Diagnóstico da situação financeira
- 💰 Oportunidades de economia tributária
- 📈 Dicas práticas para aumentar lucro
- ⚠️ Prevenção de erros comuns
- ✅ Plano de ação com potencial de ganho

---

## 📊 Módulo Dashboard (Gerenciamento Financeiro)

O **Dashboard** é um módulo completo para gerenciamento financeiro do produtor rural com Prisma ORM e PostgreSQL.

### ⚙️ Configuração do Banco de Dados

#### 1. Instalar PostgreSQL

Certifique-se de ter o PostgreSQL instalado e rodando:

```bash
# Windows (com Chocolatey)
choco install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql

# macOS (com Homebrew)
brew install postgresql
```

#### 2. Criar Banco de Dados

```sql
CREATE DATABASE agrotributos;
```

#### 3. Configurar Connection String

No arquivo `.env`, configure:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrotributos"
```

#### 4. Executar Migrations

```bash
# Cria as tabelas no banco de dados
npx prisma migrate dev --name init

# (Opcional) Visualizar dados com Prisma Studio
npx prisma studio
```

### 🎯 Funcionalidades do Dashboard

#### ✅ Gerenciamento de Produtores

- Cadastro completo (nome, CPF/CNPJ, regime tributário, culturas)
- Listagem com estatísticas (notas, impostos)
- Atualização de dados
- Remoção com cascade (notas e impostos)

#### ✅ Gerenciamento de Notas Fiscais

- Upload de notas (foto ou PDF) - campos preparados
- Registro automático de entradas/saídas
- Filtros por período (ano, mês, data inicial/final)
- Validação automática de dados
- Cálculo e armazenamento de impostos (CBS, IBS, FUNRURAL)

#### ✅ Analytics e Relatórios

- **Fluxo de Caixa**: Entradas, saídas, saldo, impostos, lucro estimado
- **Top 5 Produtos**: Ranking por faturamento
- **Impostos por Tipo**: Detalhamento CBS, IBS, FUNRURAL
- **Evolução Mensal**: Análise mês a mês do ano
- **Notas Pendentes**: Contagem de notas aguardando validação

### 📝 Endpoints do Dashboard

```http
# Criar produtor
POST /api/dashboard/produtores

# Listar produtores
GET /api/dashboard/produtores

# Criar nota fiscal
POST /api/dashboard/notas

# Listar notas (com filtros)
GET /api/dashboard/notas?produtorId=uuid&ano=2026&mes=2

# Obter resumo completo do dashboard
GET /api/dashboard/:produtorId/resumo?ano=2026&mes=2

# Obter fluxo de caixa
GET /api/dashboard/:produtorId/fluxo-caixa?ano=2026

# Obter evolução mensal
GET /api/dashboard/:produtorId/evolucao/2026
```

**📄 Documentação completa:** [Dashboard README](src/modules/dashboard/README.md)

---

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── modules/
│   │   ├── chat/              # Módulo do assistente IA
│   │   │   ├── ai.service.ts      # Integração OpenAI + Lógica IA
│   │   │   ├── chat.service.ts    # Orquestração
│   │   │   ├── chat.controller.ts # 6 endpoints REST
│   │   │   └── dto/               # DTOs com validação
│   │   └── dashboard/         # Módulo de gerenciamento financeiro
│   │       ├── dashboard.service.ts    # Analytics e agregações
│   │       ├── produtor.service.ts     # CRUD produtores
│   │       ├── nota-fiscal.service.ts  # CRUD notas fiscais
│   │       ├── dashboard.controller.ts # Endpoints REST
│   │       ├── dashboard.module.ts     # Módulo Dashboard
│   │       ├── dto/                    # DTOs com validação
│   │       └── README.md               # Documentação completa
│   ├── prisma/                # Módulo Prisma ORM
│   │   ├── prisma.service.ts      # PrismaClient wrapper
│   │   └── prisma.module.ts       # Módulo global
│   ├── app.module.ts          # Módulo raiz
│   └── main.ts                # Bootstrap + Swagger
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── .env                       # Variáveis de ambiente (não commitar)
├── .env.example               # Template de configuração
└── package.json
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📦 Scripts Disponíveis

```bash
npm run start          # Inicia em modo normal
npm run start:dev      # Inicia com hot-reload
npm run start:debug    # Inicia com debugger
npm run build          # Compila para produção
npm run lint           # Executa linter
npm run format         # Formata código com Prettier
```

## 🔒 Segurança

- ✅ Validação de entrada com `class-validator`
- ✅ CORS configurado dinamicamente
- ✅ Variáveis sensíveis em `.env` (não versionado)
- ✅ Dependências auditadas regularmente
- ✅ Sem vulnerabilidades conhecidas

## 🛠️ Tecnologias

- **Framework**: [NestJS](https://nestjs.com/) v10
- **IA**: [OpenAI GPT-4](https://openai.com/) (gpt-4o-mini)
- **Database ORM**: [Prisma](https://www.prisma.io/) v7 (PostgreSQL)
- **Validação**: class-validator + class-transformer
- **Documentação**: Swagger/OpenAPI 3.0
- **TypeScript**: Tipagem estática completa
- **Banco de Dados**: PostgreSQL

## 📊 Comparativo: Antes x Agora

| Funcionalidade               | Antes | Agora |
| ---------------------------- | ----- | ----- |
| Chat básico                  | ✅    | ✅    |
| Cálculo de impostos          | ✅    | ✅    |
| Análise de notas             | ❌    | ✅    |
| Validação de erros           | ❌    | ✅    |
| Simulação de preços          | ❌    | ✅    |
| Dicas de lucro               | ❌    | ✅    |
| Prevenção de problemas       | ❌    | ✅    |
| Usa dados do usuário         | ❌    | ✅    |
| **Gerenciamento financeiro** | ❌    | ✅    |
| **Banco de dados (Prisma)**  | ❌    | ✅    |
| **Dashboard analytics**      | ❌    | ✅    |
| **CRUD produtores/notas**    | ❌    | ✅    |
| **Fluxo de caixa**           | ❌    | ✅    |
| **Relatórios mensais**       | ❌    | ✅    |

## 🎯 Cobertura do README do Projeto

Todas as funcionalidades do "Assistente IA Personalizado" e "Calculadora de Impostos" estão **100% implementadas**:

- ✅ Chatbot com linguagem simples
- ✅ Responde dúvidas fiscais
- ✅ Utiliza dados reais das notas do usuário
- ✅ Simulações e previsões tributárias
- ✅ Orientações sobre preenchimento correto de notas
- ✅ Dicas para melhorar lucro
- ✅ Prevenção de erros humanos
- ✅ Calcular imposto por produto
- ✅ Simulação de preço para melhor lucro

## 📝 Próximos Passos

- [ ] Implementar upload de arquivos com Multer (campos já preparados)
- [ ] Integração com OCR para leitura automática de notas fiscais
- [ ] Calendário fiscal com notificações
- [ ] Autenticação e autorização (JWT)
- [ ] Módulo para contadores
- [ ] Integração WhatsApp
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Dashboard em tempo real com WebSockets

## 📝 Licença

Este projeto foi desenvolvido para o Hackathon ShowRural 2026.

## 👥 Equipe SuperSonic

Desenvolvido com ❤️ pela equipe SuperSonic Team.

---

**Dúvidas?** Confira a documentação completa em http://localhost:3001/api/docs
