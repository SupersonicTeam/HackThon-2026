import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  anexarDocumento(@Body() dto: AnexarDocumentoDto) {
    return this.service.anexarDocumento(dto);
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
