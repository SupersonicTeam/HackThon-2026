import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AiService } from './ai.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  CalcularImpostoDto,
  AnalisarNotaDto,
  SimularPrecoDto,
  DicasLucroDto,
} from './dto/chat.dto';

@ApiTags('chat')
@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enviar mensagem para o assistente IA' })
  @ApiResponse({
    status: 200,
    description: 'Resposta do assistente',
    type: ChatResponseDto,
  })
  async chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.chatService.processMessage(dto.message, dto.context);
  }

  @Post('calcular')
  @ApiOperation({ summary: 'Calcular impostos com IA' })
  @ApiResponse({
    status: 200,
    description: 'Cálculo detalhado de impostos',
  })
  async calcularImposto(@Body() dto: CalcularImpostoDto) {
    try {
      const resultado = await this.aiService.calcularImposto({
        faturamentoAnual: dto.faturamentoAnual,
        regime: dto.regime,
        culturas: dto.culturas,
        custoInsumos: dto.custoInsumos,
      });

      return {
        success: true,
        calculo: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao calcular impostos',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('stream')
  @ApiOperation({ summary: 'Enviar mensagem com streaming de resposta' })
  async chatStream(@Body() dto: ChatMessageDto) {
    return this.chatService.processMessage(dto.message, dto.context);
  }

  @Post('analisar-nota')
  @ApiOperation({
    summary:
      'Analisar nota fiscal - validação, impostos e orientações de preenchimento',
  })
  @ApiResponse({
    status: 200,
    description:
      'Análise completa da nota com validações e dicas para evitar erros',
  })
  async analisarNota(@Body() dto: AnalisarNotaDto) {
    try {
      const analise = await this.aiService.analisarNota(
        dto.nota,
        dto.regimeTributario,
      );

      return {
        success: true,
        analise,
        nota: dto.nota,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao analisar nota fiscal',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('simular-preco')
  @ApiOperation({
    summary:
      'Simular preço de venda ideal considerando custos, impostos e margem de lucro',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulação de preços com diferentes cenários e recomendações',
  })
  async simularPreco(@Body() dto: SimularPrecoDto) {
    try {
      const simulacao = await this.aiService.simularPreco({
        produto: dto.produto,
        custoProducao: dto.custoProducao,
        quantidade: dto.quantidade,
        regime: dto.regime,
        margemLucro: dto.margemLucro,
        exportacao: dto.exportacao,
      });

      return {
        success: true,
        simulacao,
        parametros: dto,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao simular preço',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('dicas-lucro')
  @ApiOperation({
    summary:
      'Obter dicas personalizadas para aumentar lucro e prevenir erros fiscais',
  })
  @ApiResponse({
    status: 200,
    description:
      'Análise financeira completa com dicas práticas para maximizar lucro',
  })
  async dicasLucro(@Body() dto: DicasLucroDto) {
    try {
      const dicas = await this.aiService.gerarDicasLucro({
        faturamentoAnual: dto.faturamentoAnual,
        custoTotal: dto.custoTotal,
        regime: dto.regime,
        culturas: dto.culturas,
        notas: dto.notas,
      });

      return {
        success: true,
        dicas,
        situacao: {
          faturamento: dto.faturamentoAnual,
          custos: dto.custoTotal,
          lucro: dto.faturamentoAnual - dto.custoTotal,
          margem:
            ((dto.faturamentoAnual - dto.custoTotal) / dto.faturamentoAnual) *
            100,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao gerar dicas de lucro',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
