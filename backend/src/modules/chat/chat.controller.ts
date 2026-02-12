import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { AiService } from "./ai.service";
import {
  ChatMessageDto,
  ChatResponseDto,
  CalcularImpostoDto,
} from "./dto/chat.dto";

@ApiTags("chat")
@Controller("api/chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Enviar mensagem para o assistente IA" })
  @ApiResponse({
    status: 200,
    description: "Resposta do assistente",
    type: ChatResponseDto,
  })
  async chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.chatService.processMessage(dto.message, dto.context);
  }

  @Post("calcular")
  @ApiOperation({ summary: "Calcular impostos com IA" })
  @ApiResponse({
    status: 200,
    description: "Cálculo detalhado de impostos",
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
        error: error.message || "Erro ao calcular impostos",
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post("stream")
  @ApiOperation({ summary: "Enviar mensagem com streaming de resposta" })
  async chatStream(@Body() dto: ChatMessageDto) {
    return this.chatService.processMessage(dto.message, dto.context);
  }
}
