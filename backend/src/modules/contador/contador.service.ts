import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePendenciaDto } from './dto/create-pendencia.dto';
import { UpdatePendenciaDto } from './dto/update-pendencia.dto';
import { AnexarDocumentoDto } from './dto/anexar-documento.dto';

type AgendaStatus = 'aberto' | 'concluido' | 'cancelado';

@Injectable()
export class ContadorService {
  constructor(private prisma: PrismaService) {}

  private async upsertAgendaFromPendencia(p: {
    id: string;
    produtorId: string;
    titulo: string;
    descricao: string;
    dataLimite: Date;
    agendaStatus: AgendaStatus;
  }) {
    return this.prisma.agendaItem.upsert({
      where: { pendenciaId: p.id }, // pendenciaId é @unique no schema
      create: {
        produtorId: p.produtorId,
        pendenciaId: p.id,
        titulo: p.titulo,
        descricao: p.descricao ?? null,
        data: p.dataLimite,
        status: p.agendaStatus,
        tipo: 'pendencia-contador',
      },
      update: {
        titulo: p.titulo,
        descricao: p.descricao ?? null,
        data: p.dataLimite,
        status: p.agendaStatus,
        tipo: 'pendencia-contador',
      },
    });
  }

  async criar(dto: CreatePendenciaDto) {
    const pendencia = await this.prisma.pendenciaContador.create({
      data: {
        produtorId: dto.produtorId,
        titulo: dto.titulo,
        descricao: dto.descricao ?? '',
        dataLimite: new Date(dto.dataLimite),
        prioridade: dto.prioridade,
        status: 'pendente',
        tiposDocumentos: JSON.stringify(dto.tiposDocumentos),
        observacoes: dto.observacoes ?? null,
      },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'aberto',
    });

    return pendencia;
  }

  async listarPorProdutor(produtorId: string) {
    return this.prisma.pendenciaContador.findMany({
      where: { produtorId },
      orderBy: [{ status: 'asc' }, { dataLimite: 'asc' }],
    });
  }

  async atualizar(id: string, dto: UpdatePendenciaDto) {
    const existe = await this.prisma.pendenciaContador.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Pendência não encontrada');

    const pendencia = await this.prisma.pendenciaContador.update({
      where: { id },
      data: {
        titulo: dto.titulo ?? undefined,
        descricao: dto.descricao ?? undefined,
        dataLimite: dto.dataLimite ? new Date(dto.dataLimite) : undefined,
        prioridade: dto.prioridade ?? undefined,
        tiposDocumentos: dto.tiposDocumentos ? JSON.stringify(dto.tiposDocumentos) : undefined,
        observacoes: dto.observacoes ?? undefined,
      },
    });

    // Mantém status da agenda coerente com o status atual da pendência
    const agendaStatus: AgendaStatus =
      pendencia.status === 'concluida'
        ? 'concluido'
        : pendencia.status === 'cancelada'
        ? 'cancelado'
        : 'aberto';

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus,
    });

    return pendencia;
  }

  async concluir(id: string) {
    const existe = await this.prisma.pendenciaContador.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Pendência não encontrada');

    const pendencia = await this.prisma.pendenciaContador.update({
      where: { id },
      data: { status: 'concluida', dataAtendimento: new Date() },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'concluido',
    });

    return pendencia;
  }

  async cancelar(id: string, motivo: string) {
    const existe = await this.prisma.pendenciaContador.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Pendência não encontrada');

    const pendencia = await this.prisma.pendenciaContador.update({
      where: { id },
      data: { status: 'cancelada', motivoCancelamento: motivo },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'cancelado',
    });

    return pendencia;
  }

  async reabrir(id: string) {
    const existe = await this.prisma.pendenciaContador.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Pendência não encontrada');

    const pendencia = await this.prisma.pendenciaContador.update({
      where: { id },
      data: {
        status: 'pendente',
        dataAtendimento: null,
        motivoCancelamento: null,
        motivoRejeicao: null,
      },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'aberto',
    });

    return pendencia;
  }

  async rejeitar(id: string, motivo: string) {
    const existe = await this.prisma.pendenciaContador.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Pendência não encontrada');

    const pendencia = await this.prisma.pendenciaContador.update({
      where: { id },
      data: { status: 'pendente', motivoRejeicao: motivo },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'aberto',
    });

    return pendencia;
  }

  async anexarDocumento(dto: AnexarDocumentoDto) {
    const pendencia = await this.prisma.pendenciaContador.findUnique({
      where: { id: dto.pendenciaId },
    });
    if (!pendencia) throw new NotFoundException('Pendência não encontrada');

    // Criar o documento anexado
    const documento = await this.prisma.documentoAnexado.create({
      data: {
        pendenciaId: dto.pendenciaId,
        nomeArquivo: dto.nomeArquivo,
        tipoDocumento: dto.tipoDocumento,
        tamanho: dto.tamanho || 0,
        caminhoArquivo: dto.caminhoArquivo || `/uploads/documentos/${dto.nomeArquivo}`,
      },
    });

    // Atualizar status da pendência para "enviado"
    await this.prisma.pendenciaContador.update({
      where: { id: dto.pendenciaId },
      data: { status: 'enviado' },
    });

    return documento;
  }

  async listarDocumentos(pendenciaId: string) {
    return this.prisma.documentoAnexado.findMany({
      where: { pendenciaId },
      orderBy: { dataUpload: 'desc' },
    });
  }

  async listarPendenciasComDocumentos(produtorId: string) {
    return this.prisma.pendenciaContador.findMany({
      where: { 
        produtorId,
        status: 'enviado',
      },
      include: {
        documentos: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });
  }
}
