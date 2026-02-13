import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardQueryDto,
  DashboardResumoDto,
  FluxoCaixaDto,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getResumo(
    produtorId: string,
    query?: DashboardQueryDto,
  ): Promise<DashboardResumoDto> {
    const [fluxoCaixa, notasPendentes, produtosPrincipais, impostosPorTipo] =
      await Promise.all([
        this.getFluxoCaixa(produtorId, query),
        this.getNotasPendentes(produtorId),
        this.getProdutosPrincipais(produtorId, query),
        this.getImpostosPorTipo(produtorId, query),
      ]);

    return {
      fluxoCaixa,
      notasPendentes,
      produtosPrincipais,
      impostosPorTipo,
    };
  }

  async getFluxoCaixa(
    produtorId: string,
    query?: DashboardQueryDto,
  ): Promise<FluxoCaixaDto> {
    const where: any = { produtorId };

    // Filtro de período
    if (query) {
      const dateFilter: any = {};

      if (query.dataInicio) {
        dateFilter.gte = new Date(query.dataInicio);
      }

      if (query.dataFim) {
        dateFilter.lte = new Date(query.dataFim);
      }

      if (query.ano && query.mes) {
        const startDate = new Date(query.ano, query.mes - 1, 1);
        const endDate = new Date(query.ano, query.mes, 0, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      } else if (query.ano) {
        const startDate = new Date(query.ano, 0, 1);
        const endDate = new Date(query.ano, 11, 31, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      }

      if (Object.keys(dateFilter).length > 0) {
        where.dataEmissao = dateFilter;
      }
    }

    // Agregações
    const [entradas, saidas, qtdEntradas, qtdSaidas] = await Promise.all([
      this.prisma.notaFiscal.aggregate({
        where: { ...where, tipo: 'entrada' },
        _sum: { valorTotal: true },
      }),
      this.prisma.notaFiscal.aggregate({
        where: { ...where, tipo: 'saida' },
        _sum: {
          valorTotal: true,
          valorCbs: true,
          valorIbs: true,
          valorFunrural: true,
        },
      }),
      this.prisma.notaFiscal.count({
        where: { ...where, tipo: 'entrada' },
      }),
      this.prisma.notaFiscal.count({
        where: { ...where, tipo: 'saida' },
      }),
    ]);

    const totalEntradas = entradas._sum.valorTotal || 0;
    const totalSaidas = saidas._sum.valorTotal || 0;
    const totalImpostos =
      (saidas._sum.valorCbs || 0) +
      (saidas._sum.valorIbs || 0) +
      (saidas._sum.valorFunrural || 0);
    const saldo = totalSaidas - totalEntradas;
    const lucroEstimado = saldo - totalImpostos;

    return {
      totalEntradas,
      totalSaidas,
      saldo,
      totalImpostos,
      lucroEstimado,
      qtdNotasEntrada: qtdEntradas,
      qtdNotasSaida: qtdSaidas,
    };
  }

  async getNotasPendentes(produtorId: string): Promise<number> {
    return this.prisma.notaFiscal.count({
      where: {
        produtorId,
        status: 'pendente',
      },
    });
  }

  async getProdutosPrincipais(
    produtorId: string,
    query?: DashboardQueryDto,
  ): Promise<{ produto: string; valor: number; quantidade: number }[]> {
    const where: any = {
      notaFiscal: {
        produtorId,
        tipo: 'saida',
      },
    };

    // Filtro de período
    if (query) {
      const dateFilter: any = {};

      if (query.dataInicio) dateFilter.gte = new Date(query.dataInicio);
      if (query.dataFim) dateFilter.lte = new Date(query.dataFim);

      if (query.ano && query.mes) {
        const startDate = new Date(query.ano, query.mes - 1, 1);
        const endDate = new Date(query.ano, query.mes, 0, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      } else if (query.ano) {
        dateFilter.gte = new Date(query.ano, 0, 1);
        dateFilter.lte = new Date(query.ano, 11, 31, 23, 59, 59);
      }

      if (Object.keys(dateFilter).length > 0) {
        where.notaFiscal.dataEmissao = dateFilter;
      }
    }

    // Agregação por descrição do produto (agora em ItemNotaFiscal)
    const produtos = await this.prisma.itemNotaFiscal.groupBy({
      by: ['descricao'],
      where,
      _sum: {
        valorTotal: true,
        quantidade: true,
      },
      orderBy: {
        _sum: {
          valorTotal: 'desc',
        },
      },
      take: 5,
    });

    return produtos.map((p) => ({
      produto: p.descricao,
      valor: p._sum.valorTotal || 0,
      quantidade: p._sum.quantidade || 0,
    }));
  }

  async getImpostosPorTipo(
    produtorId: string,
    query?: DashboardQueryDto,
  ): Promise<{ cbs: number; ibs: number; funrural: number; total: number }> {
    const where: any = { produtorId, tipo: 'saida' };

    // Filtro de período
    if (query) {
      const dateFilter: any = {};

      if (query.dataInicio) dateFilter.gte = new Date(query.dataInicio);
      if (query.dataFim) dateFilter.lte = new Date(query.dataFim);

      if (query.ano && query.mes) {
        const startDate = new Date(query.ano, query.mes - 1, 1);
        const endDate = new Date(query.ano, query.mes, 0, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      } else if (query.ano) {
        dateFilter.gte = new Date(query.ano, 0, 1);
        dateFilter.lte = new Date(query.ano, 11, 31, 23, 59, 59);
      }

      if (Object.keys(dateFilter).length > 0) {
        where.dataEmissao = dateFilter;
      }
    }

    const impostos = await this.prisma.notaFiscal.aggregate({
      where,
      _sum: {
        valorCbs: true,
        valorIbs: true,
        valorFunrural: true,
        valorTotal: true,
      },
    });

    return {
      cbs: impostos._sum.valorCbs || 0,
      ibs: impostos._sum.valorIbs || 0,
      funrural: impostos._sum.valorFunrural || 0,
      total: impostos._sum.valorTotal || 0,
    };
  }

  async getEvolucaoMensal(produtorId: string, ano: number) {
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);

    const evolucao = await Promise.all(
      meses.map(async (mes) => {
        const fluxoCaixa = await this.getFluxoCaixa(produtorId, { ano, mes });

        return {
          mes,
          mesNome: new Date(ano, mes - 1).toLocaleString('pt-BR', {
            month: 'long',
          }),
          ...fluxoCaixa,
        };
      }),
    );

    return evolucao;
  }
}
