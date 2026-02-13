# 📤 Upload Automático de Notas Fiscais com OCR

## 🚀 Funcionalidade

Este módulo permite o **upload de fotos ou PDFs de notas fiscais** e realiza o **processamento automático via OCR** usando Inteligência Artificial (OpenAI Vision API).

### ✨ O que o sistema faz automaticamente:

1. **Recebe** a foto/PDF da nota fiscal
2. **Extrai** todos os dados usando OCR com IA:
   - Chave de acesso (44 dígitos)
   - Tipo (entrada/saída)
   - Número, série, CFOP
   - Emitente e destinatário
   - **Todos os produtos/itens** com valores individuais
   - **Todos os impostos**: CBS, IBS, FUNRURAL, ICMS, IPI
   - Data de emissão
3. **Valida** os dados extraídos
4. **Registra** automaticamente no banco de dados
5. **Atualiza** o fluxo de caixa do produtor

---

## 📋 Endpoint

### POST `/api/dashboard/notas/upload`

**Tipo de requisição:** `multipart/form-data`

**Parâmetros:**
- `file` *(obrigatório)*: Arquivo da nota fiscal
  - Formatos aceitos: JPG, PNG, PDF
  - Tamanho máximo: 10MB
- `produtorId` *(obrigatório)*: UUID do produtor

---

## 🧪 Como Testar no Postman

### Passo 1: Configure a requisição

1. Método: **POST**
2. URL: `http://localhost:3001/api/dashboard/notas/upload`
3. Headers:
   - Não adicione `Content-Type` (o Postman define automaticamente)

### Passo 2: Configure o Body

1. Selecione a aba **Body**
2. Escolha **form-data**
3. Adicione os campos:

| Key | Type | Value |
|-----|------|-------|
| `file` | File | *Clique em "Select Files" e escolha a foto/PDF da nota* |
| `produtorId` | Text | `c4f29a8c-1559-4e6c-b0fd-05ce55753c4f` |

### Passo 3: Envie a requisição

Clique em **Send** e aguarde o processamento (pode levar 5-15 segundos dependendo da complexidade da nota).

---

## 📸 Resposta de Sucesso

```json
{
  "success": true,
  "message": "Nota fiscal processada e registrada com sucesso!",
  "arquivo": {
    "nome": "nota-1707776234567-123456789.jpg",
    "caminho": "uploads/notas/nota-1707776234567-123456789.jpg",
    "tamanho": 245678,
    "tipo": "image/jpeg"
  },
  "dadosExtraidos": {
    "chaveAcesso": "41260212345678901234550010000012341234567890",
    "tipo": "entrada",
    "numero": "1234",
    "serie": "1",
    "cfop": "5102",
    "naturezaOperacao": "Venda de mercadoria",
    "nomeEmitente": "Agropecuária Sementes Ltda",
    "cpfCnpjEmitente": "12345678000190",
    "valorTotal": 4916.14,
    "valorProdutos": 4370.00,
    "valorCbs": 150.00,
    "valorIbs": 200.00,
    "valorFunrural": 98.32,
    "dataEmissao": "2026-02-10",
    "itens": [
      {
        "numeroItem": 1,
        "descricao": "Semente de Soja TMG 7062 IPRO",
        "quantidade": 50,
        "valorUnitario": 45.00,
        "valorTotal": 2250.00,
        "unidade": "SC",
        "ncm": "12010000",
        "valorIcms": 270.00
      }
      // ... mais itens
    ]
  },
  "notaCriada": {
    "id": "uuid-da-nota",
    "produtorId": "c4f29a8c-1559-4e6c-b0fd-05ce55753c4f",
    "chaveAcesso": "41260212345678901234550010000012341234567890",
    "tipo": "entrada",
    "valorTotal": 4916.14,
    "status": "validada",
    "itens": [/* array com todos os itens */],
    "createdAt": "2026-02-12T21:30:00.000Z"
  },
  "resumo": {
    "tipo": "entrada",
    "valorTotal": 4916.14,
    "quantidadeItens": 5,
    "impostos": {
      "cbs": 150.00,
      "ibs": 200.00,
      "funrural": 98.32,
      "icms": 576.00,
      "total": 1024.32
    }
  }
}
```

---

## ⚠️ Possíveis Erros

### 400 - Arquivo inválido
```json
{
  "statusCode": 400,
  "message": "Tipo de arquivo não permitido. Envie JPG, PNG ou PDF."
}
```
**Solução:** Envie apenas arquivos JPG, PNG ou PDF.

### 400 - produtorId não fornecido
```json
{
  "statusCode": 400,
  "message": "produtorId é obrigatório. Informe o ID do produtor."
}
```
**Solução:** Adicione o campo `produtorId` no form-data.

### 400 - Imagem ilegível
```json
{
  "statusCode": 400,
  "message": "Erro ao processar a estrutura da nota fiscal. A imagem pode estar ilegível ou não ser uma NF-e válida."
}
```
**Solução:** 
- Tire uma foto mais nítida
- Certifique-se de que toda a nota está visível
- Evite reflexos, sombras ou borrões
- Para PDF, certifique-se de que está completo

### 404 - Produtor não encontrado
```json
{
  "statusCode": 404,
  "message": "Produtor com ID xxx não encontrado"
}
```
**Solução:** Verifique se o `produtorId` está correto.

---

## 🔍 Verificação do Resultado

Após o upload bem-sucedido, você pode verificar:

### 1. Consultar a nota criada
```
GET /api/dashboard/notas/:id
```

### 2. Ver fluxo de caixa atualizado
```
GET /api/dashboard/:produtorId/fluxo-caixa
```

### 3. Ver produtos principais
```
GET /api/dashboard/:produtorId/produtos-principais
```

### 4. Perguntar para a IA
```
POST /api/chat
Body:
{
  "message": "Quais notas eu cadastrei hoje?"
}
```
A IA terá acesso à nota que você acabou de fazer upload!

---

## 💡 Dicas para Melhores Resultados

### ✅ Boas práticas:
- Foto bem iluminada e nítida
- Nota fiscal completa na foto (todas as bordas visíveis)
- Evite reflexos de luz na nota
- Segure o celular paralelo à nota (sem ângulo)
- Use a câmera traseira do celular (melhor qualidade)
- Se for PDF, certifique-se de que é o DANFE completo

### ❌ Evite:
- Fotos tremidas ou desfocadas
- Notas dobradas ou amassadas
- Fotos com dedos cobrindo partes da nota
- Capturas de tela de baixa qualidade
- Notas rasgadas ou danificadas

---

## 🤖 Como Funciona o OCR

O sistema usa **GPT-4o Vision** da OpenAI para:

1. **Identificar** a estrutura da nota fiscal
2. **Ler** todos os campos (chave de acesso, CFOP, NCM, etc)
3. **Extrair** todos os produtos e valores
4. **Calcular** automaticamente os totais
5. **Classificar** como entrada ou saída
6. **Retornar** dados estruturados em JSON

O modelo de IA foi treinado especificamente para:
- Notas fiscais brasileiras (NF-e)
- DANFE (Documento Auxiliar da Nota Fiscal Eletrônica)
- Diferentes layouts de impressão
- Múltiplos produtos por nota
- Todos os impostos do agronegócio

---

## 📊 Impacto no Fluxo de Caixa

Quando uma nota é processada via upload:

### Se tipo = "ENTRADA" (compra):
- ✅ Registrado em `totalEntradas`
- ➖ Subtrai do saldo (saída de dinheiro)
- 📝 Gera crédito tributário para o produtor

### Se tipo = "SAÍDA" (venda):
- ✅ Registrado em `totalSaidas`
- ➕ Soma no saldo (entrada de dinheiro)
- 💰 Calcula impostos devidos (CBS, IBS, FUNRURAL)
- 📈 Atualiza produtos principais

---

## 🔒 Segurança

- Arquivos são salvos em `uploads/notas/` com nomes únicos
- Validação de tipo de arquivo (apenas imagens e PDF)
- Limite de tamanho: 10MB
- Validação de produtor antes do processamento
- Em caso de erro, o arquivo é deletado automaticamente

---

## 📦 Arquivos Criados

Cada upload cria:
1. **Arquivo físico** em `uploads/notas/nota-[timestamp]-[random].[ext]`
2. **Registro na tabela** `notas_fiscais`
3. **Registros na tabela** `itens_nota_fiscal` (um para cada produto)
4. **Campo `arquivoUrl`** com o caminho do arquivo
5. **Campo `arquivoTipo`** = "foto" ou "pdf"

---

## 🚀 Próximos Passos

Depois de fazer upload, você pode:

1. ✅ Ver a nota no dashboard
2. 💬 Perguntar para o João (IA) sobre a nota
3. 📊 Consultar o fluxo de caixa atualizado
4. 📈 Ver analytics e produtos principais
5. 💰 Calcular impostos com base nas notas

---

## 🛠️ Tecnologias Utilizadas

- **NestJS** - Framework backend
- **Multer** - Upload de arquivos
- **OpenAI GPT-4o Vision** - OCR e extração de dados
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor (console)
2. Certifique-se de que a API Key da OpenAI está configurada
3. Teste com uma nota fiscal bem nítida
4. Verifique se o produtor existe no sistema

**Endpoint de documentação interativa:**
http://localhost:3001/api/docs
