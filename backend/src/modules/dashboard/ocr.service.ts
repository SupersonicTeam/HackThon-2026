import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Import da biblioteca de conversão PDF profissional (Poppler)
const pdf = require('pdf-poppler');

export interface NotaFiscalExtractedData {
  // Identificação
  chaveAcesso?: string;
  tipo: 'entrada' | 'saida';
  numero?: string;
  serie?: string;
  cfop?: string;
  naturezaOperacao?: string;

  // Emitente/Destinatário
  nomeEmitente?: string;
  cpfCnpjEmitente?: string;
  destino?: string;
  exportacao?: boolean;

  // Valores totais
  valorTotal: number;
  valorProdutos?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  valorOutros?: number;

  // Impostos
  valorCbs?: number;
  valorIbs?: number;
  valorFunrural?: number;
  valorIcms?: number;
  valorIpi?: number;

  // Data
  dataEmissao: string;

  // Itens
  itens: Array<{
    numeroItem: number;
    codigoProduto?: string;
    descricao: string;
    ncm?: string;
    cfop?: string;
    unidade?: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    valorDesconto?: number;
    valorFrete?: number;
    baseCalculoIcms?: number;
    valorIcms?: number;
    aliquotaIcms?: number;
    baseCalculoIpi?: number;
    valorIpi?: number;
    aliquotaIpi?: number;
    valorCbs?: number;
    valorIbs?: number;
    valorFunrural?: number;
    informacoes?: string;
  }>;
}

@Injectable()
export class OcrService {
  private readonly client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Converte a primeira página de um PDF para imagem PNG em base64
   * Usa pdf-poppler (Poppler) - motor profissional de conversão
   */
  private async convertPdfToImage(pdfBase64: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
    const outputPrefix = `converted-${Date.now()}`;

    try {
      // Cria diretório temporário se não existir
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Salva o PDF temporariamente
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Converte PDF para PNG usando Poppler
      const opts = {
        format: 'png',
        out_dir: tempDir,
        out_prefix: outputPrefix,
        page: 1, // Apenas primeira página (DANFE)
        scale: 2048, // Alta resolução
      };

      await pdf.convert(tempPdfPath, opts);

      // Lê a imagem PNG gerada
      const pngPath = path.join(tempDir, `${outputPrefix}-1.png`);
      const imageBuffer = fs.readFileSync(pngPath);
      const imageBase64 = imageBuffer.toString('base64');

      // Limpa arquivos temporários
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(pngPath);

      console.log(
        `✅ PDF convertido para PNG com Poppler (${Math.round(imageBuffer.length / 1024)}KB)`,
      );

      return imageBase64;
    } catch (error: any) {
      // Limpa arquivos temporários em caso de erro
      try {
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        const pngPath = path.join(tempDir, `${outputPrefix}-1.png`);
        if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
      } catch {}

      console.error('Erro ao converter PDF para imagem:', error);
      throw new Error(
        `Erro ao processar o PDF: ${error?.message || 'Certifique-se de que é um arquivo PDF válido.'}`,
      );
    }
  }

  async extractNotaFiscalData(
    imageBase64: string,
    mimeType: string,
  ): Promise<NotaFiscalExtractedData> {
    try {
      // Se for PDF, converte para imagem primeiro
      let processedBase64 = imageBase64;
      let processedMimeType = mimeType;

      if (mimeType === 'application/pdf') {
        console.log('📄 PDF detectado. Convertendo para imagem...');
        processedBase64 = await this.convertPdfToImage(imageBase64);
        processedMimeType = 'image/png';
        console.log('✅ PDF convertido com sucesso para PNG');
      }

      const prompt = `Você é um especialista em extração de dados de Notas Fiscais Eletrônicas (NF-e) brasileiras.

ANALISE A IMAGEM DA NOTA FISCAL e extraia TODOS os dados estruturados em formato JSON.

IMPORTANTE:
- Extraia a chave de acesso de 44 dígitos (geralmente na parte superior ou no DANFE)
- Identifique se é ENTRADA (compra) ou SAÍDA (venda) baseado no contexto
- Para ENTRADA: o produtor está comprando (destinatário é o produtor)
- Para SAÍDA: o produtor está vendendo (emitente é o produtor)
- Extraia TODOS os produtos/itens da nota com seus respectivos valores e impostos
- Use valores numéricos sem símbolos (R$, %, etc)
- Se um campo não estiver visível, use null

ESTRUTURA JSON ESPERADA:
{
  "chaveAcesso": "44 dígitos da chave de acesso",
  "tipo": "entrada" ou "saida",
  "numero": "número da nota",
  "serie": "série",
  "cfop": "código CFOP",
  "naturezaOperacao": "descrição da natureza",
  "nomeEmitente": "razão social do emitente",
  "cpfCnpjEmitente": "CPF/CNPJ do emitente",
  "destino": "UF de destino",
  "exportacao": false,
  "valorTotal": valor total numérico,
  "valorProdutos": subtotal dos produtos,
  "valorFrete": valor do frete,
  "valorSeguro": valor do seguro,
  "valorDesconto": desconto total,
  "valorOutros": outras despesas,
  "valorCbs": CBS/PIS,
  "valorIbs": IBS/COFINS,
  "valorFunrural": FUNRURAL,
  "valorIcms": ICMS,
  "valorIpi": IPI,
  "dataEmissao": "YYYY-MM-DD",
  "itens": [
    {
      "numeroItem": 1,
      "codigoProduto": "código do produto",
      "descricao": "descrição completa",
      "ncm": "NCM",
      "cfop": "CFOP do item",
      "unidade": "UN/KG/SC/L etc",
      "quantidade": quantidade numérica,
      "valorUnitario": valor unitário,
      "valorTotal": valor total do item,
      "valorDesconto": desconto do item,
      "valorFrete": frete do item,
      "baseCalculoIcms": base ICMS,
      "valorIcms": valor ICMS,
      "aliquotaIcms": alíquota ICMS,
      "baseCalculoIpi": base IPI,
      "valorIpi": valor IPI,
      "aliquotaIpi": alíquota IPI,
      "valorCbs": CBS do item,
      "valorIbs": IBS do item,
      "valorFunrural": FUNRURAL do item,
      "informacoes": "informações adicionais"
    }
  ]
}

RETORNE APENAS O JSON, SEM EXPLICAÇÕES OU MARKDOWN. Use valores numéricos precisos.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${processedMimeType};base64,${processedBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }

      // Remove possíveis marcadores de código markdown
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse do JSON
      const extractedData: NotaFiscalExtractedData = JSON.parse(cleanContent);

      // Validações básicas
      if (!extractedData.valorTotal || extractedData.valorTotal <= 0) {
        throw new Error(
          'Valor total da nota não identificado ou inválido. Verifique a qualidade da imagem.',
        );
      }

      if (!extractedData.itens || extractedData.itens.length === 0) {
        throw new Error(
          'Nenhum item/produto foi identificado na nota fiscal. Verifique a qualidade da imagem.',
        );
      }

      // Define tipo padrão se não identificado
      if (!extractedData.tipo) {
        extractedData.tipo = 'entrada'; // Assume entrada por padrão
      }

      return extractedData;
    } catch (error: any) {
      console.error('Erro ao processar imagem com OCR:', error);

      if (error?.message?.includes('JSON')) {
        throw new Error(
          'Erro ao processar a estrutura da nota fiscal. A imagem pode estar ilegível ou não ser uma NF-e válida.',
        );
      }

      if (error?.status === 429) {
        throw new Error(
          'Limite de requisições atingido. Tente novamente em alguns instantes.',
        );
      }

      if (error?.status === 401) {
        throw new Error(
          'Erro de autenticação com o serviço de OCR. Verifique a configuração.',
        );
      }

      throw new Error(
        error?.message ||
          'Erro ao extrair dados da nota fiscal. Verifique se a imagem está nítida e completa.',
      );
    }
  }
}
