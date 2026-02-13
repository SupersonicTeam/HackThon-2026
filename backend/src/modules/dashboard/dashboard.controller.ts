import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
    private readonly ocrService: OcrService,
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
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
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
  async uploadNotaFiscal(
    @UploadedFile() file: Express.Multer.File,
    @Body('produtorId') produtorId: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Nenhum arquivo foi enviado. Envie uma foto ou PDF da nota fiscal.',
      );
    }

    if (!produtorId) {
      // Remove arquivo se produtorId não foi fornecido
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        'produtorId é obrigatório. Informe o ID do produtor.',
      );
    }

    try {
      // Verifica se o produtor existe
      await this.produtorService.findOne(produtorId);

      // Lê o arquivo e converte para base64
      const fileBuffer = fs.readFileSync(file.path);
      const base64Image = fileBuffer.toString('base64');

      // Processa com OCR
      console.log(
        `Processando nota fiscal com OCR: ${file.filename} (${file.mimetype})`,
      );
      const extractedData = await this.ocrService.extractNotaFiscalData(
        base64Image,
        file.mimetype,
      );

      // Prepara dados para criação da nota
      const notaData: CreateNotaFiscalDto = {
        produtorId,
        chaveAcesso: extractedData.chaveAcesso || '',
        tipo: extractedData.tipo,
        numero: extractedData.numero,
        serie: extractedData.serie,
        cfop: extractedData.cfop,
        naturezaOperacao: extractedData.naturezaOperacao,
        nomeEmitente: extractedData.nomeEmitente,
        cpfCnpjEmitente: extractedData.cpfCnpjEmitente,
        destino: extractedData.destino,
        exportacao: extractedData.exportacao || false,
        valorTotal: extractedData.valorTotal,
        valorProdutos: extractedData.valorProdutos,
        valorFrete: extractedData.valorFrete,
        valorSeguro: extractedData.valorSeguro,
        valorDesconto: extractedData.valorDesconto,
        valorOutros: extractedData.valorOutros,
        valorCbs: extractedData.valorCbs,
        valorIbs: extractedData.valorIbs,
        valorFunrural: extractedData.valorFunrural,
        valorIcms: extractedData.valorIcms,
        valorIpi: extractedData.valorIpi,
        arquivoUrl: file.path,
        arquivoTipo: file.mimetype.includes('pdf') ? 'pdf' : 'foto',
        status: 'validada',
        observacoes: `Nota processada automaticamente via OCR em ${new Date().toLocaleString('pt-BR')}`,
        dataEmissao: extractedData.dataEmissao,
        itens: extractedData.itens,
      };

      // Cria a nota fiscal no banco
      const notaCriada = await this.notaFiscalService.create(notaData);

      console.log(
        `✅ Nota fiscal criada com sucesso: ${notaCriada.id} - ${extractedData.itens.length} itens`,
      );

      return {
        success: true,
        message: 'Nota fiscal processada e registrada com sucesso!',
        arquivo: {
          nome: file.filename,
          caminho: file.path,
          tamanho: file.size,
          tipo: file.mimetype,
        },
        dadosExtraidos: extractedData,
        notaCriada: notaCriada,
        resumo: {
          tipo: extractedData.tipo,
          valorTotal: extractedData.valorTotal,
          quantidadeItens: extractedData.itens.length,
          impostos: {
            cbs: extractedData.valorCbs || 0,
            ibs: extractedData.valorIbs || 0,
            funrural: extractedData.valorFunrural || 0,
            icms: extractedData.valorIcms || 0,
            total:
              (extractedData.valorCbs || 0) +
              (extractedData.valorIbs || 0) +
              (extractedData.valorFunrural || 0) +
              (extractedData.valorIcms || 0),
          },
        },
      };
    } catch (error: any) {
      // Remove o arquivo em caso de erro
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      console.error('Erro ao processar nota fiscal:', error);

      throw new BadRequestException(
        error?.message ||
          'Erro ao processar a nota fiscal. Verifique se a imagem está nítida e completa.',
      );
    }
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
