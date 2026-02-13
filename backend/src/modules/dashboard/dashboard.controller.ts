import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ProdutorService } from './produtor.service';
import { NotaFiscalService } from './nota-fiscal.service';
import {
  CreateProdutorDto,
  UpdateProdutorDto,
  CreateNotaFiscalDto,
  UpdateNotaFiscalDto,
  DashboardQueryDto,
  DashboardResumoDto,
  FluxoCaixaDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly produtorService: ProdutorService,
    private readonly notaFiscalService: NotaFiscalService,
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

  @Get('notas')
  @ApiOperation({ summary: 'Listar todas as notas fiscais de um produtor' })
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

  @Get('notas/estatisticas/tipo')
  @ApiOperation({ summary: 'Estatísticas de notas por tipo (entrada/saída)' })
  @ApiResponse({
    status: 200,
    description: 'Contagem de notas por tipo',
  })
  countByTipo(
    @Query('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.notaFiscalService.countByTipo(produtorId, query);
  }

  // ==================== DASHBOARD ====================
  @Get(':produtorId/resumo')
  @ApiOperation({ summary: 'Obter resumo do dashboard do produtor' })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Resumo completo do dashboard',
    type: DashboardResumoDto,
  })
  getResumo(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardResumoDto> {
    return this.dashboardService.getResumo(produtorId, query);
  }

  @Get(':produtorId/fluxo-caixa')
  @ApiOperation({ summary: 'Obter fluxo de caixa do produtor' })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Fluxo de caixa detalhado',
    type: FluxoCaixaDto,
  })
  getFluxoCaixa(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<FluxoCaixaDto> {
    return this.dashboardService.getFluxoCaixa(produtorId, query);
  }

  @Get(':produtorId/produtos-principais')
  @ApiOperation({
    summary: 'Obter os 5 produtos com maior faturamento',
  })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Lista dos 5 produtos principais',
  })
  getProdutosPrincipais(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getProdutosPrincipais(produtorId, query);
  }

  @Get(':produtorId/impostos')
  @ApiOperation({ summary: 'Obter detalhamento de impostos por tipo' })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiResponse({
    status: 200,
    description: 'Impostos por tipo (CBS, IBS, Funrural)',
  })
  getImpostos(
    @Param('produtorId') produtorId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getImpostosPorTipo(produtorId, query);
  }

  @Get(':produtorId/evolucao/:ano')
  @ApiOperation({ summary: 'Obter evolução mensal do ano especificado' })
  @ApiParam({ name: 'produtorId', description: 'ID do produtor' })
  @ApiParam({ name: 'ano', description: 'Ano para análise (ex: 2024)' })
  @ApiResponse({
    status: 200,
    description: 'Evolução mensal de faturamento e impostos',
  })
  getEvolucao(
    @Param('produtorId') produtorId: string,
    @Param('ano') ano: number,
  ) {
    return this.dashboardService.getEvolucaoMensal(produtorId, +ano);
  }
}
