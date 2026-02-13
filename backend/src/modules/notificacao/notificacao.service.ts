import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

export interface NotificacaoResult {
  success: boolean;
  telefone?: string;
  mensagem?: string;
  erro?: string;
}

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  /**
   * Busca o telefone do produtor pelo ID
   */
  private async getTelefoneProdutor(produtorId: string): Promise<string | null> {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      select: { telefone: true, nome: true },
    });
    return produtor?.telefone || null;
  }

  /**
   * Envia notificação via WhatsApp para um produtor
   */
  async enviarNotificacao(
    produtorId: string,
    mensagem: string,
  ): Promise<NotificacaoResult> {
    try {
      const telefone = await this.getTelefoneProdutor(produtorId);

      if (!telefone) {
        return {
          success: false,
          erro: 'Produtor não possui telefone cadastrado',
        };
      }

      await this.whatsapp.sendText(telefone, mensagem);

      this.logger.log(`✅ Notificação enviada para ${telefone}`);

      return {
        success: true,
        telefone,
        mensagem,
      };
    } catch (error) {
      this.logger.error(`Erro ao enviar notificação: ${error.message}`);
      return {
        success: false,
        erro: error.message,
      };
    }
  }

  /**
   * Notifica sobre documento atrasado
   */
  async notificarDocumentoAtrasado(
    produtorId: string,
    documento: {
      tipo: string;
      numero?: string;
      dataVencimento: Date;
      valor?: number;
    },
  ): Promise<NotificacaoResult> {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      select: { nome: true, telefone: true },
    });

    if (!produtor) {
      return { success: false, erro: 'Produtor não encontrado' };
    }

    const diasAtraso = Math.floor(
      (Date.now() - new Date(documento.dataVencimento).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const mensagem = `🚨 *AgroTributos - Documento Atrasado*

Olá ${produtor.nome}!

Identificamos um documento pendente:

📄 *Tipo:* ${documento.tipo}
${documento.numero ? `📋 *Número:* ${documento.numero}` : ''}
📅 *Vencimento:* ${new Date(documento.dataVencimento).toLocaleDateString('pt-BR')}
⏰ *Dias em atraso:* ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}
${documento.valor ? `💰 *Valor:* R$ ${documento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

Por favor, regularize o quanto antes para evitar multas e juros.

_Acesse o sistema para mais detalhes._`;

    return this.enviarNotificacao(produtorId, mensagem);
  }

  /**
   * Notifica sobre obrigação fiscal próxima do vencimento
   */
  async notificarObrigacaoFiscal(
    produtorId: string,
    obrigacao: {
      nome: string;
      descricao: string;
      dataVencimento: Date;
      diasRestantes: number;
      valor?: number;
    },
  ): Promise<NotificacaoResult> {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      select: { nome: true, telefone: true },
    });

    if (!produtor) {
      return { success: false, erro: 'Produtor não encontrado' };
    }

    const urgencia =
      obrigacao.diasRestantes <= 1
        ? '🔴 URGENTE'
        : obrigacao.diasRestantes <= 3
          ? '🟠 ATENÇÃO'
          : '🟡 LEMBRETE';

    const mensagem = `${urgencia} *AgroTributos - Obrigação Fiscal*

Olá ${produtor.nome}!

${obrigacao.diasRestantes === 0 ? '⚠️ *VENCE HOJE!*' : `📅 *Faltam ${obrigacao.diasRestantes} ${obrigacao.diasRestantes === 1 ? 'dia' : 'dias'}*`}

📋 *${obrigacao.nome}*
${obrigacao.descricao}

🗓️ *Vencimento:* ${new Date(obrigacao.dataVencimento).toLocaleDateString('pt-BR')}
${obrigacao.valor ? `💰 *Valor estimado:* R$ ${obrigacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

_Não perca o prazo! Acesse o sistema para mais detalhes._`;

    return this.enviarNotificacao(produtorId, mensagem);
  }

  /**
   * Notifica sobre NF-e emitida com sucesso
   */
  async notificarNFeEmitida(
    produtorId: string,
    nota: {
      numero: string;
      serie: string;
      valor: number;
      tipo: string;
      chaveAcesso: string;
    },
  ): Promise<NotificacaoResult> {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      select: { nome: true, telefone: true },
    });

    if (!produtor) {
      return { success: false, erro: 'Produtor não encontrado' };
    }

    const mensagem = `✅ *AgroTributos - NF-e Emitida*

Olá ${produtor.nome}!

Sua nota fiscal foi emitida com sucesso:

📄 *Número:* ${nota.numero}
📋 *Série:* ${nota.serie}
📌 *Tipo:* ${nota.tipo === 'saida' ? 'Saída' : 'Entrada'}
💰 *Valor:* R$ ${nota.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

🔑 *Chave de Acesso:*
${nota.chaveAcesso}

_Acesse o sistema para baixar o XML e DANFE._`;

    return this.enviarNotificacao(produtorId, mensagem);
  }

  /**
   * Busca e notifica todos os documentos atrasados de um produtor
   */
  async notificarTodosDocumentosAtrasados(produtorId: string): Promise<{
    total: number;
    enviados: number;
    erros: NotificacaoResult[];
  }> {
    // Busca obrigações fiscais vencidas (notificações não enviadas)
    const notificacoesPendentes = await this.prisma.notificacaoFiscal.findMany({
      where: {
        produtorId,
        enviado: false,
        dataVencimento: {
          lt: new Date(), // Vencidas
        },
      },
      include: {
        eventoFiscal: true,
      },
    });

    const resultados: NotificacaoResult[] = [];

    for (const notif of notificacoesPendentes) {
      const result = await this.notificarDocumentoAtrasado(produtorId, {
        tipo: notif.eventoFiscal.nome,
        dataVencimento: notif.dataVencimento,
        valor: notif.eventoFiscal.valor || undefined,
      });

      resultados.push(result);

      // Marca como enviada se sucesso
      if (result.success) {
        await this.prisma.notificacaoFiscal.update({
          where: { id: notif.id },
          data: {
            enviado: true,
            dataEnvio: new Date(),
            tentativasEnvio: { increment: 1 },
          },
        });
      } else {
        await this.prisma.notificacaoFiscal.update({
          where: { id: notif.id },
          data: {
            tentativasEnvio: { increment: 1 },
            ultimaTentativa: new Date(),
            erro: result.erro,
          },
        });
      }
    }

    return {
      total: notificacoesPendentes.length,
      enviados: resultados.filter((r) => r.success).length,
      erros: resultados.filter((r) => !r.success),
    };
  }

  /**
   * Busca e notifica próximas obrigações fiscais (próximos 7 dias)
   */
  async notificarProximasObrigacoes(produtorId: string): Promise<{
    total: number;
    enviados: number;
    obrigacoes: any[];
  }> {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);

    // Busca notificações para os próximos 7 dias que não foram enviadas
    const notificacoes = await this.prisma.notificacaoFiscal.findMany({
      where: {
        produtorId,
        enviado: false,
        dataVencimento: {
          gte: hoje,
          lte: seteDias,
        },
      },
      include: {
        eventoFiscal: true,
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    const resultados: NotificacaoResult[] = [];
    const obrigacoesNotificadas: any[] = [];

    for (const notif of notificacoes) {
      const diasRestantes = Math.ceil(
        (new Date(notif.dataVencimento).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );

      const result = await this.notificarObrigacaoFiscal(produtorId, {
        nome: notif.eventoFiscal.nome,
        descricao: notif.eventoFiscal.descricao,
        dataVencimento: notif.dataVencimento,
        diasRestantes,
        valor: notif.eventoFiscal.valor || undefined,
      });

      resultados.push(result);

      if (result.success) {
        obrigacoesNotificadas.push({
          nome: notif.eventoFiscal.nome,
          dataVencimento: notif.dataVencimento,
          diasRestantes,
        });

        await this.prisma.notificacaoFiscal.update({
          where: { id: notif.id },
          data: {
            enviado: true,
            dataEnvio: new Date(),
            tentativasEnvio: { increment: 1 },
          },
        });
      }
    }

    return {
      total: notificacoes.length,
      enviados: resultados.filter((r) => r.success).length,
      obrigacoes: obrigacoesNotificadas,
    };
  }

  /**
   * Envia mensagem personalizada para produtor
   */
  async enviarMensagemPersonalizada(
    produtorId: string,
    titulo: string,
    corpo: string,
  ): Promise<NotificacaoResult> {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      select: { nome: true, telefone: true },
    });

    if (!produtor) {
      return { success: false, erro: 'Produtor não encontrado' };
    }

    const mensagem = `📢 *AgroTributos - ${titulo}*

Olá ${produtor.nome}!

${corpo}

_Enviado pelo sistema AgroTributos_`;

    return this.enviarNotificacao(produtorId, mensagem);
  }
}
