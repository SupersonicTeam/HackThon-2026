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
