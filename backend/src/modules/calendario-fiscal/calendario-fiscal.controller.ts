import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CalendarioFiscalService } from './calendario-fiscal.service';
import {
  ConfigurarNotificacoesDto,
  GerarRelatorioMensalDto,
  EnviarRelatorioContadorDto,
  ConfigurarEnvioAutomaticoDto,
  CriarPendenciaDto,
  SelecionarDocumentosDto,
  GerarPacoteDocumentosDto,
} from './calendario-fiscal.dto';

@ApiTags('Calendário Fiscal')
@Controller('api/calendario-fiscal')
export class CalendarioFiscalController {
  constructor(
    private readonly calendarioFiscalService: CalendarioFiscalService,
  ) {}

  // ==================== CALENDÁRIO FISCAL ====================
  @Get(':produtorId/resumo')
  @ApiOperation({
    summary: 'Obter resumo do calendário fiscal',
    description: 'Próximos vencimentos, alertas e obrigações pendentes',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Resumo do calendário fiscal com próximos vencimentos',
  })
  getResumoCalendario(@Param('produtorId') produtorId: string) {
    return this.calendarioFiscalService.getResumoCalendario(produtorId);
  }

  @Get(':produtorId/vencimentos')
  @ApiOperation({
    summary: 'Obter próximos vencimentos fiscais',
    description: 'Lista de obrigações fiscais com datas de vencimento',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de próximos vencimentos fiscais',
  })
  getProximosVencimentos(
    @Param('produtorId') produtorId: string,
    @Query('dias') dias: number = 30,
  ) {
    return this.calendarioFiscalService.getProximosVencimentos(
      produtorId,
      dias,
    );
  }

  @Post(':produtorId/inicializar')
  @ApiOperation({
    summary: 'Inicializar calendário fiscal',
    description:
      'Configura calendário fiscal baseado no regime tributário do produtor',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Calendário fiscal inicializado com obrigações aplicáveis',
  })
  inicializarCalendario(
    @Param('produtorId') produtorId: string,
    @Query('regime') regime: string,
  ) {
    return this.calendarioFiscalService.inicializarCalendario(
      produtorId,
      regime,
    );
  }

  @Post(':produtorId/notificacoes')
  @ApiOperation({
    summary: 'Configurar notificações automáticas',
    description:
      'Define como e quando receber lembretes de vencimentos fiscais',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Notificações configuradas com sucesso',
  })
  configurarNotificacoes(
    @Param('produtorId') produtorId: string,
    @Body() dto: ConfigurarNotificacoesDto,
  ) {
    return this.calendarioFiscalService.configurarNotificacoes(produtorId, {
      diasAntecedencia: dto.diasAntecedencia,
      tiposNotificacao: dto.tiposNotificacao,
      ativo: dto.ativo,
    });
  }

  @Post(':produtorId/relatorio-mensal/gerar')
  @ApiOperation({
    summary: 'Gerar relatório mensal para o contador',
    description:
      'Cria relatório completo com notas fiscais, impostos e fluxo de caixa',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Relatório mensal gerado com sucesso',
  })
  gerarRelatorioMensal(
    @Param('produtorId') produtorId: string,
    @Body() dto: GerarRelatorioMensalDto,
  ) {
    return this.calendarioFiscalService.gerarRelatorioMensal(
      produtorId,
      dto.mes,
      dto.ano,
    );
  }

  @Post(':produtorId/relatorio-mensal/enviar')
  @ApiOperation({
    summary: 'Enviar relatório para o contador',
    description: 'Envia relatório mensal por email para o contador',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Relatório enviado com sucesso para o contador',
  })
  enviarRelatorioContador(
    @Param('produtorId') produtorId: string,
    @Body() dto: EnviarRelatorioContadorDto,
  ) {
    return this.calendarioFiscalService.enviarRelatorioContador(
      produtorId,
      dto.relatorioId,
      dto.contadorEmail,
    );
  }

  @Post(':produtorId/relatorio-mensal/configurar-automatico')
  @ApiOperation({
    summary: 'Configurar envio automático mensal',
    description:
      'Configura envio automático de relatórios mensais para o contador',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Envio automático configurado com sucesso',
  })
  configurarEnvioAutomatico(
    @Param('produtorId') produtorId: string,
    @Body() dto: ConfigurarEnvioAutomaticoDto,
  ) {
    return this.calendarioFiscalService.configurarEnvioAutomatico(produtorId, {
      contadorEmail: dto.contadorEmail,
      diaEnvio: dto.diaEnvio,
      ativo: dto.ativo,
      incluirAnexos: dto.incluirAnexos,
    });
  }

  // ==================== PENDÊNCIAS E ANEXOS ====================

  @Get(':produtorId/pendencias')
  @ApiOperation({
    summary: 'Listar pendências do produtor',
    description:
      'Lista todas as pendências criadas pelo contador para o produtor',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pendências do produtor',
  })
  listarPendencias(@Param('produtorId') produtorId: string) {
    return this.calendarioFiscalService.listarPendencias(produtorId);
  }

  @Post(':produtorId/pendencias/criar')
  @ApiOperation({
    summary: 'Criar nova pendência (Contador)',
    description: 'Permite ao contador criar uma nova pendência para o produtor',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Pendência criada com sucesso',
  })
  criarPendencia(
    @Param('produtorId') produtorId: string,
    @Body() dto: CriarPendenciaDto,
  ) {
    return this.calendarioFiscalService.criarPendencia(produtorId, {
      titulo: dto.titulo,
      descricao: dto.descricao,
      dataLimite: dto.dataLimite,
      tiposDocumentos: dto.tiposDocumentos,
      prioridade: dto.prioridade,
      observacoes: dto.observacoes,
    });
  }

  @Post(':produtorId/documentos/selecionar')
  @ApiOperation({
    summary: 'Selecionar documentos para pendência',
    description:
      'Permite ao produtor selecionar documentos para atender uma pendência',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Documentos selecionados com sucesso',
  })
  selecionarDocumentos(
    @Param('produtorId') produtorId: string,
    @Body() dto: SelecionarDocumentosDto,
  ) {
    return this.calendarioFiscalService.selecionarDocumentos(produtorId, {
      pendenciaId: dto.pendenciaId,
      documentosSelecionados: dto.documentosSelecionados,
      observacoesProduto: dto.observacoesProduto,
    });
  }

  @Post(':produtorId/documentos/gerar-pacote')
  @ApiOperation({
    summary: 'Gerar pacote ZIP com documentos',
    description:
      'Gera um arquivo ZIP com os documentos selecionados e cria link para download',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Pacote de documentos gerado com sucesso',
  })
  gerarPacoteDocumentos(
    @Param('produtorId') produtorId: string,
    @Body() dto: GerarPacoteDocumentosDto,
  ) {
    return this.calendarioFiscalService.gerarPacoteDocumentos(produtorId, {
      pendenciaId: dto.pendenciaId,
      nomePacote: dto.nomePacote,
      incluirSenha: dto.incluirSenha,
      notificarContador: dto.notificarContador,
    });
  }

  @Get(':produtorId/documentos/historico')
  @ApiOperation({
    summary: 'Histórico de pacotes enviados',
    description:
      'Lista todos os pacotes de documentos já gerados pelo produtor',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de pacotes de documentos',
  })
  obterHistoricoPacotes(@Param('produtorId') produtorId: string) {
    return this.calendarioFiscalService.obterHistoricoPacotes(produtorId);
  }
}
