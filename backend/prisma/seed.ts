import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar produtor mock usado no frontend
  const produtor = await prisma.produtor.upsert({
    where: { id: 'c4f29a8c-1559-4e6c-b0fd-05ce55753c4f' },
    update: {},
    create: {
      id: 'c4f29a8c-1559-4e6c-b0fd-05ce55753c4f',
      nome: 'João Silva',
      cpfCnpj: '123.456.789-00',
      email: 'joao.silva@fazenda.com',
      telefone: '(44) 99999-8888',
      estado: 'PR',
      cidade: 'Cascavel',
      regime: 'Simples Nacional',
      culturas: JSON.stringify(['Soja', 'Milho', 'Trigo']),
    },
  });

  console.log('✅ Produtor criado:', produtor.nome);

  // Criar 3 Notas Fiscais para teste do dashboard
  
  // NF-e 1: Entrada - Compra de Fertilizantes
  const nf1 = await prisma.notaFiscal.upsert({
    where: { chaveAcesso: '41260112345678901234550010001234561001234567' },
    update: {},
    create: {
      produtorId: produtor.id,
      chaveAcesso: '41260112345678901234550010001234561001234567',
      tipo: 'entrada',
      numero: '123456',
      serie: '1',
      cfop: '1101',
      naturezaOperacao: 'Compra para comercialização',
      nomeEmitente: 'Agropecuária Fertilizantes Ltda',
      cpfCnpjEmitente: '12.345.678/0001-90',
      destino: 'PR',
      exportacao: false,
      valorTotal: 15000.00,
      valorProdutos: 14500.00,
      valorFrete: 500.00,
      valorSeguro: 0,
      valorDesconto: 0,
      valorOutros: 0,
      valorCbs: 145.00,
      valorIbs: 435.00,
      valorFunrural: 0,
      valorIcms: 1740.00,
      valorIpi: 0,
      status: 'validada',
      dataEmissao: new Date('2026-02-01T10:30:00'),
    },
  });

  await prisma.itemNotaFiscal.createMany({
    data: [
      {
        notaFiscalId: nf1.id,
        numeroItem: 1,
        codigoProduto: 'FERT-NPK-001',
        descricao: 'Fertilizante NPK 10-10-10 - 50kg',
        ncm: '31051000',
        cfop: '1101',
        unidade: 'SC',
        quantidade: 200,
        valorUnitario: 72.50,
        valorTotal: 14500.00,
        valorDesconto: 0,
        valorFrete: 500.00,
        baseCalculoIcms: 14500.00,
        valorIcms: 1740.00,
        aliquotaIcms: 12.00,
        valorCbs: 145.00,
        valorIbs: 435.00,
        valorFunrural: 0,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ NF-e 1 criada: Entrada - Fertilizantes');

  // NF-e 2: Saída - Venda de Soja
  const nf2 = await prisma.notaFiscal.upsert({
    where: { chaveAcesso: '41260112345678901234550010001234572001234568' },
    update: {},
    create: {
      produtorId: produtor.id,
      chaveAcesso: '41260112345678901234550010001234572001234568',
      tipo: 'saida',
      numero: '234567',
      serie: '1',
      cfop: '5101',
      naturezaOperacao: 'Venda de produção do estabelecimento',
      nomeEmitente: produtor.nome,
      cpfCnpjEmitente: produtor.cpfCnpj,
      destino: 'SP',
      exportacao: false,
      valorTotal: 180000.00,
      valorProdutos: 180000.00,
      valorFrete: 0,
      valorSeguro: 0,
      valorDesconto: 0,
      valorOutros: 0,
      valorCbs: 1170.00,
      valorIbs: 5400.00,
      valorFunrural: 3960.00,
      valorIcms: 0, // Diferido
      valorIpi: 0,
      status: 'validada',
      dataEmissao: new Date('2026-02-10T14:20:00'),
    },
  });

  await prisma.itemNotaFiscal.createMany({
    data: [
      {
        notaFiscalId: nf2.id,
        numeroItem: 1,
        codigoProduto: 'SOJA-001',
        descricao: 'Soja em grãos - Safra 2025/2026',
        ncm: '12019000',
        cfop: '5101',
        unidade: 'KG',
        quantidade: 120000,
        valorUnitario: 1.50,
        valorTotal: 180000.00,
        valorDesconto: 0,
        valorFrete: 0,
        baseCalculoIcms: 180000.00,
        valorIcms: 0, // Diferido
        aliquotaIcms: 0,
        valorCbs: 1170.00,
        valorIbs: 5400.00,
        valorFunrural: 3960.00,
        informacoes: 'ICMS diferido conforme legislação estadual',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ NF-e 2 criada: Saída - Venda de Soja');

  // NF-e 3: Saída - Venda de Milho
  const nf3 = await prisma.notaFiscal.upsert({
    where: { chaveAcesso: '41260212345678901234550010001234583001234569' },
    update: {},
    create: {
      produtorId: produtor.id,
      chaveAcesso: '41260212345678901234550010001234583001234569',
      tipo: 'saida',
      numero: '345678',
      serie: '1',
      cfop: '5101',
      naturezaOperacao: 'Venda de produção do estabelecimento',
      nomeEmitente: produtor.nome,
      cpfCnpjEmitente: produtor.cpfCnpj,
      destino: 'PR',
      exportacao: false,
      valorTotal: 95000.00,
      valorProdutos: 95000.00,
      valorFrete: 0,
      valorSeguro: 0,
      valorDesconto: 0,
      valorOutros: 0,
      valorCbs: 617.50,
      valorIbs: 2850.00,
      valorFunrural: 2090.00,
      valorIcms: 0, // Diferido
      valorIpi: 0,
      status: 'validada',
      dataEmissao: new Date('2026-02-12T09:15:00'),
    },
  });

  await prisma.itemNotaFiscal.createMany({
    data: [
      {
        notaFiscalId: nf3.id,
        numeroItem: 1,
        codigoProduto: 'MILHO-001',
        descricao: 'Milho em grãos - Safra 2025/2026',
        ncm: '10059000',
        cfop: '5101',
        unidade: 'KG',
        quantidade: 95000,
        valorUnitario: 1.00,
        valorTotal: 95000.00,
        valorDesconto: 0,
        valorFrete: 0,
        baseCalculoIcms: 95000.00,
        valorIcms: 0, // Diferido
        aliquotaIcms: 0,
        valorCbs: 617.50,
        valorIbs: 2850.00,
        valorFunrural: 2090.00,
        informacoes: 'ICMS diferido conforme legislação estadual',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ NF-e 3 criada: Saída - Venda de Milho');

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao fazer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
