import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

interface CalculoImpostoInput {
  faturamentoAnual: number;
  regime: string;
  culturas: string[];
  custoInsumos?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model = "gpt-4o-mini";

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY") || "";
    this.client = new OpenAI({ apiKey });
  }

  private getSystemPrompt(): string {
    return `Você é o João, um contador tributarista com 20 anos de experiência no agronegócio. Você fala de forma natural, como se estivesse tomando um café com o produtor e explicando as coisas de forma simples.

SUA PERSONALIDADE:
- Fale como um amigo que entende do assunto, não como um robô
- Use expressões naturais: "Olha só...", "Vou te explicar...", "O negócio é o seguinte..."
- Seja direto mas acolhedor, como um contador de confiança
- Quando der números, explique o que significam na prática
- Faça perguntas para entender melhor a situação do produtor
- Dê exemplos práticos do dia a dia da fazenda

SEU CONHECIMENTO (use naturalmente na conversa):
- CBS: 8,8% federal (substitui PIS/COFINS) - agro paga ~3,5% com redução
- IBS: 17,7% estadual (substitui ICMS/ISS) - agro paga ~7% com redução  
- Total agro: ~10,6% (muito menos que os 26,5% geral!)
- Cesta básica: alíquota ZERO
- Exportação: imune, não paga nada
- MEI: até R$81 mil/ano, paga fixo ~R$70/mês
- Simples: até R$4,8mi/ano, 4% a 33%
- FUNRURAL: PF 1,2%, PJ 2,5%

COMO CONVERSAR:
- Se o produtor perguntar algo vago, peça mais detalhes de forma natural
- Calcule valores quando tiver dados, mas explique o raciocínio
- Sugira próximos passos práticos
- Use **negrito** só para valores importantes
- Evite listas longas, prefira parágrafos curtos e naturais
- Termine com uma pergunta ou sugestão de ação

Lembre-se: você está ajudando o produtor a pagar MENOS imposto de forma legal. Seja parceiro dele!`;
  }

  async generateResponse(message: string, context?: any): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: this.getSystemPrompt() },
        ...(context?.history || []),
        { role: "user", content: message },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Resposta vazia da IA");
      }

      return content;
    } catch (error: any) {
      console.error("Erro OpenAI:", error);

      if (error?.status === 429) {
        throw new Error("Sem crédito na API. Verifique o Billing da OpenAI.");
      }

      if (error?.status === 401) {
        throw new Error("API key inválida. Verifique a configuração.");
      }

      throw new Error(error?.message || "Erro ao processar com IA");
    }
  }

  private getCalculoSystemPrompt(): string {
    return `Você é um contador tributarista especializado em agronegócio. 
                
ALÍQUOTAS 2026:
- CBS Federal: 8,8% (agro: 3,52% com redução 60%)
- IBS Estadual: 17,7% (agro: 7,08% com redução 60%)
- Total agro: 10,6%
- Cesta básica (arroz, feijão, carnes, leite, frutas, verduras): 0%
- Exportação: 0% (imunidade)
- FUNRURAL PF: 1,2%
- FUNRURAL PJ: 2,5%
- Simples Nacional: 4% a 33% conforme faixa
- MEI: R$71,60 fixo/mês (comércio) ou R$76,60 (serviços)
- Lucro Presumido rural: 8% de presunção, IR 15%

Sempre calcule valores específicos, não aproximações vagas.`;
  }

  async calcularImposto(input: CalculoImpostoInput): Promise<string> {
    const prompt = `CALCULE OS IMPOSTOS para este produtor rural:

DADOS:
- Faturamento anual: R$ ${input.faturamentoAnual.toLocaleString("pt-BR")}
- Regime atual: ${input.regime}
- Culturas: ${input.culturas.join(", ")}
${input.custoInsumos ? `- Custo com insumos: R$ ${input.custoInsumos.toLocaleString("pt-BR")}` : ""}

CALCULE E APRESENTE:

1. **IMPOSTO ESTIMADO NO REGIME ATUAL**
   - Detalhe cada imposto (CBS, IBS, FUNRURAL, IR se aplicável)
   - Mostre valor total anual e mensal

2. **COMPARATIVO COM OUTROS REGIMES**
   | Regime | Imposto Anual | Economia vs Atual |
   
3. **REGIME RECOMENDADO**
   - Qual seria o melhor para este perfil?
   - Qual a economia potencial?

4. **ALERTAS E DICAS**
   - O que está errado?
   - Como economizar mais?
   - O que perguntar ao contador?

Seja ESPECÍFICO com valores. Use números reais baseados nas alíquotas vigentes.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: this.getCalculoSystemPrompt() },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Resposta vazia da IA");
      }

      return content;
    } catch (error: any) {
      console.error("Erro ao calcular impostos:", error);

      if (error?.status === 429) {
        throw new Error("Sem crédito na API. Verifique o Billing da OpenAI.");
      }

      if (error?.status === 401) {
        throw new Error("API key inválida. Verifique a configuração.");
      }

      throw new Error(error?.message || "Erro ao calcular impostos");
    }
  }
}
