import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificacaoService } from './notificacao.service';

class EnviarNotificacaoDto {
  produtorId: string;
  mensagem: string;
}

class NotificarDocumentoDto {
  tipo: string;
  numero?: string;
  dataVencimento: string;
  valor?: number;
}

class MensagemPersonalizadaDto {
  titulo: string;
  corpo: string;
}

@ApiTags('Notificações WhatsApp')
@Controller('notificacao')
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Post('enviar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia notificação via WhatsApp para produtor' })
  @ApiBody({ type: EnviarNotificacaoDto })
  @ApiResponse({ status: 200, description: 'Notificação enviada com sucesso' })
  async enviarNotificacao(@Body() body: EnviarNotificacaoDto) {
    return this.notificacaoService.enviarNotificacao(
      body.produtorId,
      body.mensagem,
    );
  }

  @Post(':produtorId/documento-atrasado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notifica produtor sobre documento atrasado' })
  @ApiBody({ type: NotificarDocumentoDto })
  @ApiResponse({ status: 200, description: 'Notificação enviada' })
  async notificarDocumentoAtrasado(
    @Param('produtorId') produtorId: string,
    @Body() body: NotificarDocumentoDto,
  ) {
    return this.notificacaoService.notificarDocumentoAtrasado(produtorId, {
      tipo: body.tipo,
      numero: body.numero,
      dataVencimento: new Date(body.dataVencimento),
      valor: body.valor,
    });
  }

  @Post(':produtorId/todos-atrasados')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notifica produtor sobre TODOS os documentos atrasados',
  })
  @ApiResponse({ status: 200, description: 'Notificações enviadas' })
  async notificarTodosAtrasados(@Param('produtorId') produtorId: string) {
    return this.notificacaoService.notificarTodosDocumentosAtrasados(produtorId);
  }

  @Post(':produtorId/proximas-obrigacoes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notifica produtor sobre obrigações fiscais dos próximos 7 dias',
  })
  @ApiResponse({ status: 200, description: 'Notificações enviadas' })
  async notificarProximasObrigacoes(@Param('produtorId') produtorId: string) {
    return this.notificacaoService.notificarProximasObrigacoes(produtorId);
  }

  @Post(':produtorId/mensagem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia mensagem personalizada para produtor' })
  @ApiBody({ type: MensagemPersonalizadaDto })
  @ApiResponse({ status: 200, description: 'Mensagem enviada' })
  async enviarMensagemPersonalizada(
    @Param('produtorId') produtorId: string,
    @Body() body: MensagemPersonalizadaDto,
  ) {
    return this.notificacaoService.enviarMensagemPersonalizada(
      produtorId,
      body.titulo,
      body.corpo,
    );
  }

  @Post(':produtorId/nfe-emitida')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notifica produtor sobre NF-e emitida' })
  @ApiResponse({ status: 200, description: 'Notificação enviada' })
  async notificarNFeEmitida(
    @Param('produtorId') produtorId: string,
    @Body()
    body: {
      numero: string;
      serie: string;
      valor: number;
      tipo: string;
      chaveAcesso: string;
    },
  ) {
    return this.notificacaoService.notificarNFeEmitida(produtorId, body);
  }
}
