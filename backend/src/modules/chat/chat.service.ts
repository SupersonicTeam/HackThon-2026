import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatResponseDto } from './dto/chat.dto';
import { NotaFiscalService } from '../dashboard/nota-fiscal.service';
import { ProdutorService } from '../dashboard/produtor.service';

@Injectable()
export class ChatService {
  // ID fixo do produtor padrão para buscar notas
  private readonly DEFAULT_PRODUTOR_ID = 'c4f29a8c-1559-4e6c-b0fd-05ce55753c4f';

  constructor(
    private readonly aiService: AiService,
    private readonly notaFiscalService: NotaFiscalService,
    private readonly produtorService: ProdutorService,
  ) {}

  async processMessage(
    message: string,
    context?: any,
  ): Promise<ChatResponseDto> {
    // Usa IA diretamente para respostas naturais e conversacionais
    try {
      // Enriquece o contexto com dados do banco de dados se necessário
      const enrichedContext = await this.enrichContext(message, context);

      const aiResponse = await this.aiService.generateResponse(
        message,
        enrichedContext,
      );
      return {
        response: aiResponse,
        sources: ['openai', 'database'],
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Erro ao chamar IA:', error);

      // Fallback caso a IA falhe
      return {
        response: this.getFallbackResponse(error?.message),
        sources: ['fallback'],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async enrichContext(message: string, context?: any): Promise<any> {
    const enriched = { ...context };

    try {
      // Define o produtorId: usa o do contexto ou o padrão
      const produtorId = context?.produtorId || this.DEFAULT_PRODUTOR_ID;

      // Busca as notas e dados do produtor
      try {
        const notas = await this.notaFiscalService.findAll(produtorId);
        const produtor = await this.produtorService.findOne(produtorId);

        enriched.notas = notas;
        enriched.produtor = produtor;
        enriched.totalNotas = notas.length;
        enriched.notasRecentes = notas.slice(0, 5); // Últimas 5 notas
        enriched.produtorId = produtorId; // Garante que o ID está no contexto
      } catch (error) {
        // Se não encontrar o produtor padrão, tenta por CPF/CNPJ
        if (context?.cpfCnpj) {
          try {
            const produtor = await this.produtorService.findByCpfCnpj(
              context.cpfCnpj,
            );
            if (produtor) {
              const notas = await this.notaFiscalService.findAll(produtor.id);
              enriched.notas = notas;
              enriched.produtor = produtor;
              enriched.totalNotas = notas.length;
              enriched.notasRecentes = notas.slice(0, 5);
              enriched.produtorId = produtor.id;
            }
          } catch (error) {
            console.log('Produtor não encontrado por CPF/CNPJ:', error);
          }
        } else {
          console.log('Produtor não encontrado:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao enriquecer contexto:', error);
    }

    return enriched;
  }

  private getFallbackResponse(errorMessage?: string): string {
    if (
      errorMessage?.includes('credito') ||
      errorMessage?.includes('Billing')
    ) {
      return `Ops, parece que estou com um problema tecnico no momento (sem creditos na API).

Mas posso te dar umas dicas gerais enquanto isso:

**Para economizar impostos no agro:**
- Guarde todas as notas fiscais de compra (geram credito tributario)
- Compare seu regime tributario anualmente
- Se exporta, lembre que e imposto zero
- O agro tem 60% de reducao nas novas aliquotas

Tente novamente em alguns minutos ou entre em contato com o suporte.`;
    }

    return `Desculpa, tive um probleminha tecnico aqui. Mas nao se preocupa, tenta de novo que geralmente funciona!

Se o problema continuar, pode ser que o servidor esteja em manutencao. Tenta novamente em alguns minutos.`;
  }
}
