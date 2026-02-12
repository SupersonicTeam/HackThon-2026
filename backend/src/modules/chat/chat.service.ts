import { Injectable } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ChatResponseDto } from "./dto/chat.dto";

@Injectable()
export class ChatService {
  constructor(private readonly aiService: AiService) {}

  async processMessage(
    message: string,
    context?: any,
  ): Promise<ChatResponseDto> {
    // Usa IA diretamente para respostas naturais e conversacionais
    try {
      const aiResponse = await this.aiService.generateResponse(
        message,
        context,
      );
      return {
        response: aiResponse,
        sources: ["openai"],
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Erro ao chamar IA:", error);

      // Fallback caso a IA falhe
      return {
        response: this.getFallbackResponse(error?.message),
        sources: ["fallback"],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private getFallbackResponse(errorMessage?: string): string {
    if (
      errorMessage?.includes("credito") ||
      errorMessage?.includes("Billing")
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
