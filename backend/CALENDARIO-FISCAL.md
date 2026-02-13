# 📅 Calendário Fiscal - AgroTributos

## 📋 Visão Geral

Sistema completo para gerenciar **prazos fiscais**, **notificações automáticas**, **pendências do contador** e **envio de documentos** via link de download seguro. Mantém o produtor rural sempre em dia com suas obrigações tributárias e facilita a comunicação com o contador.

## 🎯 Funcionalidades Principais

### 1. **Prazos e Obrigações Fiscais**

- ✅ DAS - Simples Nacional (dia 20)
- ✅ FUNRURAL (dia 20)
- ✅ ITR - Imposto Territorial Rural (30/setembro)
- ✅ DIRF (último dia útil de fevereiro)
- ✅ DEFIS (31/março)
- ✅ eSocial/GFIP (dia 7 - quando há empregados)

### 2. **Notificações Automáticas**

- 📧 Email
- 📱 WhatsApp (futuro)
- 🔔 Sistema
- ⏰ Configurável (1, 7, 15 dias antes)

### 3. **Relatórios Automáticos**

- 📊 Resumo financeiro mensal
- 📄 Notas fiscais emitidas/recebidas
- 💰 Impostos calculados
- 📧 Envio automático para contador

### 4. **🆕 Sistema de Pendências e Anexos**

- 📝 **Contador cria pendências** - Define o que o produtor deve enviar
- 📎 **Produtor seleciona documentos** - Escolhe arquivos para anexar
- 📦 **Geração de pacote ZIP** - Cria arquivo compactado com senha
- 🔗 **Link de download seguro** - Link temporário com validade de 7 dias
- 🔔 **Notificação automática** - Contador recebe aviso dos novos documentos

## 🚀 Fluxo Completo: Contador → Produtor → Documentos

### **📝 Passo 1: Contador cria pendência**

```bash
POST /api/calendario-fiscal/123/pendencias/criar
{
  "titulo": "Anexar folhas de pagamento e notas fiscais",
  "descricao": "Enviar folhas de pagamento de janeiro/2026 e todas as notas fiscais de entrada e saída",
  "dataLimite": "2026-02-21T00:00:00.000Z",
  "tiposDocumentos": ["folha-pagamento", "nf-entrada", "nf-saida"],
  "prioridade": "alta",
  "observacoes": "Urgente para fechamento mensal"
}
```

### **📋 Passo 2: Produtor vê pendências**

```bash
GET /api/calendario-fiscal/123/pendencias
```

**Response:**

```json
{
  "pendencias": [
    {
      "id": "pend-001",
      "titulo": "Anexar folhas de pagamento e notas fiscais",
      "descricao": "Enviar folhas de pagamento de janeiro/2026...",
      "dataLimite": "2026-02-21T00:00:00.000Z",
      "diasRestantes": 8,
      "status": "pendente",
      "prioridade": "alta",
      "urgente": false,
      "vencida": false,
      "tiposDocumentos": ["folha-pagamento", "nf-entrada", "nf-saida"]
    }
  ],
  "resumo": {
    "total": 2,
    "pendentes": 2,
    "vencidas": 0,
    "urgentes": 1
  }
}
```

### **📎 Passo 3: Produtor seleciona documentos**

```bash
POST /api/calendario-fiscal/123/documentos/selecionar
{
  "pendenciaId": "pend-001",
  "documentosSelecionados": ["doc-001", "doc-002", "doc-003"],
  "observacoesProduto": "Todos os documentos de janeiro/2026 conforme solicitado"
}
```

### **📦 Passo 4: Gerar pacote ZIP**

```bash
POST /api/calendario-fiscal/123/documentos/gerar-pacote
{
  "pendenciaId": "pend-001",
  "nomePacote": "Documentos_Janeiro_2026_FazendaSoja",
  "incluirSenha": true,
  "notificarContador": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Pacote de documentos gerado com sucesso",
  "pacote": {
    "id": "pack-123456789",
    "nomePacote": "Documentos_Janeiro_2026_FazendaSoja",
    "nomeArquivoZip": "Documentos_Janeiro_2026_FazendaSoja_2026-02-13.zip",
    "linkDownload": "https://agrotributos.com/downloads/pacotes/Documentos_Janeiro_2026_FazendaSoja_2026-02-13.zip",
    "senha": "AG7X9K2M",
    "tamanho": 1245760,
    "quantidadeArquivos": 3,
    "dataGeracao": "2026-02-13T14:30:00.000Z",
    "dataExpiracao": "2026-02-20T14:30:00.000Z"
  },
  "notificacao": {
    "enviado": true,
    "para": "contador@escritorio.com.br",
    "assunto": "Novos documentos disponíveis - Documentos_Janeiro_2026_FazendaSoja"
  },
  "instrucoes": {
    "linkDownload": "https://agrotributos.com/downloads/pacotes/...",
    "senha": "AG7X9K2M",
    "validadeLink": "7 dias",
    "comoEnviar": "Copie o link abaixo e envie ao seu contador"
  }
}
```

### **🔗 Passo 5: Produtor envia link ao contador**

O produtor copia o link e envia via WhatsApp, email ou outro meio:

```
🔒 Documentos - Janeiro/2026
📎 Link: https://agrotributos.com/downloads/pacotes/Documentos_Janeiro_2026_FazendaSoja_2026-02-13.zip
🔑 Senha: AG7X9K2M
📅 Válido até: 20/02/2026
📋 Arquivos: 3 documentos (1.2 MB)
```

## 📊 Tipos de Documentos Suportados

### **Categoria: Folha de Pagamento**

- `folha-pagamento` - Folha de pagamento mensal
- `comprovante-pagamento-salario` - Comprovantes de pagamento
- `recibo-ferias` - Recibos de férias
- `rescisao-contrato` - Rescisões contratuais

### **Categoria: Notas Fiscais**

- `nf-entrada` - Notas fiscais de entrada (compras)
- `nf-saida` - Notas fiscais de saída (vendas)
- `nf-servico` - Notas fiscais de serviço
- `nf-cancelada` - Notas fiscais canceladas

### **Categoria: Impostos**

- `comprovante-das` - Comprovante DAS pago
- `comprovante-funrural` - Comprovante FUNRURAL
- `comprovante-itr` - Comprovante ITR
- `comprovante-icms` - Comprovante ICMS

### **Categoria: Financeiro**

- `extrato-bancario` - Extratos bancários
- `comprovante-transferencia` - Comprovantes de transferência
- `recibo-pagamento` - Recibos diversos
- `contrato` - Contratos e acordos

## 🚀 Novos Endpoints - Pendências e Anexos

### **Listar Pendências** - `GET /:produtorId/pendencias`

Lista todas as pendências criadas pelo contador.

**Exemplo Response:**

```json
{
  "pendencias": [
    {
      "id": "pend-001",
      "titulo": "Anexar folhas de pagamento e notas fiscais",
      "descricao": "Enviar folhas de pagamento de janeiro/2026 e todas as notas fiscais de entrada e saída",
      "dataLimite": "2026-02-21T00:00:00.000Z",
      "dataCriacao": "2026-02-10T00:00:00.000Z",
      "status": "pendente",
      "tiposDocumentos": ["folha-pagamento", "nf-entrada", "nf-saida"],
      "prioridade": "alta",
      "observacoes": "Urgente para fechamento mensal",
      "diasRestantes": 8,
      "vencida": false,
      "urgente": false
    }
  ],
  "resumo": {
    "total": 2,
    "pendentes": 2,
    "vencidas": 0,
    "urgentes": 1
  }
}
```

### **Criar Pendência (Contador)** - `POST /:produtorId/pendencias/criar`

Permite ao contador criar uma nova pendência.

**Exemplo Request:**

```json
{
  "titulo": "Anexar folhas de pagamento e notas fiscais",
  "descricao": "Enviar folhas de pagamento de janeiro/2026 e todas as notas fiscais de entrada e saída",
  "dataLimite": "2026-02-21T00:00:00.000Z",
  "tiposDocumentos": ["folha-pagamento", "nf-entrada", "nf-saida"],
  "prioridade": "alta",
  "observacoes": "Urgente para fechamento mensal"
}
```

### **Selecionar Documentos** - `POST /:produtorId/documentos/selecionar`

Permite ao produtor escolher quais documentos anexar.

**Exemplo Request:**

```json
{
  "pendenciaId": "pend-001",
  "documentosSelecionados": ["doc-001", "doc-002", "doc-003"],
  "observacoesProduto": "Todos os documentos de janeiro/2026 conforme solicitado"
}
```

### **Gerar Pacote ZIP** - `POST /:produtorId/documentos/gerar-pacote`

Cria arquivo ZIP com documentos e gera link de download.

**Exemplo Request:**

```json
{
  "pendenciaId": "pend-001",
  "nomePacote": "Documentos_Janeiro_2026_FazendaSoja",
  "incluirSenha": true,
  "notificarContador": true
}
```

### **Histórico de Pacotes** - `GET /:produtorId/documentos/historico`

Lista todos os pacotes já gerados pelo produtor.

## 🎨 Interface do Usuário

### **Dashboard do Produtor:**

```
📋 PENDÊNCIAS DO CONTADOR

🔴 URGENTE (vence em 2 dias)
└── Anexar folhas de pagamento e notas fiscais
    📅 Vence: 21/02/2026  📎 3 tipos de documentos

🟡 ATENÇÃO (vence em 8 dias)
└── Comprovantes de impostos pagos
    📅 Vence: 25/02/2026  📎 1 tipo de documento

[📎 Ver Documentos] [📋 Histórico de Envios]
```

### **Fluxo de Seleção:**

```
📂 SELECIONAR DOCUMENTOS

Pendência: Anexar folhas de pagamento e notas fiscais

📄 Folhas de Pagamento:
☑️ Folha_Pagamento_Janeiro_2026.pdf (245 KB)
☑️ Recibo_Ferias_João_Silva.pdf (198 KB)

📋 Notas Fiscais - Entrada:
☑️ NF_Entrada_001_Janeiro.pdf (186 KB)
☐ NF_Entrada_002_Janeiro.pdf (201 KB)

📋 Notas Fiscais - Saída:
☑️ NF_Saida_045_Janeiro.pdf (198 KB)
☑️ NF_Saida_046_Janeiro.pdf (203 KB)

💬 Observações:
"Todos os documentos de janeiro/2026 conforme solicitado"

[📦 Gerar Pacote] [❌ Cancelar]
```

### **Confirmação do Pacote:**

```
✅ PACOTE GERADO COM SUCESSO!

📦 Documentos_Janeiro_2026_FazendaSoja.zip
📊 5 arquivos • 1,2 MB • Válido até 20/02/2026

🔗 LINK PARA O CONTADOR:
https://agrotributos.com/downloads/pacotes/[...]

🔑 SENHA: AG7X9K2M

📧 Contador notificado automaticamente!

[📋 Copiar Link] [📱 Compartilhar] [📊 Ver Histórico]
```

## ✅ Vantagens do Sistema

### **👨‍💼 Para o Contador:**

- ✅ **Organização total** - Sabe exatamente o que precisa de cada cliente
- ✅ **Notificação automática** - Recebe aviso quando documentos ficam prontos
- ✅ **Downloads seguros** - Links com senha e validade controlada
- ✅ **Menos cobrança** - Sistema já avisa automaticamente os produtores
- ✅ **Histórico completo** - Vê todos os envios realizados pelo produtor

### **🧑‍🌾 Para o Produtor:**

- ✅ **Clareza total** - Sabe exatamente o que o contador precisa
- ✅ **Prazo visível** - Vê quantos dias restam para cada pendência
- ✅ **Upload simples** - Seleciona documentos e gera pacote automático
- ✅ **Envio seguro** - Link com senha protege os documentos
- ✅ **Sem email** - Pode enviar via WhatsApp, SMS ou qualquer meio

### **🏢 Para o Escritório:**

- ✅ **Produtividade** - Menos tempo perdido cobrando documentos
- ✅ **Organização** - Centraliza todas as solicitações em um local
- ✅ **Segurança** - Documentos protegidos com senha e prazo de validade
- ✅ **Rastreabilidade** - Histórico completo de todos os envios
- ✅ **Automatização** - Reduz trabalho manual e falhas humanas

## 💡 Casos de Uso Práticos

### **Cenário 1: Fechamento Mensal**

```bash
# Contador cria pendência urgente
POST /api/calendario-fiscal/produtor-001/pendencias/criar
{
  "titulo": "Documentos para fechamento janeiro/2026",
  "dataLimite": "2026-02-21T23:59:59.000Z",
  "tiposDocumentos": ["folha-pagamento", "nf-entrada", "nf-saida", "extrato-bancario"],
  "prioridade": "urgente"
}

# Produtor seleciona documentos
POST /api/calendario-fiscal/produtor-001/documentos/selecionar
# Produtor gera pacote com senha
POST /api/calendario-fiscal/produtor-001/documentos/gerar-pacote
# Contador é notificado automaticamente
# Link válido por 7 dias
```

### **Cenário 2: Auditoria Fiscal**

```bash
# Contador solicita documentos históricos
POST /api/calendario-fiscal/produtor-001/pendencias/criar
{
  "titulo": "Documentos para auditoria - Ano 2025 completo",
  "tiposDocumentos": ["nf-entrada", "nf-saida", "comprovante-das", "comprovante-funrural"],
  "prioridade": "alta",
  "observacoes": "Fiscalização da Receita Federal solicitou todos os documentos de 2025"
}
```

## 📞 Testando o Sistema Completo

Acesse: `http://localhost:3001/api`

### **Fluxo Completo de Teste:**

1. **📋 Ver pendências:** `GET /:produtorId/pendencias`
2. **📎 Selecionar docs:** `POST /:produtorId/documentos/selecionar`
3. **📦 Gerar pacote:** `POST /:produtorId/documentos/gerar-pacote`
4. **📊 Ver histórico:** `GET /:produtorId/documentos/historico`

**🎯 O contador define, o produtor entrega, o sistema organiza tudo!** 🚀
