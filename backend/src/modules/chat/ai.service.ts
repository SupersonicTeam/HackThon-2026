import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface CalculoImpostoInput {
  faturamentoAnual: number;
  regime: string;
  culturas: string[];
  custoInsumos?: number;
}

interface NotaFiscal {
  tipo: 'entrada' | 'saida';
  produto: string;
  valor: number;
  quantidade?: number;
  destino?: string;
  exportacao?: boolean;
}

interface SimulacaoPreco {
  produto: string;
  custoProducao: number;
  quantidade: number;
  regime: string;
  margemLucro?: number;
  exportacao?: boolean;
}

interface DicasLucro {
  faturamentoAnual: number;
  custoTotal: number;
  regime: string;
  culturas: string[];
  notas?: NotaFiscal[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model = 'gpt-4o-mini';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
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

IMPOSTOS 2026:
- CBS: 8,8% federal (substitui PIS/COFINS) - agro paga ~3,5% com redução de 60%
- IBS: 17,7% estadual (substitui ICMS/ISS) - agro paga ~7% com redução de 60%
- Total agro: ~10,6% (muito menos que os 26,5% geral!)
- Cesta básica: alíquota ZERO (arroz, feijão, carnes, leite, frutas, verduras)
- Exportação: imune, não paga nada
- MEI: até R$81 mil/ano, paga fixo ~R$70/mês
- Simples: até R$4,8mi/ano, 4% a 33%
- FUNRURAL: PF 1,2%, PJ 2,5%

NOTAS FISCAIS - ERROS COMUNS A EVITAR:
- Esquecer de emitir nota = multa de até 100% do valor + juros
- Classificação errada do produto (NCM) = imposto errado
- Destino errado na nota = perda de benefícios fiscais
- Não guardar notas de compra = perda de créditos tributários
- Atraso na escrituração = multas desnecessárias

DICAS DE LUCRO:
- Guarde TODAS as notas de entrada (geram crédito tributário)
- Compare regimes anualmente - pode economizar milhares
- Exportação é isento - considere se viável
- Produtos da cesta básica têm alíquota ZERO
- Planeje vendas nos melhores meses (preço + impostos)

PREVENÇÃO DE PROBLEMAS:
- Sempre confirme dados antes de emitir nota
- Mantenha documentação organizada
- Não deixe para última hora as obrigações
- Em caso de dúvida, pergunte antes de emitir
- Um erro pode custar caro - prevenção é economia

COMO CONVERSAR:
- Se o produtor perguntar sobre notas, oriente o preenchimento correto
- Se perguntar sobre custos, ajude a calcular o melhor preço de venda
- Calcule valores quando tiver dados, mas explique o raciocínio
- Sugira próximos passos práticos
- Use **negrito** só para valores importantes
- Evite listas longas, prefira parágrafos curtos e naturais
- Termine com uma pergunta ou sugestão de ação
- Sempre pense em ECONOMIA e PREVENÇÃO de erros

Lembre-se: você está ajudando o produtor a:
1. Pagar MENOS imposto (legalmente)
2. Evitar ERROS que custam caro
3. Aumentar o LUCRO da fazenda

Seja o parceiro de confiança que todo produtor precisa!`;
  }

  async generateResponse(message: string, context?: any): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
      ];

      // Adiciona informações do produtor e suas notas ao contexto se disponível
      if (context?.produtor || context?.notas) {
        let contextInfo = '\n\n**DADOS DO PRODUTOR NO SISTEMA:**\n\n';

        if (context.produtor) {
          contextInfo += `Nome: ${context.produtor.nome}\n`;
          contextInfo += `CPF/CNPJ: ${context.produtor.cpfCnpj}\n`;
          contextInfo += `Regime: ${context.produtor.regime}\n`;
          if (context.produtor.estado) {
            contextInfo += `Estado: ${context.produtor.estado}\n`;
          }
          if (context.produtor.culturas) {
            const culturas =
              typeof context.produtor.culturas === 'string'
                ? JSON.parse(context.produtor.culturas)
                : context.produtor.culturas;
            contextInfo += `Culturas: ${Array.isArray(culturas) ? culturas.join(', ') : culturas}\n`;
          }
        }

        if (context.notas && context.notas.length > 0) {
          contextInfo += `\n**NOTAS FISCAIS CADASTRADAS (${context.totalNotas} total):**\n\n`;

          const notasParaMostrar =
            context.notasRecentes || context.notas.slice(0, 5);
          notasParaMostrar.forEach((nota: any, index: number) => {
            contextInfo += `Nota ${index + 1}:\n`;
            contextInfo += `  - Chave: ${nota.chaveAcesso}\n`;
            contextInfo += `  - Tipo: ${nota.tipo === 'entrada' ? 'Compra/Entrada' : 'Venda/Saída'}\n`;
            contextInfo += `  - Número: ${nota.numero} / Série: ${nota.serie}\n`;
            contextInfo += `  - Data: ${new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}\n`;
            contextInfo += `  - Valor Total: R$ ${Number(nota.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
            contextInfo += `  - CFOP: ${nota.cfop || 'N/A'}\n`;
            contextInfo += `  - Emitente: ${nota.nomeEmitente || 'N/A'}\n`;

            if (nota.itens && nota.itens.length > 0) {
              contextInfo += `  - Produtos (${nota.itens.length} itens):\n`;
              nota.itens.slice(0, 3).forEach((item: any) => {
                contextInfo += `    * ${item.descricao} - ${item.quantidade} ${item.unidade || 'UN'} × R$ ${Number(item.valorUnitario).toFixed(2)} = R$ ${Number(item.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
              });
              if (nota.itens.length > 3) {
                contextInfo += `    ... e mais ${nota.itens.length - 3} produtos\n`;
              }
            }

            // Impostos da nota
            const impostos = [];
            if (nota.valorCbs)
              impostos.push(`CBS: R$ ${Number(nota.valorCbs).toFixed(2)}`);
            if (nota.valorIbs)
              impostos.push(`IBS: R$ ${Number(nota.valorIbs).toFixed(2)}`);
            if (nota.valorFunrural)
              impostos.push(
                `FUNRURAL: R$ ${Number(nota.valorFunrural).toFixed(2)}`,
              );
            if (nota.valorIcms)
              impostos.push(`ICMS: R$ ${Number(nota.valorIcms).toFixed(2)}`);
            if (impostos.length > 0) {
              contextInfo += `  - Impostos: ${impostos.join(', ')}\n`;
            }

            contextInfo += `  - Status: ${nota.status}\n`;
            if (nota.observacoes) {
              contextInfo += `  - Obs: ${nota.observacoes}\n`;
            }
            contextInfo += '\n';
          });

          if (context.totalNotas > notasParaMostrar.length) {
            contextInfo += `... e mais ${context.totalNotas - notasParaMostrar.length} notas no sistema.\n`;
          }
        } else if (context.produtor) {
          contextInfo +=
            '\n**Ainda não há notas fiscais cadastradas para este produtor.**\n';
        }

        messages.push({
          role: 'system',
          content:
            contextInfo +
            '\n\nUse essas informações reais do sistema quando o produtor perguntar sobre suas notas, impostos pagos, ou produtos. Seja específico e cite os dados cadastrados.',
        });
      }

      messages.push(...(context?.history || []));
      messages.push({ role: 'user', content: message });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }

      return content;
    } catch (error: any) {
      console.error('Erro OpenAI:', error);

      if (error?.status === 429) {
        throw new Error('Sem crédito na API. Verifique o Billing da OpenAI.');
      }

      if (error?.status === 401) {
        throw new Error('API key inválida. Verifique a configuração.');
      }

      throw new Error(error?.message || 'Erro ao processar com IA');
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
- Faturamento anual: R$ ${input.faturamentoAnual.toLocaleString('pt-BR')}
- Regime atual: ${input.regime}
- Culturas: ${input.culturas.join(', ')}
${input.custoInsumos ? `- Custo com insumos: R$ ${input.custoInsumos.toLocaleString('pt-BR')}` : ''}

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
          { role: 'system', content: this.getCalculoSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }

      return content;
    } catch (error: any) {
      console.error('Erro ao calcular impostos:', error);

      if (error?.status === 429) {
        throw new Error('Sem crédito na API. Verifique o Billing da OpenAI.');
      }

      if (error?.status === 401) {
        throw new Error('API key inválida. Verifique a configuração.');
      }

      throw new Error(error?.message || 'Erro ao calcular impostos');
    }
  }

  async analisarNota(
    nota: NotaFiscal,
    regimeTributario?: string,
  ): Promise<string> {
    const prompt = `ANALISE esta nota fiscal para um produtor rural:

DADOS DA NOTA:
- Tipo: ${nota.tipo === 'entrada' ? 'Compra/Entrada' : 'Venda/Saída'}
- Produto: ${nota.produto}
- Valor: R$ ${nota.valor.toLocaleString('pt-BR')}
${nota.quantidade ? `- Quantidade: ${nota.quantidade} toneladas` : ''}
${nota.destino ? `- Destino: ${nota.destino}` : ''}
- Exportação: ${nota.exportacao ? 'SIM' : 'NÃO'}
${regimeTributario ? `- Regime do produtor: ${regimeTributario}` : ''}

FORNEÇA:

1. **VALIDAÇÃO DA NOTA**
   - Está sendo emitida corretamente?
   - Falta alguma informação importante?
   - Há algum erro que pode causar problemas fiscais?

2. **IMPOSTOS APLICÁVEIS**
   - Quais impostos incidem nesta operação?
   - Valores aproximados de cada imposto
   - Possibilidade de créditos tributários (se entrada)

3. **ORIENTAÇÕES PRÁTICAS**
   - Como preencher corretamente esta nota?
   - Documentos que devem acompanhar
   - Cuidados especiais para evitar autuações

4. **DICAS DE ECONOMIA**
   - Como reduzir impostos nesta operação?
   - Há regime mais vantajoso?
   - Possibilidade de isenção ou alíquota zero?

Seja prático e didático. Explique como se estivesse orientando pessoalmente.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista em notas fiscais do agronegócio. Identifique erros, previna problemas fiscais e oriente sobre o preenchimento correto.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Erro ao analisar nota:', error);
      throw new Error(error?.message || 'Erro ao analisar nota fiscal');
    }
  }

  async simularPreco(input: SimulacaoPreco): Promise<string> {
    const custoPorUnidade = input.custoProducao / input.quantidade;
    const margemDesejada = input.margemLucro || 20;

    const prompt = `SIMULE o melhor preço de venda para este produtor:

DADOS DE PRODUÇÃO:
- Produto: ${input.produto}
- Custo total de produção: R$ ${input.custoProducao.toLocaleString('pt-BR')}
- Quantidade produzida: ${input.quantidade} toneladas
- Custo por tonelada: R$ ${custoPorUnidade.toLocaleString('pt-BR')}
- Regime tributário: ${input.regime}
- Margem de lucro desejada: ${margemDesejada}%
- Operação: ${input.exportacao ? 'EXPORTAÇÃO' : 'Mercado Interno'}

CALCULE E APRESENTE:

1. **PREÇO MÍNIMO DE VENDA**
   - Preço para cobrir custos + impostos (ponto de equilíbrio)
   - Por tonelada e total

2. **PREÇO COM MARGEM DESEJADA (${margemDesejada}%)**
   - Preço por tonelada
   - Faturamento total
   - Lucro líquido após impostos

3. **SIMULAÇÃO DE CENÁRIOS**
   | Preço/ton | Faturamento | Impostos | Lucro Líquido | Margem % |
   
   Simule ao menos 3 cenários de preço

4. **RECOMENDAÇÕES**
   - Qual o melhor preço considerando o mercado?
   - Como maximizar o lucro?
   - Vale a pena exportar? (compare se aplicável)
   - Regime tributário está otimizado?

5. **ALERTAS**
   - Preço muito baixo que gera prejuízo
   - Impostos que podem ser reduzidos
   - Oportunidades de crédito tributário

Use valores reais e específicos. Ajude o produtor a vender pelo melhor preço!`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getCalculoSystemPrompt(),
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Erro ao simular preço:', error);
      throw new Error(error?.message || 'Erro ao simular preço');
    }
  }

  async gerarDicasLucro(input: DicasLucro): Promise<string> {
    const margemAtual =
      ((input.faturamentoAnual - input.custoTotal) / input.faturamentoAnual) *
      100;
    const lucroAtual = input.faturamentoAnual - input.custoTotal;

    const notasInfo = input.notas
      ? `\n\nANÁLISE DAS NOTAS RECENTES:
${input.notas
  .map(
    (n, i) => `
Nota ${i + 1}:
- Tipo: ${n.tipo}
- Produto: ${n.produto}
- Valor: R$ ${n.valor.toLocaleString('pt-BR')}
- Exportação: ${n.exportacao ? 'Sim' : 'Não'}`,
  )
  .join('\n')}`
      : '';

    const prompt = `ANALISE a situação financeira deste produtor e dê dicas para AUMENTAR O LUCRO:

SITUAÇÃO ATUAL:
- Faturamento anual: R$ ${input.faturamentoAnual.toLocaleString('pt-BR')}
- Custos totais: R$ ${input.custoTotal.toLocaleString('pt-BR')}
- Lucro atual: R$ ${lucroAtual.toLocaleString('pt-BR')}
- Margem de lucro: ${margemAtual.toFixed(2)}%
- Regime tributário: ${input.regime}
- Culturas: ${input.culturas.join(', ')}${notasInfo}

FORNEÇA ANÁLISE COMPLETA:

1. **DIAGNÓSTICO DA SITUAÇÃO**
   - A margem de lucro está boa?
   - Principais problemas identificados
   - Oportunidades desperdiçadas

2. **ECONOMIA TRIBUTÁRIA** 💰
   - Regime atual é o melhor?
   - Quanto pode economizar mudando de regime?
   - Créditos tributários não aproveitados
   - Isenções e reduções aplicáveis

3. **DICAS PARA AUMENTAR LUCRO** 📈
   - Como reduzir custos sem perder qualidade
   - Produtos/culturas mais rentáveis
   - Estratégias de precificação
   - Melhor época para vender
   - Vale a pena exportar?

4. **PREVENÇÃO DE ERROS** ⚠️
   - Erros comuns que geram prejuízo
   - Multas e penalidades evitáveis
   - Notas fiscais: o que não pode errar
   - Prazos importantes

5. **PLANO DE AÇÃO** ✅
   - 3 ações imediatas para implementar
   - Potencial de aumento de lucro
   - O que perguntar ao contador

Seja específico, prático e mostre NÚMEROS. O produtor precisa ver quanto vai ganhar!`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Você é um consultor financeiro especializado em agronegócio. Seu objetivo é ajudar o produtor a MAXIMIZAR LUCROS de forma legal e prática. 
            
Use dados reais para suas recomendações. Seja direto: mostre quanto dinheiro o produtor pode ganhar seguindo suas dicas.`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Erro ao gerar dicas:', error);
      throw new Error(error?.message || 'Erro ao gerar dicas de lucro');
    }
  }
}
