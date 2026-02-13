import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';

export interface DocumentoExtractedData {
  // Dados gerais extraídos
  dataReferencia?: string; // Data identificada no documento (YYYY-MM-DD)
  valor?: number; // Valor principal identificado
  observacao?: string; // Observações ou descrição extraída
  
  // Campos específicos por tipo de documento
  [key: string]: any; // Permite campos adicionais dinamicamente
}

@Injectable()
export class ContadorOcrService {
  private readonly client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Extrai dados de um documento genérico (folha de pagamento, nota fiscal, recibo, etc)
   */
  async extractDocumentoData(
    caminhoArquivo: string,
    tipoDocumento: string,
  ): Promise<DocumentoExtractedData> {
    try {
      // Lê o arquivo do disco
      const fileBuffer = fs.readFileSync(caminhoArquivo);
      const fileBase64 = fileBuffer.toString('base64');
      
      // Detecta o tipo MIME baseado na extensão
      const ext = caminhoArquivo.toLowerCase().split('.').pop();
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'webp') mimeType = 'image/webp';

      // Monta o prompt baseado no tipo de documento
      const prompt = this.buildPromptForDocumentType(tipoDocumento);

      console.log(`🔍 Extraindo dados do documento ${tipoDocumento}...`);

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
                  url: `data:${mimeType};base64,${fileBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
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
      const extractedData: DocumentoExtractedData = JSON.parse(cleanContent);

      console.log(`✅ Dados extraídos com sucesso:`, extractedData);

      return extractedData;
    } catch (error: any) {
      console.error('Erro ao processar documento com OCR:', error);

      if (error?.message?.includes('JSON')) {
        return {
          observacao: 'Documento processado, mas não foi possível extrair dados estruturados.',
        };
      }

      if (error?.status === 429) {
        throw new Error(
          'Limite de requisições atingido. Tente novamente em alguns instantes.',
        );
      }

      if (error?.status === 401) {
        throw new Error(
          'Erro de autenticação com o serviço de IA. Verifique a configuração.',
        );
      }

      // Retorna objeto vazio ao invés de falhar
      return {
        observacao: 'Não foi possível extrair dados automaticamente deste documento.',
      };
    }
  }

  /**
   * Constrói o prompt adequado baseado no tipo de documento
   */
  private buildPromptForDocumentType(tipoDocumento: string): string {
    const promptsEspecificos: Record<string, string> = {
      'folha-pagamento': `Você é um especialista em análise de folhas de pagamento.

ANALISE A IMAGEM e extraia os dados principais em formato JSON.

EXTRAIA:
- dataReferencia: Mês/ano de referência (formato YYYY-MM-DD, use o primeiro dia do mês)
- valor: Valor líquido total ou valor bruto total da folha
- observacao: Resumo dos principais itens (salários, encargos, descontos, etc)
- quantidadeFuncionarios: Número de funcionários
- valorBruto: Total bruto
- valorLiquido: Total líquido
- valorEncargos: Soma de encargos (INSS, FGTS, etc)

Retorne APENAS o JSON, sem explicações.`,

      'nf-entrada': `Você é um especialista em Notas Fiscais de Entrada.

ANALISE A IMAGEM e extraia:
- dataReferencia: Data de emissão da nota (YYYY-MM-DD)
- valor: Valor total da nota
- observacao: Descrição dos produtos principais e fornecedor
- fornecedor: Nome do fornecedor/emitente
- chaveAcesso: Chave de 44 dígitos (se visível)
- numeroNota: Número da NF

Retorne APENAS o JSON, sem explicações.`,

      'nf-saida': `Você é um especialista em Notas Fiscais de Saída.

ANALISE A IMAGEM e extraia:
- dataReferencia: Data de emissão da nota (YYYY-MM-DD)
- valor: Valor total da nota
- observacao: Descrição dos produtos vendidos e cliente
- cliente: Nome do destinatário
- chaveAcesso: Chave de 44 dígitos (se visível)
- numeroNota: Número da NF

Retorne APENAS o JSON, sem explicações.`,

      'recibo': `Você é um especialista em análise de recibos.

ANALISE A IMAGEM e extraia:
- dataReferencia: Data do recibo (YYYY-MM-DD)
- valor: Valor do recibo
- observacao: Descrição do pagamento/recebimento
- pagador: Nome de quem está pagando
- beneficiario: Nome de quem está recebendo

Retorne APENAS o JSON, sem explicações.`,

      'contrato': `Você é um especialista em análise de contratos.

ANALISE A IMAGEM e extraia:
- dataReferencia: Data de assinatura ou início de vigência (YYYY-MM-DD)
- valor: Valor total do contrato (se houver)
- observacao: Resumo do objeto do contrato e principais cláusulas
- partes: Nome das partes envolvidas
- vigencia: Período de vigência

Retorne APENAS o JSON, sem explicações.`,
    };

    // Prompt genérico para documentos não especificados
    const promptGenerico = `Você é um especialista em análise de documentos.

ANALISE A IMAGEM deste documento e extraia os dados principais em formato JSON.

EXTRAIA (quando disponível):
- dataReferencia: Qualquer data relevante encontrada (YYYY-MM-DD)
- valor: Qualquer valor monetário principal encontrado (número sem símbolos)
- observacao: Resumo do conteúdo do documento em até 200 caracteres

IMPORTANTE:
- Use valores numéricos sem símbolos (R$, %, etc)
- Se um campo não estiver visível, use null
- Seja preciso e objetivo

Retorne APENAS o JSON, sem explicações ou markdown.`;

    return promptsEspecificos[tipoDocumento] || promptGenerico;
  }
}
