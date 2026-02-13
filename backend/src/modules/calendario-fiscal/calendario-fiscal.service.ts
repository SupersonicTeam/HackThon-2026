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
    const eventosAplicaveis = this.obrigacoesPadrao.filter((evento) =>
      evento.regime.includes(regime),
    );

    const proximosEventos = this.calcularProximosVencimentos(eventosAplicaveis);

    return {
      produtorId,
      regime,
      eventosConfigurados: eventosAplicaveis.length,
      proximosVencimentos: proximosEventos,
      proximoVencimento: proximosEventos[0] || null,
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
   * Configurar notificações automáticas
   */
  async configurarNotificacoes(
    produtorId: string,
    configuracao: {
      diasAntecedencia: number[];
      tiposNotificacao: ('email' | 'whatsapp' | 'sistema')[];
      ativo: boolean;
    },
  ) {
    return {
      produtorId,
      configuracao,
      proximasNotificacoes: await this.calcularProximasNotificacoes(
        produtorId,
        configuracao.diasAntecedencia,
      ),
      status: 'configurado',
      message: 'Notificações configuradas com sucesso',
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
   * Gerar relatório mensal para o contador
   */
  async gerarRelatorioMensal(produtorId: string, mes: number, ano: number) {
    const agora = new Date();
    const nomeArquivo = `relatorio-${produtorId}-${ano}-${mes.toString().padStart(2, '0')}.pdf`;

    // Simular geração de relatório
    const relatorio = {
      id: `rel-${Date.now()}`,
      produtorId,
      mes,
      ano,
      dataGeracao: agora,
      nomeArquivo,
      linkDownload: `https://agrotributos.com/downloads/${nomeArquivo}`,
      tamanho: '2.3 MB',
      conteudo: {
        resumoFinanceiro: {
          totalEntradas: 150000,
          totalSaidas: 320000,
          saldo: 170000,
          totalImpostos: 28560,
        },
        notasFiscais: {
          totalEmitidas: 23,
          totalRecebidas: 15,
          valorTotalEmitidas: 320000,
          valorTotalRecebidas: 150000,
        },
        impostos: {
          cbs: 19200,
          ibs: 5120,
          funrural: 4240,
          total: 28560,
        },
        obrigacoesPendentes: await this.getProximosVencimentos(produtorId, 30),
      },
    };

    return {
      success: true,
      message: 'Relatório mensal gerado com sucesso',
      relatorio,
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
   * Criar pendência para o produtor (usado pelo contador)
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
    const novaPendencia: PendenciaContador = {
      id: `pend-${Date.now()}`,
      produtorId,
      titulo: pendencia.titulo,
      descricao: pendencia.descricao,
      dataLimite: new Date(pendencia.dataLimite),
      dataCriacao: new Date(),
      status: 'pendente',
      tiposDocumentos: pendencia.tiposDocumentos,
      prioridade: pendencia.prioridade,
      observacoes: pendencia.observacoes,
      documentosAnexados: [],
    };

    return {
      success: true,
      message: 'Pendência criada com sucesso',
      pendencia: novaPendencia,
    };
  }

  /**
   * Listar pendências do produtor
   */
  async listarPendencias(produtorId: string) {
    // Simulando pendências do banco
    const pendencias: PendenciaContador[] = [
      {
        id: 'pend-001',
        produtorId,
        titulo: 'Anexar folhas de pagamento e notas fiscais',
        descricao:
          'Enviar folhas de pagamento de janeiro/2026 e todas as notas fiscais de entrada e saída',
        dataLimite: new Date('2026-02-21'),
        dataCriacao: new Date('2026-02-10'),
        status: 'pendente',
        tiposDocumentos: ['folha-pagamento', 'nf-entrada', 'nf-saida'],
        prioridade: 'alta',
        observacoes: 'Urgente para fechamento mensal',
        documentosAnexados: [],
      },
      {
        id: 'pend-002',
        produtorId,
        titulo: 'Comprovantes de impostos pagos',
        descricao: 'Anexar comprovantes de DAS e FUNRURAL de janeiro/2026',
        dataLimite: new Date('2026-02-25'),
        dataCriacao: new Date('2026-02-12'),
        status: 'pendente',
        tiposDocumentos: ['comprovante-pagamento'],
        prioridade: 'media',
        documentosAnexados: [],
      },
    ];

    const agora = new Date();
    const pendenciasComStatus = pendencias.map((p) => ({
      ...p,
      diasRestantes: Math.ceil(
        (p.dataLimite.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
      ),
      vencida: p.dataLimite < agora,
      urgente:
        Math.ceil(
          (p.dataLimite.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
        ) <= 3,
    }));

    return {
      pendencias: pendenciasComStatus,
      resumo: {
        total: pendencias.length,
        pendentes: pendencias.filter((p) => p.status === 'pendente').length,
        vencidas: pendenciasComStatus.filter((p) => p.vencida).length,
        urgentes: pendenciasComStatus.filter((p) => p.urgente).length,
      },
    };
  }

  /**
   * Selecionar documentos para uma pendência
   */
  async selecionarDocumentos(
    produtorId: string,
    dados: {
      pendenciaId: string;
      documentosSelecionados: string[];
      observacoesProduto?: string;
    },
  ) {
    // Simular documentos disponíveis
    const documentosDisponiveis = [
      {
        id: 'doc-001',
        nome: 'Folha_Pagamento_Janeiro_2026.pdf',
        tipo: 'folha-pagamento',
        tamanho: '245 KB',
      },
      {
        id: 'doc-002',
        nome: 'NF_Entrada_001_Janeiro.pdf',
        tipo: 'nf-entrada',
        tamanho: '186 KB',
      },
      {
        id: 'doc-003',
        nome: 'NF_Saida_045_Janeiro.pdf',
        tipo: 'nf-saida',
        tamanho: '198 KB',
      },
    ];

    const documentosSelecionados = documentosDisponiveis.filter((doc) =>
      dados.documentosSelecionados.includes(doc.id),
    );

    return {
      success: true,
      message: 'Documentos selecionados com sucesso',
      pendenciaId: dados.pendenciaId,
      documentosSelecionados,
      observacoes: dados.observacoesProduto,
      proximaEtapa: 'gerar-pacote',
    };
  }

  /**
   * Gerar pacote ZIP com documentos selecionados
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
    const agora = new Date();
    const nomeBase = dados.nomePacote || `Documentos_${dados.pendenciaId}`;
    const nomeArquivo = `${nomeBase}_${agora.getFullYear()}-${(
      agora.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${agora.getDate().toString().padStart(2, '0')}.zip`;

    const senha = dados.incluirSenha
      ? Math.random().toString(36).substring(2, 10).toUpperCase()
      : undefined;

    const pacote: PacoteDocumentos = {
      id: `pack-${Date.now()}`,
      pendenciaId: dados.pendenciaId,
      produtorId,
      nomePacote: nomeBase,
      nomeArquivoZip: nomeArquivo,
      linkDownload: `https://agrotributos.com/downloads/pacotes/${nomeArquivo}`,
      senha,
      tamanho: 1245760, // Simulado: ~1.2MB
      quantidadeArquivos: 3,
      dataGeracao: agora,
      dataExpiracao: new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      contadorNotificado: false,
      downloads: 0,
    };

    // Simular notificação ao contador se solicitado
    let notificacaoContador = null;
    if (dados.notificarContador) {
      notificacaoContador = {
        enviado: true,
        para: 'contador@escritorio.com.br',
        assunto: `Novos documentos disponíveis - ${nomeBase}`,
        mensagem: `O produtor ${produtorId} enviou novos documentos para a pendência: ${dados.pendenciaId}`,
        dataEnvio: agora,
      };
    }

    return {
      success: true,
      message: 'Pacote de documentos gerado com sucesso',
      pacote,
      notificacao: notificacaoContador,
      instrucoes: {
        linkDownload: pacote.linkDownload,
        senha: senha || 'Arquivo sem senha',
        validadeLink: '7 dias',
        comoEnviar: 'Copie o link abaixo e envie ao seu contador',
      },
    };
  }

  /**
   * Obter histórico de pacotes enviados
   */
  async obterHistoricoPacotes(produtorId: string) {
    // Simulando histórico
    const pacotes = [
      {
        id: 'pack-001',
        nomePacote: 'Documentos_Janeiro_2026',
        nomeArquivoZip: 'Documentos_Janeiro_2026_2026-02-13.zip',
        dataGeracao: new Date('2026-02-13'),
        dataExpiracao: new Date('2026-02-20'),
        tamanho: 1245760,
        quantidadeArquivos: 3,
        downloads: 2,
        status: 'ativo',
      },
      {
        id: 'pack-002',
        nomePacote: 'Comprovantes_Pagamento_Jan2026',
        nomeArquivoZip: 'Comprovantes_Pagamento_Jan2026_2026-02-10.zip',
        dataGeracao: new Date('2026-02-10'),
        dataExpiracao: new Date('2026-02-17'),
        tamanho: 856320,
        quantidadeArquivos: 2,
        downloads: 1,
        status: 'expirado',
      },
    ];

    return {
      pacotes,
      estatisticas: {
        totalPacotes: pacotes.length,
        pacotesAtivos: pacotes.filter((p) => p.status === 'ativo').length,
        totalDownloads: pacotes.reduce((sum, p) => sum + p.downloads, 0),
        espacoUtilizado: pacotes.reduce((sum, p) => sum + p.tamanho, 0),
      },
    };
  }
}
