import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { DashboardService } from './dashboard.service';
import { ProdutorService } from './produtor.service';
import { NotaFiscalService } from './nota-fiscal.service';
import { OcrService } from './ocr.service';
import { CalculadoraService } from './calculadora.service';
import { GeracaoNotaFiscalService } from './geracao-nota-fiscal.service';
import {
  CreateProdutorDto,
  UpdateProdutorDto,
  CreateNotaFiscalDto,
  UpdateNotaFiscalDto,
  DashboardQueryDto,
  DashboardResumoDto,
  FluxoCaixaDto,
  CalcularImpostosDto,
  SimularPrecoVendaDto,
  CompararCenariosDto,
  GerarNotaDiretaDto,
  CreateRascunhoNotaDto,
  UpdateRascunhoNotaDto,
  FeedbackContadorDto,
  FinalizarNotaDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly produtorService: ProdutorService,
    private readonly notaFiscalService: NotaFiscalService,
    private readonly ocrService: OcrService,
    private readonly calculadoraService: CalculadoraService,
    private readonly geracaoNotaFiscalService: GeracaoNotaFiscalService,
  ) {}

  // ==================== PRODUTORES ====================
  @Post('produtores')
  @ApiOperation({ summary: 'Criar novo produtor' })
  @ApiResponse({ status: 201, description: 'Produtor criado com sucesso' })
  createProdutor(@Body() createProdutorDto: CreateProdutorDto) {
    return this.produtorService.create(createProdutorDto);
  }

  @Get('produtores')
  @ApiOperation({ summary: 'Listar todos os produtores' })
  @ApiResponse({ status: 200, description: 'Lista de produtores' })
  findAllProdutores() {
    return this.produtorService.findAll();
  }

  @Get('produtores/:id')
  @ApiOperation({ summary: 'Buscar produtor por ID' })
  @ApiParam({ name: 'id', description: 'ID do produtor' })
  @ApiResponse({ status: 200, description: 'Dados do produtor' })
  @ApiResponse({ status: 404, description: 'Produtor não encontrado' })
  findOneProdutor(@Param('id') id: string) {
    return this.produtorService.findOne(id);
  }

  @Patch('produtores/:id')
  @ApiOperation({ summary: 'Atualizar produtor' })
  @ApiParam({ name: 'id', description: 'ID do produtor' })
  @ApiResponse({ status: 200, description: 'Produtor atualizado' })
  updateProdutor(
    @Param('id') id: string,
    @Body() updateProdutorDto: UpdateProdutorDto,
  ) {
    return this.produtorService.update(id, updateProdutorDto);
  }

  @Delete('produtores/:id')
  @ApiOperation({ summary: 'Remover produtor' })
  @ApiParam({ name: 'id', description: 'ID do produtor' })
  @ApiResponse({ status: 200, description: 'Produtor removido' })
  removeProdutor(@Param('id') id: string) {
    return this.produtorService.remove(id);
  }

  // ==================== NOTAS FISCAIS ====================
  @Post('notas')
  @ApiOperation({ summary: 'Criar nova nota fiscal' })
  @ApiResponse({ status: 201, description: 'Nota fiscal criada com sucesso' })
  createNota(@Body() createNotaDto: CreateNotaFiscalDto) {
    return this.notaFiscalService.create(createNotaDto);
  }

  @Post('notas/upload')
  @ApiOperation({
    summary: 'Upload e processamento automático de nota fiscal via OCR',
    description:
      'Envie uma foto ou PDF da nota fiscal. O sistema irá extrair automaticamente todos os dados usando IA (chave de acesso, produtos, valores, impostos) e registrar no sistema.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'produtorId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo da nota fiscal (foto JPG/PNG ou PDF)',
        },
        produtorId: {
          type: 'string',
          description: 'ID do produtor que receberá esta nota',
          example: 'c4f29a8c-1559-4e6c-b0fd-05ce55753c4f',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Nota fiscal processada e registrada com sucesso. Retorna os dados extraídos e a nota criada.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Erro no processamento: arquivo inválido, imagem ilegível ou dados incompletos.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/notas',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `nota-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/pdf',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de arquivo não permitido. Envie JPG, PNG ou PDF.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadNota(
    @UploadedFile() file: Express.Multer.File,
    @Body('produtorId') produtorId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório.');
    }

    if (!produtorId) {
      throw new BadRequestException(
        'produtorId é obrigatório. Informe o ID do produtor.',
      );
    }

    try {
      // Converte o arquivo para base64
      const fileBuffer = fs.readFileSync(file.path);
      const base64File = fileBuffer.toString('base64');

      // Processa via OCR
      const dadosExtraidos = await this.ocrService.extractNotaFiscalData(
        base64File,
        file.mimetype,
      );

      // Cria a nota fiscal com os dados extraídos
      const notaFiscalData: CreateNotaFiscalDto = {
        produtorId,
        chaveAcesso: dadosExtraidos.chaveAcesso || `TEMP-${Date.now()}`,
        tipo: dadosExtraidos.tipo,
        numero: dadosExtraidos.numero,
        serie: dadosExtraidos.serie,
        cfop: dadosExtraidos.cfop,
        naturezaOperacao: dadosExtraidos.naturezaOperacao,
        nomeEmitente: dadosExtraidos.nomeEmitente,
        cpfCnpjEmitente: dadosExtraidos.cpfCnpjEmitente,
        destino: dadosExtraidos.destino,
        exportacao: dadosExtraidos.exportacao || false,
        valorTotal: dadosExtraidos.valorTotal,
        valorProdutos: dadosExtraidos.valorProdutos,
        valorFrete: dadosExtraidos.valorFrete,
        valorSeguro: dadosExtraidos.valorSeguro,
        valorDesconto: dadosExtraidos.valorDesconto,
        valorOutros: dadosExtraidos.valorOutros,
        valorCbs: dadosExtraidos.valorCbs,
        valorIbs: dadosExtraidos.valorIbs,
        valorFunrural: dadosExtraidos.valorFunrural,
        valorIcms: dadosExtraidos.valorIcms,
        valorIpi: dadosExtraidos.valorIpi,
        observacoes: 'Nota processada automaticamente via OCR',
        dataEmissao: dadosExtraidos.dataEmissao,
        arquivoUrl: file.path,
        arquivoTipo: file.mimetype === 'application/pdf' ? 'pdf' : 'foto',
        status: 'validada',
        itens: dadosExtraidos.itens,
      };

      const notaCriada = await this.notaFiscalService.create(notaFiscalData);

      return {
        success: true,
        message: 'Nota fiscal processada e registrada com sucesso!',
        dadosExtraidos,
        notaFiscal: notaCriada,
        arquivo: {
          nome: file.filename,
          tamanho: file.size,
          tipo: file.mimetype,
          caminho: file.path,
        },
      };
    } catch (error) {
      // Remove o arquivo se houver erro no processamento
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      if (error.message.includes('Produtor')) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException(
        'Erro ao processar a estrutura da nota fiscal. A imagem pode estar ilegível ou não ser uma NF-e válida. Detalhes: ' +
          error.message,
      );
    }
  }

  @Get('notas')
  @ApiOperation({ summary: 'Listar notas fiscais' })
  @ApiResponse({ status: 200, description: 'Lista de notas fiscais' })
  findAllNotas(
    @Query('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.notaFiscalService.findAll(produtorId, query);
  }

  @Get('notas/:id')
  @ApiOperation({ summary: 'Buscar nota fiscal por ID' })
  @ApiParam({ name: 'id', description: 'ID da nota fiscal' })
  @ApiResponse({ status: 200, description: 'Dados da nota fiscal' })
  @ApiResponse({ status: 404, description: 'Nota fiscal não encontrada' })
  findOneNota(@Param('id') id: string) {
    return this.notaFiscalService.findOne(id);
  }

  @Patch('notas/:id')
  @ApiOperation({ summary: 'Atualizar nota fiscal' })
  @ApiParam({ name: 'id', description: 'ID da nota fiscal' })
  @ApiResponse({ status: 200, description: 'Nota fiscal atualizada' })
  updateNota(
    @Param('id') id: string,
    @Body() updateNotaDto: UpdateNotaFiscalDto,
  ) {
    return this.notaFiscalService.update(id, updateNotaDto);
  }

  @Delete('notas/:id')
  @ApiOperation({ summary: 'Remover nota fiscal' })
  @ApiParam({ name: 'id', description: 'ID da nota fiscal' })
  @ApiResponse({ status: 200, description: 'Nota fiscal removida' })
  removeNota(@Param('id') id: string) {
    return this.notaFiscalService.remove(id);
  }

  // ==================== DASHBOARD RESUMO ====================
  @Get(':produtorId/resumo')
  @ApiOperation({ summary: 'Obter resumo do dashboard' })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Resumo do dashboard',
    type: DashboardResumoDto,
  })
  getResumo(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardResumoDto> {
    return this.dashboardService.getResumo(produtorId, query);
  }

  @Get(':produtorId/fluxo-caixa')
  @ApiOperation({
    summary: 'Obter fluxo de caixa do produtor',
    description: 'Calcula entradas, saídas, saldo e impostos do produtor',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Dados do fluxo de caixa',
    type: FluxoCaixaDto,
  })
  getFluxoCaixa(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<FluxoCaixaDto> {
    return this.dashboardService.getFluxoCaixa(produtorId, query);
  }

  @Get(':produtorId/evolucao-mensal')
  @ApiOperation({
    summary: 'Evolução mensal do produtor',
    description: 'Mostra a evolução mês a mês do fluxo de caixa',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Evolução mensal do fluxo de caixa',
  })
  getEvolucaoMensal(
    @Param('produtorId') produtorId: string,
    @Query('ano') ano: number,
  ) {
    return this.dashboardService.getEvolucaoMensal(produtorId, ano);
  }

  @Get(':produtorId/produtos-principais')
  @ApiOperation({
    summary: 'Produtos principais do produtor',
    description: 'Lista os produtos com maior faturamento',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Lista dos produtos principais',
  })
  getProdutosPrincipais(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getProdutosPrincipais(produtorId, query);
  }

  @Get(':produtorId/impostos-por-tipo')
  @ApiOperation({
    summary: 'Impostos por tipo',
    description: 'Breakdown dos impostos por categoria (CBS, IBS, FUNRURAL)',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Impostos detalhados por tipo',
  })
  getImpostosPorTipo(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getImpostosPorTipo(produtorId, query);
  }

  // ==================== CALCULADORA DE IMPOSTOS ====================
  @Post('calculadora/impostos')
  @ApiOperation({
    summary: 'Calcular impostos para uma operação',
    description:
      'Calcula CBS, IBS e outros impostos baseado nos dados da operação',
  })
  @ApiResponse({
    status: 200,
    description:
      'Impostos calculados com detalhamento por tipo e valor líquido',
  })
  calcularImpostos(@Body() dto: CalcularImpostosDto) {
    return this.calculadoraService.calcularImpostos({
      dataFatoGerador: dto.dataFatoGerador,
      tipo: dto.tipo,
      uf: dto.uf,
      municipio: dto.municipio,
      ncm: dto.ncm,
      cst: dto.cst,
      classificacaoTributaria: dto.classificacaoTributaria,
      valorBaseCalculo: dto.valorBaseCalculo,
      quantidade: dto.quantidade,
      unidadeMedida: dto.unidadeMedida,
    });
  }

  @Post('calculadora/simular-preco')
  @ApiOperation({
    summary: 'Simular preço de venda para margem desejada',
    description:
      'Calcula o preço de venda necessário para atingir uma margem de lucro específica após impostos',
  })
  @ApiResponse({
    status: 200,
    description:
      'Preço sugerido, impostos calculados e margem de lucro real após impostos',
  })
  simularPrecoVenda(@Body() dto: SimularPrecoVendaDto) {
    return this.calculadoraService.simularPrecoVenda({
      custoProducao: dto.custoProducao,
      quantidade: dto.quantidade,
      margemLucroDesejada: dto.margemLucroDesejada,
      tipo: dto.tipo,
      uf: dto.uf,
      classificacaoTributaria: dto.classificacaoTributaria,
    });
  }

  @Post('calculadora/comparar-cenarios')
  @ApiOperation({
    summary: 'Comparar diferentes cenários de margem de lucro',
    description:
      'Compara múltiplas margens de lucro para identificar o melhor preço de venda',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparação de cenários com diferentes margens de lucro',
  })
  compararCenarios(@Body() dto: CompararCenariosDto) {
    return this.calculadoraService.compararCenarios({
      custoProducao: dto.custoProducao,
      quantidade: dto.quantidade,
      tipo: dto.tipo,
      uf: dto.uf,
      classificacaoTributaria: dto.classificacaoTributaria,
      margensTeste: dto.margensTeste,
    });
  }

  // ==================== GERAÇÃO DE NOTAS FISCAIS ====================

  @Post('notas/gerar-direta')
  @ApiOperation({
    summary: 'Gerar nota fiscal diretamente (✅ FUNCIONAL)',
    description:
      'Gera uma nota fiscal diretamente sem passar pelo processo de rascunho. Esta funcionalidade está totalmente operacional!',
  })
  @ApiResponse({
    status: 201,
    description: 'Nota fiscal gerada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Produtor não encontrado',
  })
  gerarNotaDireta(@Body() gerarNotaDto: GerarNotaDiretaDto) {
    return this.geracaoNotaFiscalService.gerarNotaDireta(gerarNotaDto);
  }

  @Get('geracao-notas/status')
  @ApiOperation({
    summary: 'Status das funcionalidades de geração de notas',
    description:
      'Mostra quais funcionalidades estão disponíveis e instruções para implementação completa do sistema de rascunhos',
  })
  @ApiResponse({
    status: 200,
    description: 'Status das funcionalidades disponíveis',
  })
  getStatusFuncionalidades() {
    return this.geracaoNotaFiscalService.getStatusFuncionalidades();
  }

  // ==================== SISTEMA DE RASCUNHOS ✅ FUNCIONAL ====================

  @Post('rascunhos')
  @ApiOperation({
    summary: '✅ Criar rascunho de nota fiscal (FUNCIONAL)',
    description:
      'Cria um rascunho de nota fiscal para análise posterior. Ideal para produtores que querem validação antes de gerar a nota definitiva.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rascunho criado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Produtor não encontrado',
  })
  criarRascunho(@Body() createRascunhoDto: CreateRascunhoNotaDto) {
    return this.geracaoNotaFiscalService.criarRascunho(createRascunhoDto);
  }

  @Get('rascunhos/:produtorId')
  @ApiOperation({
    summary: '✅ Listar rascunhos do produtor (FUNCIONAL)',
    description:
      'Lista todos os rascunhos de um produtor, com opção de filtrar por status',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de rascunhos',
  })
  listarRascunhos(
    @Param('produtorId') produtorId: string,
    @Query('status') status?: string,
  ) {
    return this.geracaoNotaFiscalService.listarRascunhos(produtorId, status);
  }

  @Get('rascunhos/detalhes/:id')
  @ApiOperation({
    summary: '✅ Obter detalhes de um rascunho (FUNCIONAL)',
    description: 'Busca um rascunho específico com todos os detalhes e itens',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 200,
    description: 'Dados completos do rascunho',
  })
  @ApiResponse({
    status: 404,
    description: 'Rascunho não encontrado',
  })
  obterRascunho(@Param('id') id: string) {
    return this.geracaoNotaFiscalService.obterRascunho(id);
  }

  @Put('rascunhos/:id')
  @ApiOperation({
    summary: '✅ Atualizar rascunho (FUNCIONAL)',
    description:
      'Atualiza um rascunho existente. Só permite edição se status for "draft" ou "revisao"',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 200,
    description: 'Rascunho atualizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Rascunho não pode ser editado no status atual',
  })
  atualizarRascunho(
    @Param('id') id: string,
    @Body() updateRascunhoDto: UpdateRascunhoNotaDto,
  ) {
    return this.geracaoNotaFiscalService.atualizarRascunho(
      id,
      updateRascunhoDto,
    );
  }

  @Post('rascunhos/:id/enviar-contador')
  @ApiOperation({
    summary: '✅ Enviar rascunho para análise do contador (FUNCIONAL)',
    description:
      'Envia um rascunho para o contador analisar e fornecer feedback',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 200,
    description: 'Rascunho enviado para análise',
  })
  enviarParaContador(
    @Param('id') id: string,
    @Body('contadorId') contadorId?: string,
  ) {
    return this.geracaoNotaFiscalService.enviarParaContador(id, contadorId);
  }

  @Post('rascunhos/:id/feedback')
  @ApiOperation({
    summary: '✅ Contador fornece feedback (FUNCIONAL)',
    description:
      'Contador analisa o rascunho e fornece feedback com aprovação, revisão ou reprovação',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 200,
    description: 'Feedback registrado com sucesso',
  })
  fornecerFeedback(
    @Param('id') id: string,
    @Body() feedbackDto: FeedbackContadorDto,
  ) {
    return this.geracaoNotaFiscalService.fornecerFeedback(id, feedbackDto);
  }

  @Post('rascunhos/:id/finalizar')
  @ApiOperation({
    summary: '✅ Finalizar rascunho e gerar nota fiscal (FUNCIONAL)',
    description:
      'Converte um rascunho aprovado em nota fiscal oficial no sistema',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 201,
    description: 'Nota fiscal gerada a partir do rascunho',
  })
  @ApiResponse({
    status: 400,
    description: 'Rascunho não está no status adequado para finalização',
  })
  finalizarRascunho(
    @Param('id') id: string,
    @Body() finalizarDto: FinalizarNotaDto,
  ) {
    return this.geracaoNotaFiscalService.finalizarNota(id, finalizarDto);
  }

  @Get('contador/rascunhos-pendentes')
  @ApiOperation({
    summary: '✅ Listar rascunhos pendentes para o contador (FUNCIONAL)',
    description: 'Lista todos os rascunhos enviados para análise do contador',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de rascunhos pendentes de análise',
  })
  listarPendentesContador(@Query('contadorId') contadorId?: string) {
    return this.geracaoNotaFiscalService.listarPendentesContador(contadorId);
  }

  @Delete('rascunhos/:id')
  @ApiOperation({
    summary: '✅ Remover rascunho (FUNCIONAL)',
    description:
      'Remove um rascunho do sistema. Só permite remoção se status for "draft"',
  })
  @ApiParam({ name: 'id', description: 'ID do rascunho' })
  @ApiResponse({
    status: 200,
    description: 'Rascunho removido com sucesso',
  })
  removerRascunho(@Param('id') id: string) {
    return this.geracaoNotaFiscalService.removerRascunho(id);
  }
}
