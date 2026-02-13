import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdutorDto } from './dto/dashboard.dto';

@Injectable()
export class ProdutorService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProdutorDto) {
    return this.prisma.produtor.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.produtor.findMany({
      include: {
        _count: {
          select: {
            notas: true,
            impostos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id },
      include: {
        notas: {
          orderBy: { dataEmissao: 'desc' },
          take: 10,
        },
        impostos: {
          orderBy: {
            anoReferencia: 'desc',
          },
          take: 12,
        },
      },
    });

    if (!produtor) {
      throw new NotFoundException(`Produtor com ID ${id} não encontrado`);
    }

    return produtor;
  }

  async findByCpfCnpj(cpfCnpj: string) {
    const produtor = await this.prisma.produtor.findUnique({
      where: { cpfCnpj },
      include: {
        notas: {
          orderBy: { dataEmissao: 'desc' },
          take: 10,
        },
        impostos: {
          orderBy: {
            anoReferencia: 'desc',
          },
          take: 12,
        },
      },
    });

    if (!produtor) {
      throw new NotFoundException(
        `Produtor com CPF/CNPJ ${cpfCnpj} não encontrado`,
      );
    }

    return produtor;
  }

  async update(id: string, data: Partial<CreateProdutorDto>) {
    const produtor = await this.findOne(id);

    return this.prisma.produtor.update({
      where: { id: produtor.id },
      data,
    });
  }

  async remove(id: string) {
    const produtor = await this.findOne(id);

    return this.prisma.produtor.delete({
      where: { id: produtor.id },
    });
  }
}
