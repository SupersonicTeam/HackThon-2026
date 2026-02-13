import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePendenciaDto } from './dto/create-pendencia.dto';
import { UpdatePendenciaDto } from './dto/update-pendencia.dto';
import { AnexarDocumentoDto } from './dto/anexar-documento.dto';
import { ContadorOcrService } from './contador-ocr.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

type AgendaStatus = 'aberto' | 'concluido' | 'cancelado';

@Injectable()
export class ContadorService {
  private readonly logger = new Logger(ContadorService.name);

  constructor(
    private prisma: PrismaService,
    private ocrService: ContadorOcrService,
    private whatsapp: WhatsappService,
  ) {}

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
      include: { produtor: true },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'concluido',
    });

    // Enviar notificação via WhatsApp
    if (pendencia.produtor?.telefone) {
      const mensagem = `✅ *AgroTributos - Documento Aprovado*

Olá ${pendencia.produtor.nome}!

Seu documento foi analisado e aprovado com sucesso:

📄 *Solicitação:* ${pendencia.titulo}
📅 *Concluído em:* ${new Date().toLocaleDateString('pt-BR')}

Obrigado por enviar a documentação!

_Acesse o sistema para mais detalhes._`;

      try {
        await this.whatsapp.sendText(pendencia.produtor.telefone, mensagem);
        this.logger.log(`✅ Notificação de aprovação enviada para ${pendencia.produtor.telefone}`);
      } catch (error) {
        this.logger.error(`Erro ao enviar notificação WhatsApp: ${error.message}`);
      }
    }

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
      include: { produtor: true },
    });

    await this.upsertAgendaFromPendencia({
      id: pendencia.id,
      produtorId: pendencia.produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: pendencia.dataLimite,
      agendaStatus: 'aberto',
    });

    // Enviar notificação via WhatsApp
    if (pendencia.produtor?.telefone) {
      const mensagem = `🚫 *AgroTributos - Documento Rejeitado*

Olá ${pendencia.produtor.nome}!

Seu documento foi analisado e precisa de correções:

📄 *Solicitação:* ${pendencia.titulo}
❌ *Motivo da rejeição:* ${motivo}
📅 *Prazo:* ${new Date(pendencia.dataLimite).toLocaleDateString('pt-BR')}

Por favor, verifique o documento e envie novamente.

_Acesse o sistema para mais detalhes._`;

      try {
        await this.whatsapp.sendText(pendencia.produtor.telefone, mensagem);
        this.logger.log(`✅ Notificação de rejeição enviada para ${pendencia.produtor.telefone}`);
      } catch (error) {
        this.logger.error(`Erro ao enviar notificação WhatsApp: ${error.message}`);
      }
    }

    return pendencia;
  }

  async anexarDocumento(dto: AnexarDocumentoDto, file?: Express.Multer.File) {
    if (!dto.pendenciaId) {
      throw new Error('PendenciaId é obrigatório');
    }

    const pendencia = await this.prisma.pendenciaContador.findUnique({
      where: { id: dto.pendenciaId },
    });
    if (!pendencia) throw new NotFoundException('Pendência não encontrada');

    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }

    // Usar o arquivo real
    const caminhoArquivo = `/uploads/documentos/${file.filename}`;
    const nomeArquivo = file.originalname;
    const tamanho = file.size;

    // Criar o documento anexado
    const documento = await this.prisma.documentoAnexado.create({
      data: {
        pendenciaId: dto.pendenciaId,
        nomeArquivo,
        tipoDocumento: dto.tipoDocumento,
        tamanho,
        caminhoArquivo,
      },
    });

    // Atualizar status da pendência para "enviado"
    const pendenciaAtualizada = await this.prisma.pendenciaContador.update({
      where: { id: dto.pendenciaId },
      data: { status: 'enviado' },
    });

    // Atualizar a agenda mantendo status como 'aberto' (pendência enviada ainda precisa ser avaliada)
    await this.upsertAgendaFromPendencia({
      id: pendenciaAtualizada.id,
      produtorId: pendenciaAtualizada.produtorId,
      titulo: pendenciaAtualizada.titulo,
      descricao: pendenciaAtualizada.descricao,
      dataLimite: pendenciaAtualizada.dataLimite,
      agendaStatus: 'aberto', // Mantém aberto até o contador aprovar
    });

    return documento;
  }

  async listarDocumentos(pendenciaId: string) {
    return this.prisma.documentoAnexado.findMany({
      where: { pendenciaId },
      orderBy: { dataUpload: 'desc' },
    });
  }

  async downloadDocumento(id: string, res: any) {
    const documento = await this.prisma.documentoAnexado.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    const filePath = `.${documento.caminhoArquivo}`;
    res.download(filePath, documento.nomeArquivo);
  }

  async extrairDadosDocumento(id: string) {
    const documento = await this.prisma.documentoAnexado.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    console.log('📄 Documento encontrado:', documento.nomeArquivo);

    // Se já tem dados extraídos, retorna
    if ((documento as any).dadosExtraidos) {
      console.log('✓ Dados já existentes:', (documento as any).dadosExtraidos);
      return {
        documentoId: documento.id,
        dadosExtraidos: (documento as any).dadosExtraidos,
        jaExistente: true,
      };
    }

    // Extrai usando IA
    const caminhoCompleto = `.${documento.caminhoArquivo}`;
    console.log('🔍 Iniciando extração OCR para:', caminhoCompleto);
    
    const dadosExtraidos = await this.ocrService.extractDocumentoData(
      caminhoCompleto,
      documento.tipoDocumento,
    );

    console.log('✅ Dados extraídos:', dadosExtraidos);

    // Salva no banco
    await this.prisma.documentoAnexado.update({
      where: { id },
      data: { dadosExtraidos: dadosExtraidos as any },
    });

    console.log('💾 Dados salvos no banco');

    return {
      documentoId: documento.id,
      dadosExtraidos,
      jaExistente: false,
    };
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
