import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseInterceptors, UploadedFile, Res, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response, Request } from 'express';
import { ContadorService } from './contador.service';
import { CreatePendenciaDto } from './dto/create-pendencia.dto';
import { UpdatePendenciaDto } from './dto/update-pendencia.dto';
import { CancelarPendenciaDto } from './dto/cancelar-pendencia.dto';
import { RejeitarPendenciaDto } from './dto/rejeitar-pendencia.dto';
import { AnexarDocumentoDto } from './dto/anexar-documento.dto';

@ApiTags('Contador')
@Controller('contador')
export class ContadorController {
  constructor(private readonly service: ContadorService) {}

  @Post('pendencias')
  criar(@Body() dto: CreatePendenciaDto) {
    return this.service.criar(dto);
  }

  @Get('pendencias')
  listar(@Query('produtorId') produtorId: string) {
    return this.service.listarPorProdutor(produtorId);
  }

  @Put('pendencias/:id')
  atualizar(@Param('id') id: string, @Body() dto: UpdatePendenciaDto) {
    return this.service.atualizar(id, dto);
  }

  @Patch('pendencias/:id/concluir')
  concluir(@Param('id') id: string) {
    return this.service.concluir(id);
  }

  @Patch('pendencias/:id/cancelar')
  cancelar(@Param('id') id: string, @Body() dto: CancelarPendenciaDto) {
    return this.service.cancelar(id, dto.motivo);
  }

  @Patch('pendencias/:id/reabrir')
  reabrir(@Param('id') id: string) {
    return this.service.reabrir(id);
  }

  @Patch('pendencias/:id/rejeitar')
  rejeitar(@Param('id') id: string, @Body() dto: RejeitarPendenciaDto) {
    return this.service.rejeitar(id, dto.motivo);
  }

  @Post('documentos/anexar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        pendenciaId: { type: 'string' },
        nomeArquivo: { type: 'string' },
        tipoDocumento: { type: 'string' },
        tamanho: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documentos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  anexarDocumento(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Construir DTO a partir do req.body (multipart form data)
    const dto: AnexarDocumentoDto = {
      pendenciaId: req.body.pendenciaId,
      nomeArquivo: req.body.nomeArquivo || file?.originalname,
      tipoDocumento: req.body.tipoDocumento || 'documento-geral',
      tamanho: req.body.tamanho ? parseInt(req.body.tamanho, 10) : undefined,
    };

    console.log('📤 Upload recebido:', { dto, fileName: file?.originalname, fileSize: file?.size });
    
    return this.service.anexarDocumento(dto, file);
  }

  @Get('documentos/:id/download')
  downloadDocumento(@Param('id') id: string, @Res() res: Response) {
    return this.service.downloadDocumento(id, res);
  }

  @Post('documentos/:id/extrair-dados')
  extrairDadosDocumento(@Param('id') id: string) {
    return this.service.extrairDadosDocumento(id);
  }

  @Get('pendencias/:id/documentos')
  listarDocumentos(@Param('id') pendenciaId: string) {
    return this.service.listarDocumentos(pendenciaId);
  }

  @Get('pendencias-recebidos')
  listarPendenciasRecebidas(@Query('produtorId') produtorId: string) {
    return this.service.listarPendenciasComDocumentos(produtorId);
  }
}
