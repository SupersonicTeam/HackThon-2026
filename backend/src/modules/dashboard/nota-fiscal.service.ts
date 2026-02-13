import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateNotaFiscalDto,
  UpdateNotaFiscalDto,
  DashboardQueryDto,
} from './dto/dashboard.dto';

@Injectable()
export class NotaFiscalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotaFiscalDto) {
    // Verifica se o produtor existe
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: data.produtorId },
    });

    if (!produtor) {
      throw new NotFoundException(
        `Produtor com ID ${data.produtorId} não encontrado`,
      );
    }

    // Extrai os itens do DTO
    const { itens, ...notaData } = data;

    // Cria a nota fiscal com seus itens
    return this.prisma.notaFiscal.create({
      data: {
        ...notaData,
        dataEmissao: new Date(data.dataEmissao),
        itens: {
          create: itens.map((item) => ({
            ...item,
          })),
        },
      },
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
            regime: true,
          },
        },
        itens: true, // Inclui os itens criados na resposta
      },
    });
  }

  async findAll(produtorId: string, query?: DashboardQueryDto) {
    const where: any = { produtorId };

    // Filtro por período
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

    return this.prisma.notaFiscal.findMany({
      where,
      orderBy: {
        dataEmissao: 'desc',
      },
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
          },
        },
        itens: true, // Inclui os itens de cada nota
      },
    });
  }

  async findOne(id: string) {
    const nota = await this.prisma.notaFiscal.findUnique({
      where: { id },
      include: {
        produtor: true,
        itens: {
          orderBy: {
            numeroItem: 'asc',
          },
        },
      },
    });

    if (!nota) {
      throw new NotFoundException(`Nota fiscal com ID ${id} não encontrada`);
    }

    return nota;
  }

  async update(id: string, data: UpdateNotaFiscalDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.notaFiscal.update({
      where: { id },
      data,
      include: {
        produtor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.notaFiscal.delete({
      where: { id },
    });
  }

  // Estatísticas específicas
  async countByTipo(produtorId: string, query?: DashboardQueryDto) {
    const where: any = { produtorId };

    // Adiciona filtro de data se fornecido
    if (query?.dataInicio || query?.dataFim || query?.ano) {
      const dateFilter: any = {};

      if (query.dataInicio) dateFilter.gte = new Date(query.dataInicio);
      if (query.dataFim) dateFilter.lte = new Date(query.dataFim);

      if (query.ano) {
        dateFilter.gte = new Date(query.ano, 0, 1);
        dateFilter.lte = new Date(query.ano, 11, 31, 23, 59, 59);
      }

      where.dataEmissao = dateFilter;
    }

    const [entradas, saidas] = await Promise.all([
      this.prisma.notaFiscal.count({
        where: { ...where, tipo: 'entrada' },
      }),
      this.prisma.notaFiscal.count({
        where: { ...where, tipo: 'saida' },
      }),
    ]);

    return { entradas, saidas };
  }
}
