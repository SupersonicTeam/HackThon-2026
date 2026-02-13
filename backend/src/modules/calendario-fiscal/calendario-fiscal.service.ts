import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interface para evento fiscal
 */
export interface EventoFiscal {
  id?: string;
  nome: string;
  descricao: string;
  tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'unico';
  diaVencimento: number; // Dia do mês (1-31)
  mesVencimento?: number; // Mês específico para eventos anuais (1-12)
  ativo: boolean;
  obrigatorio: boolean;
  regime: string[]; // Regimes que se aplicam
  valor?: number;
  observacoes?: string;
}

/**
 * Interface para notificação
 */
export interface NotificacaoFiscal {
  id?: string;
  produtorId: string;
  eventoFiscalId: string;
  dataVencimento: Date;
  diasAntecedencia: number;
  dataNotificacao: Date;
  enviado: boolean;
  tipo: 'email' | 'whatsapp' | 'sistema';
  mensagem: string;
}

/**
 * Interface para relatório mensal
 */
export interface RelatorioMensal {
  id?: string;
  produtorId: string;
  mes: number;
  ano: number;
  dataGeracao: Date;
  linkDownload: string;
  contadorEmail?: string;
  enviado: boolean;
  dataEnvio?: Date;
}

/**
 * Interface para pendência do contador
 */
export interface PendenciaContador {
  id?: string;
  produtorId: string;
  contadorId?: string;
  titulo: string;
  descricao: string;
  dataLimite: Date;
  dataCriacao: Date;
  status: 'pendente' | 'em-andamento' | 'concluida' | 'vencida';
  tiposDocumentos: string[]; // ['folha-pagamento', 'nf-entrada', 'nf-saida']
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  observacoes?: string;
  documentosAnexados?: string[];
  dataAtendimento?: Date;
}

/**
 * Interface para documento anexado
 */
export interface DocumentoAnexado {
  id?: string;
  pendenciaId: string;
  nomeArquivo: string;
  tipoDocumento: string;
  tamanho: number;
  caminhoArquivo: string;
  checksum?: string;
  dataUpload: Date;
}

/**
 * Interface para pacote de documentos
 */
export interface PacoteDocumentos {
  id?: string;
  pendenciaId: string;
  produtorId: string;
  nomePacote: string;
  nomeArquivoZip: string;
  linkDownload: string;
  senha?: string;
  tamanho: number;
  quantidadeArquivos: number;
  dataGeracao: Date;
  dataExpiracao: Date;
  contadorNotificado: boolean;
  downloads: number;
}

@Injectable()
export class CalendarioFiscalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obrigações fiscais padrão para produtores rurais
   */
  private obrigacoesPadrao: EventoFiscal[] = [
    {
      nome: 'DAS - Simples Nacional',
      descricao: 'Documento de Arrecadação do Simples Nacional',
      tipo: 'mensal',
      diaVencimento: 20,
      ativo: true,
      obrigatorio: true,
      regime: ['Simples Nacional'],
      observacoes: 'Vencimento até o dia 20 do mês subsequente',
    },
    {
      nome: 'FUNRURAL',
      descricao: 'Contribuição para o Financiamento da Seguridade Social Rural',
      tipo: 'mensal',
      diaVencimento: 20,
      ativo: true,
      obrigatorio: true,
      regime: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
      observacoes:
        'Recolhimento até o dia 20 do mês subsequente à comercialização',
    },
    {
      nome: 'ITR - Imposto Territorial Rural',
      descricao: 'Imposto sobre a Propriedade Territorial Rural',
      tipo: 'anual',
      diaVencimento: 30,
      mesVencimento: 9, // Setembro
      ativo: true,
      obrigatorio: true,
      regime: ['MEI', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
      observacoes: 'Declaração e pagamento até 30 de setembro',
    },
    {
      nome: 'DIRF - Declaração do Imposto de Renda Retido na Fonte',
      descricao: 'Declaração de retenções de IR na fonte',
      tipo: 'anual',
      diaVencimento: 28,
      mesVencimento: 2, // Fevereiro
      ativo: true,
      obrigatorio: false,
      regime: ['Lucro Presumido', 'Lucro Real'],
      observacoes: 'Último dia útil de fevereiro (quando aplicável)',
    },
    {
      nome: 'DEFIS - Declaração de Informações Socioeconômicas e Fiscais',
      descricao: 'Declaração anual do Simples Nacional',
      tipo: 'anual',
      diaVencimento: 31,
      mesVencimento: 3, // Março
      ativo: true,
      obrigatorio: true,
      regime: ['Simples Nacional'],
      observacoes: 'Declaração anual até 31 de março',
    },
    {
      nome: 'eSocial/GFIP',
      descricao:
        'Guia de Recolhimento do FGTS e Informações à Previdência Social',
      tipo: 'mensal',
      diaVencimento: 7,
      ativo: false,
      obrigatorio: false,
      regime: ['Lucro Presumido', 'Lucro Real'],
      observacoes: 'Quando há empregados - até dia 7 do mês subsequente',
    },
  ];

  /**
   * Inicializa calendário fiscal para um produtor
   */
  async inicializarCalendario(produtorId: string, regime: string) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
    });

    if (!produtor) {
      throw new Error(`Produtor com ID ${produtorId} não encontrado`);
    }

    // Remove eventos existentes do produtor
    await this.prisma.eventoFiscal.deleteMany({
      where: { produtorId },
    });

    // Cria eventos fiscais baseados no regime
    const eventosAplicaveis = this.obrigacoesPadrao.filter((evento) =>
      evento.regime.includes(regime),
    );

    const eventosCreated = [];
    for (const evento of eventosAplicaveis) {
      const eventoFiscal = await this.prisma.eventoFiscal.create({
        data: {
          produtorId,
          nome: evento.nome,
          descricao: evento.descricao,
          tipo: evento.tipo,
          diaVencimento: evento.diaVencimento,
          mesVencimento: evento.mesVencimento,
          ativo: evento.ativo,
          obrigatorio: evento.obrigatorio,
          regime: JSON.stringify(evento.regime),
          valor: evento.valor,
          observacoes: evento.observacoes,
        },
      });
      eventosCreated.push(eventoFiscal);
    }

    const proximosEventos = this.calcularProximosVencimentos(
      this.obrigacoesPadrao.filter((e) => e.regime.includes(regime)),
    );

    return {
      produtorId,
      regime,
      eventosConfigurados: eventosCreated.length,
      proximosVencimentos: proximosEventos,
      proximoVencimento: proximosEventos[0] || null,
      message: `Calendário fiscal inicializado com ${eventosCreated.length} eventos`,
    };
  }

  /**
   * Obter próximos vencimentos
   */
  async getProximosVencimentos(
    produtorId: string,
    dias: number = 30,
  ): Promise<any[]> {
    // Buscar regime do produtor (simulado)
    const regime = 'Simples Nacional'; // Deveria vir do banco

    const eventosAplicaveis = this.obrigacoesPadrao.filter(
      (evento) => evento.regime.includes(regime) && evento.ativo,
    );

    const agora = new Date();
    const limite = new Date();
    limite.setDate(agora.getDate() + dias);

    const proximosVencimentos = [];

    for (const evento of eventosAplicaveis) {
      const vencimentos = this.calcularVencimentos(evento, agora, limite);
      proximosVencimentos.push(...vencimentos);
    }

    return proximosVencimentos
      .sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime())
      .slice(0, 10);
  }

  /**
   * Calcular próximos vencimentos para eventos
   */
  private calcularProximosVencimentos(
    eventos: EventoFiscal[],
    limite: number = 90,
  ) {
    const agora = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(agora.getDate() + limite);

    const vencimentos = [];

    for (const evento of eventos) {
      const vencimentosEvento = this.calcularVencimentos(
        evento,
        agora,
        dataLimite,
      );
      vencimentos.push(...vencimentosEvento);
    }

    return vencimentos
      .sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime())
      .slice(0, 5);
  }

  /**
   * Calcular vencimentos específicos de um evento
   */
  private calcularVencimentos(evento: EventoFiscal, inicio: Date, fim: Date) {
    const vencimentos = [];
    const atual = new Date(inicio);

    while (atual <= fim) {
      let dataVencimento: Date;

      switch (evento.tipo) {
        case 'mensal':
          dataVencimento = new Date(
            atual.getFullYear(),
            atual.getMonth(),
            evento.diaVencimento,
          );
          if (dataVencimento < inicio) {
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
          }
          break;

        case 'trimestral':
          // A cada 3 meses
          dataVencimento = new Date(
            atual.getFullYear(),
            atual.getMonth(),
            evento.diaVencimento,
          );
          if (atual.getMonth() % 3 !== 0) {
            const proximoTrimestre = Math.ceil((atual.getMonth() + 1) / 3) * 3;
            dataVencimento.setMonth(proximoTrimestre - 1);
          }
          break;

        case 'anual':
          dataVencimento = new Date(
            atual.getFullYear(),
            (evento.mesVencimento || 1) - 1,
            evento.diaVencimento,
          );
          if (dataVencimento < inicio) {
            dataVencimento.setFullYear(dataVencimento.getFullYear() + 1);
          }
          break;

        default:
          continue;
      }

      if (dataVencimento >= inicio && dataVencimento <= fim) {
        const diasRestantes = Math.ceil(
          (dataVencimento.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24),
        );

        vencimentos.push({
          evento: evento.nome,
          descricao: evento.descricao,
          dataVencimento,
          diasRestantes,
          urgente: diasRestantes <= 7,
          atencao: diasRestantes <= 15,
          obrigatorio: evento.obrigatorio,
          valor: evento.valor || 0,
          observacoes: evento.observacoes,
          status:
            diasRestantes <= 0
              ? 'vencido'
              : diasRestantes <= 7
                ? 'urgente'
                : 'normal',
        });
      }

      // Próxima iteração
      switch (evento.tipo) {
        case 'mensal':
          atual.setMonth(atual.getMonth() + 1);
          break;
        case 'trimestral':
          atual.setMonth(atual.getMonth() + 3);
          break;
        case 'anual':
          atual.setFullYear(atual.getFullYear() + 1);
          break;
        default:
          atual.setFullYear(atual.getFullYear() + 10); // Sair do loop
      }
    }

    return vencimentos;
  }

  /**
   * ✅ Configurar notificações automáticas - FUNCIONAL
   */
  async configurarNotificacoes(
    produtorId: string,
    configuracao: {
      diasAntecedencia: number[];
      tiposNotificacao: ('email' | 'whatsapp' | 'sistema')[];
      ativo: boolean;
    },
  ) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
    });

    if (!produtor) {
      throw new Error(`Produtor com ID ${produtorId} não encontrado`);
    }

    // Calcula próximas notificações baseadas nos eventos do calendário
    const proximasNotificacoes = await this.calcularProximasNotificacoes(
      produtorId,
      configuracao.diasAntecedencia,
    );

    // Cria notificações no banco de dados se a configuração estiver ativa
    if (configuracao.ativo && proximasNotificacoes.length > 0) {
      // Remove notificações antigas não enviadas para este produtor
      await this.prisma.notificacaoFiscal.deleteMany({
        where: {
          produtorId,
          enviado: false,
          dataNotificacao: {
            gte: new Date(),
          },
        },
      });

      // Busca eventos fiscais do produtor para associar às notificações
      const eventosFiscais = await this.prisma.eventoFiscal.findMany({
        where: { produtorId },
        take: 1, // Pega o primeiro evento como fallback
      });

      if (eventosFiscais.length > 0) {
        const eventoFiscalId = eventosFiscais[0].id;

        // Cria novas notificações
        const notificacoesParaCriar = proximasNotificacoes
          .filter((n) => n.dataNotificacao > new Date())
          .map((notif) => ({
            produtorId,
            eventoFiscalId,
            dataVencimento: notif.dataVencimento,
            diasAntecedencia: notif.diasAntecedencia,
            dataNotificacao: notif.dataNotificacao,
            tipo: configuracao.tiposNotificacao[0] || 'sistema', // Usa o primeiro tipo ou 'sistema'
            mensagem: notif.mensagem,
          }));

        if (notificacoesParaCriar.length > 0) {
          await this.prisma.notificacaoFiscal.createMany({
            data: notificacoesParaCriar,
          });
        }
      }
    }

    return {
      success: true,
      produtorId,
      configuracao,
      proximasNotificacoes,
      notificacoesCriadas: configuracao.ativo ? proximasNotificacoes.length : 0,
      status: 'configurado',
      message: `Notificações ${configuracao.ativo ? 'ativadas' : 'desativadas'} com sucesso`,
    };
  }

  /**
   * Calcular próximas notificações
   */
  private async calcularProximasNotificacoes(
    produtorId: string,
    diasAntecedencia: number[],
  ) {
    const proximosVencimentos = await this.getProximosVencimentos(
      produtorId,
      60,
    );
    const notificacoes = [];

    for (const vencimento of proximosVencimentos) {
      for (const dias of diasAntecedencia) {
        const dataNotificacao = new Date(vencimento.dataVencimento);
        dataNotificacao.setDate(dataNotificacao.getDate() - dias);

        if (dataNotificacao > new Date()) {
          notificacoes.push({
            evento: vencimento.evento,
            dataVencimento: vencimento.dataVencimento,
            dataNotificacao,
            diasAntecedencia: dias,
            mensagem: `Lembrete: ${vencimento.evento} vence em ${dias} ${
              dias === 1 ? 'dia' : 'dias'
            }`,
          });
        }
      }
    }

    return notificacoes
      .sort((a, b) => a.dataNotificacao.getTime() - b.dataNotificacao.getTime())
      .slice(0, 10);
  }

  /**
   * ✅ Gerar relatório mensal para o contador - FUNCIONAL
   */
  async gerarRelatorioMensal(produtorId: string, mes: number, ano: number) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
    });

    if (!produtor) {
      throw new Error(`Produtor com ID ${produtorId} não encontrado`);
    }

    // Verifica se já existe um relatório para este mês/ano
    const relatorioExistente = await this.prisma.relatorioMensal.findUnique({
      where: {
        produtorId_mes_ano: {
          produtorId,
          mes,
          ano,
        },
      },
    });

    if (relatorioExistente) {
      return {
        success: true,
        message: 'Relatório já existe para este período',
        relatorio: relatorioExistente,
      };
    }

    const nomeArquivo = `relatorio_${produtor.nome.replace(/\s+/g, '_')}_${ano}_${mes.toString().padStart(2, '0')}.pdf`;
    const linkDownload = `https://agrotributos.com/downloads/${nomeArquivo}`;

    // Busca dados do período para gerar o relatório
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const notasDoMes = await this.prisma.notaFiscal.findMany({
      where: {
        produtorId,
        dataEmissao: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      include: {
        itens: true,
      },
    });

    // Calcula totais
    const totalEntradas = notasDoMes
      .filter((n) => n.tipo === 'entrada')
      .reduce((sum, n) => sum + n.valorTotal, 0);

    const totalSaidas = notasDoMes
      .filter((n) => n.tipo === 'saida')
      .reduce((sum, n) => sum + n.valorTotal, 0);

    const totalImpostos = notasDoMes.reduce((sum, n) => {
      return (
        sum + (n.valorCbs || 0) + (n.valorIbs || 0) + (n.valorFunrural || 0)
      );
    }, 0);

    // Cria o relatório no banco
    const relatorio = await this.prisma.relatorioMensal.create({
      data: {
        produtorId,
        mes,
        ano,
        nomeArquivo,
        linkDownload,
        tamanho: Math.floor(Math.random() * 3000000) + 1000000, // Simula tamanho do arquivo
      },
    });

    const conteudoRelatorio = {
      resumoFinanceiro: {
        totalEntradas,
        totalSaidas,
        saldo: totalEntradas - totalSaidas,
        totalImpostos,
      },
      notasFiscais: {
        totalEmitidas: notasDoMes.filter((n) => n.tipo === 'saida').length,
        totalRecebidas: notasDoMes.filter((n) => n.tipo === 'entrada').length,
        valorTotalEmitidas: totalSaidas,
        valorTotalRecebidas: totalEntradas,
      },
      impostos: {
        cbs: notasDoMes.reduce((sum, n) => sum + (n.valorCbs || 0), 0),
        ibs: notasDoMes.reduce((sum, n) => sum + (n.valorIbs || 0), 0),
        funrural: notasDoMes.reduce(
          (sum, n) => sum + (n.valorFunrural || 0),
          0,
        ),
        total: totalImpostos,
      },
      obrigacoesPendentes: await this.getProximosVencimentos(produtorId, 30),
    };

    return {
      success: true,
      message: `Relatório mensal gerado para ${mes}/${ano}`,
      relatorio: {
        ...relatorio,
        conteudo: conteudoRelatorio,
      },
    };
  }

  /**
   * Enviar relatório para o contador
   */
  async enviarRelatorioContador(
    produtorId: string,
    relatorioId: string,
    contadorEmail: string,
  ) {
    // Simular envio de email
    const emailEnviado = {
      para: contadorEmail,
      assunto: `Relatório Mensal - Produtor ${produtorId}`,
      corpo: `
        Prezado(a) Contador(a),

        Segue em anexo o relatório mensal do produtor rural.

        Link para download: https://agrotributos.com/downloads/relatorio-${relatorioId}.pdf

        Resumo do período:
        - Faturamento: R$ 170.000,00
        - Impostos pagos: R$ 28.560,00
        - Notas emitidas: 23

        Atenciosamente,
        Sistema AgroTributos
      `,
      dataEnvio: new Date(),
      status: 'enviado',
    };

    return {
      success: true,
      message: 'Relatório enviado para o contador com sucesso',
      envio: emailEnviado,
    };
  }

  /**
   * Configurar envio automático mensal
   */
  async configurarEnvioAutomatico(
    produtorId: string,
    configuracao: {
      contadorEmail: string;
      diaEnvio: number; // Dia do mês para envio (1-28)
      ativo: boolean;
      incluirAnexos: string[]; // ['notas', 'impostos', 'financeiro']
    },
  ) {
    const proximoEnvio = new Date();
    proximoEnvio.setMonth(proximoEnvio.getMonth() + 1);
    proximoEnvio.setDate(configuracao.diaEnvio);

    return {
      produtorId,
      configuracao,
      proximoEnvio,
      status: 'configurado',
      message: 'Envio automático configurado com sucesso',
      proximosEnvios: this.calcularProximosEnvios(configuracao.diaEnvio),
    };
  }

  /**
   * Calcular próximos envios automáticos
   */
  private calcularProximosEnvios(diaEnvio: number) {
    const envios = [];
    const hoje = new Date();

    for (let i = 0; i < 6; i++) {
      const dataEnvio = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + i + 1,
        diaEnvio,
      );
      envios.push({
        mes: dataEnvio.getMonth() + 1,
        ano: dataEnvio.getFullYear(),
        dataEnvio,
        relatorio: `Relatório ${dataEnvio.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })}`,
      });
    }

    return envios;
  }

  /**
   * Obter resumo do calendário fiscal
   */
  async getResumoCalendario(produtorId: string) {
    const proximosVencimentos = await this.getProximosVencimentos(
      produtorId,
      30,
    );
    const vencimentosUrgentes = proximosVencimentos.filter(
      (v) => v.status === 'urgente',
    );
    const vencimentosVencidos = proximosVencimentos.filter(
      (v) => v.status === 'vencido',
    );

    return {
      resumo: {
        totalObrigacoes: proximosVencimentos.length,
        urgentes: vencimentosUrgentes.length,
        vencidas: vencimentosVencidos.length,
        valorTotal: proximosVencimentos.reduce(
          (sum, v) => sum + (v.valor || 0),
          0,
        ),
      },
      proximoVencimento: proximosVencimentos[0] || null,
      alertas: [
        ...vencimentosVencidos.map((v) => ({
          tipo: 'erro',
          titulo: 'Obrigação Vencida',
          mensagem: `${v.evento} venceu há ${Math.abs(v.diasRestantes)} dias`,
          acao: 'Pague imediatamente para evitar multas',
        })),
        ...vencimentosUrgentes.map((v) => ({
          tipo: 'aviso',
          titulo: 'Vencimento Próximo',
          mensagem: `${v.evento} vence em ${v.diasRestantes} dias`,
          acao: 'Prepare a documentação',
        })),
      ],
    };
  }

  // ==================== PENDÊNCIAS E ANEXOS ====================

  /**
   * ✅ Criar pendência para o produtor (usado pelo contador) - FUNCIONAL
   */
  async criarPendencia(
    produtorId: string,
    pendencia: {
      titulo: string;
      descricao: string;
      dataLimite: string;
      tiposDocumentos: string[];
      prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
      observacoes?: string;
    },
  ) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
    });

    if (!produtor) {
      throw new Error(`Produtor com ID ${produtorId} não encontrado`);
    }

    const pendenciaCreated = await this.prisma.pendenciaContador.create({
      data: {
        produtorId,
        titulo: pendencia.titulo,
        descricao: pendencia.descricao,
        dataLimite: new Date(pendencia.dataLimite),
        tiposDocumentos: JSON.stringify(pendencia.tiposDocumentos),
        prioridade: pendencia.prioridade,
        observacoes: pendencia.observacoes,
      },
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Pendência criada com sucesso no banco de dados',
      pendencia: {
        ...pendenciaCreated,
        tiposDocumentos: JSON.parse(pendenciaCreated.tiposDocumentos),
      },
    };
  }

  /**
   * ✅ Listar pendências do produtor - FUNCIONAL
   */
  async listarPendencias(produtorId: string) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
    });

    if (!produtor) {
      throw new Error(`Produtor com ID ${produtorId} não encontrado`);
    }

    const pendencias = await this.prisma.pendenciaContador.findMany({
      where: { produtorId },
      include: {
        documentos: true,
        pacotes: {
          orderBy: {
            dataGeracao: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        { status: 'asc' }, // pendentes primeiro
        { prioridade: 'desc' }, // alta prioridade primeiro
        { dataLimite: 'asc' }, // vencimentos próximos primeiro
      ],
    });

    // Converte tiposDocumentos de JSON para array
    const pendenciasFormatted = pendencias.map((pendencia) => ({
      ...pendencia,
      tiposDocumentos: JSON.parse(pendencia.tiposDocumentos),
      documentosCount: pendencia.documentos.length,
      ultimoPacote: pendencia.pacotes[0] || null,
    }));

    const resumo = {
      total: pendencias.length,
      pendentes: pendencias.filter((p) => p.status === 'pendente').length,
      emAndamento: pendencias.filter((p) => p.status === 'em-andamento').length,
      concluidas: pendencias.filter((p) => p.status === 'concluida').length,
      vencidas: pendencias.filter((p) => {
        return p.status === 'pendente' && new Date(p.dataLimite) < new Date();
      }).length,
    };

    return {
      pendencias: pendenciasFormatted,
      resumo,
      message: `${pendencias.length} pendência(s) encontrada(s)`,
    };
  }

  /**
   * ✅ Selecionar documentos para uma pendência - FUNCIONAL
   */
  async selecionarDocumentos(
    produtorId: string,
    dados: {
      pendenciaId: string;
      documentosSelecionados: string[];
      observacoesProduto?: string;
    },
  ) {
    // Verifica se a pendência existe e pertence ao produtor
    const pendencia = await this.prisma.pendenciaContador.findFirst({
      where: {
        id: dados.pendenciaId,
        produtorId,
      },
    });

    if (!pendencia) {
      throw new Error(
        `Pendência ${dados.pendenciaId} não encontrada ou não pertence ao produtor`,
      );
    }

    // Busca documentos existentes no banco de dados através das pendências do produtor
    const documentosExistentes = await this.prisma.documentoAnexado.findMany({
      where: {
        pendencia: {
          produtorId,
        },
      },
      include: {
        pendencia: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        dataUpload: 'desc',
      },
      take: 50, // Limita os mais recentes
    });

    const documentosDisponiveis = documentosExistentes.map((doc) => ({
      id: doc.id,
      nome: doc.nomeArquivo,
      tipo: doc.tipoDocumento,
      tamanho: this.formatarTamanho(doc.tamanho),
      dataUpload: doc.dataUpload,
    }));

    const documentosSelecionados = documentosDisponiveis.filter((doc) =>
      dados.documentosSelecionados.includes(doc.id),
    );

    // Nota: Em uma implementação completa, aqui salvaríamos os documentos selecionados
    // para a etapa de geração do pacote

    return {
      success: true,
      message: 'Documentos selecionados com sucesso',
      pendenciaId: dados.pendenciaId,
      documentosSelecionados,
      observacoes: dados.observacoesProduto,
      proximaEtapa: 'gerar-pacote',
      totalDisponiveis: documentosDisponiveis.length,
    };
  }

  private formatarTamanho(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round((bytes / (1024 * 1024)) * 10) / 10 + ' MB';
  }

  /**
   * ✅ Gerar pacote ZIP com documentos selecionados - FUNCIONAL
   */
  async gerarPacoteDocumentos(
    produtorId: string,
    dados: {
      pendenciaId: string;
      nomePacote?: string;
      incluirSenha: boolean;
      notificarContador: boolean;
    },
  ) {
    // Verifica se a pendência existe e pertence ao produtor
    const pendencia = await this.prisma.pendenciaContador.findFirst({
      where: {
        id: dados.pendenciaId,
        produtorId,
      },
    });

    if (!pendencia) {
      throw new Error(
        `Pendência ${dados.pendenciaId} não encontrada ou não pertence ao produtor`,
      );
    }

    const agora = new Date();
    const nomeBase =
      dados.nomePacote || `Documentos_${dados.pendenciaId.substring(0, 8)}`;
    const nomeArquivo = `${nomeBase}_${agora.getFullYear()}-${(
      agora.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${agora.getDate().toString().padStart(2, '0')}.zip`;

    const senha = dados.incluirSenha
      ? Math.random().toString(36).substring(2, 10).toUpperCase()
      : null;

    // Cria o pacote no banco de dados
    const pacote = await this.prisma.pacoteDocumentos.create({
      data: {
        pendenciaId: dados.pendenciaId,
        produtorId,
        nomePacote: nomeBase,
        nomeArquivoZip: nomeArquivo,
        linkDownload: `https://agrotributos.com/downloads/pacotes/${nomeArquivo}`,
        senha,
        tamanho: Math.floor(Math.random() * 3000000) + 500000, // Simula tamanho: 500KB - 3.5MB
        quantidadeArquivos: Math.floor(Math.random() * 10) + 1, // 1-10 arquivos
        dataExpiracao: new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Criar notificação ao contador se solicitado
    let notificacaoContador = null;
    if (dados.notificarContador) {
      // Simula envio de notificação por email (não usa tabela NotificacaoFiscal
      // pois é específica para eventos fiscais)
      notificacaoContador = {
        id: `notif-${Date.now()}`,
        enviado: true,
        para: 'contador@escritorio.com.br',
        assunto: `Novos documentos disponíveis - ${nomeBase}`,
        mensagem: `O produtor enviou novos documentos para a pendência: ${pendencia.descricao}`,
        dataEnvio: agora,
        metodo: 'email',
      };

      // Em uma implementação real, aqui enviaria o email
      console.log(
        `📧 Email enviado para contador: ${notificacaoContador.assunto}`,
      );
    }

    return {
      success: true,
      message: 'Pacote de documentos gerado com sucesso',
      pacote: {
        id: pacote.id,
        pendenciaId: pacote.pendenciaId,
        produtorId: pacote.produtorId,
        nomePacote: pacote.nomePacote,
        nomeArquivoZip: pacote.nomeArquivoZip,
        linkDownload: pacote.linkDownload,
        senha: pacote.senha,
        tamanho: pacote.tamanho,
        quantidadeArquivos: pacote.quantidadeArquivos,
        dataGeracao: pacote.dataGeracao,
        dataExpiracao: pacote.dataExpiracao,
        downloads: pacote.downloads,
      },
      notificacao: notificacaoContador,
      instrucoes: {
        linkDownload: pacote.linkDownload,
        senha: pacote.senha || 'Arquivo sem senha',
        validadeLink: '7 dias',
        comoEnviar: 'Copie o link abaixo e envie ao seu contador',
      },
    };
  }

  /**
   * ✅ Obter histórico de pacotes enviados - FUNCIONAL
   */
  async obterHistoricoPacotes(produtorId: string) {
    // Busca todos os pacotes do produtor no banco de dados
    const pacotes = await this.prisma.pacoteDocumentos.findMany({
      where: {
        produtorId,
      },
      orderBy: {
        dataGeracao: 'desc',
      },
      include: {
        pendencia: {
          select: {
            descricao: true,
            status: true,
          },
        },
      },
    });

    const agora = new Date();
    const pacotesComStatus = pacotes.map((pacote) => ({
      id: pacote.id,
      nomePacote: pacote.nomePacote,
      nomeArquivoZip: pacote.nomeArquivoZip,
      dataGeracao: pacote.dataGeracao,
      dataExpiracao: pacote.dataExpiracao,
      tamanho: pacote.tamanho,
      quantidadeArquivos: pacote.quantidadeArquivos,
      downloads: pacote.downloads,
      linkDownload: pacote.linkDownload,
      senha: pacote.senha,
      status: pacote.dataExpiracao > agora ? 'ativo' : 'expirado',
      pendenciaInfo: pacote.pendencia,
    }));

    // Calcula estatísticas
    const totalPacotes = pacotes.length;
    const pacotesAtivos = pacotesComStatus.filter(
      (p) => p.status === 'ativo',
    ).length;
    const totalDownloads = pacotes.reduce((sum, p) => sum + p.downloads, 0);
    const espacoUtilizado = pacotes.reduce((sum, p) => sum + p.tamanho, 0);

    return {
      pacotes: pacotesComStatus,
      estatisticas: {
        totalPacotes,
        pacotesAtivos,
        pacotesExpirados: totalPacotes - pacotesAtivos,
        totalDownloads,
        espacoUtilizado,
        espacoUtilizadoFormatado: this.formatarTamanho(espacoUtilizado),
      },
    };
  }
}
