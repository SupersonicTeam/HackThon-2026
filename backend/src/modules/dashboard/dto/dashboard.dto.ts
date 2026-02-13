import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  IsEnum,
} from 'class-validator';

// ==========================================
// PRODUTOR DTOs
// ==========================================
export class CreateProdutorDto {
  @ApiProperty({ description: 'Nome do produtor', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CPF ou CNPJ', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty()
  cpfCnpj: string;

  @ApiPropertyOptional({
    description: 'E-mail',
    example: 'joao@fazenda.com.br',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone', example: '(44) 99999-9999' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Estado', example: 'PR' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ description: 'Cidade', example: 'Cascavel' })
  @IsString()
  @IsOptional()
  cidade?: string;

  @ApiProperty({
    description: 'Regime tributário',
    example: 'Simples Nacional',
    enum: ['MEI', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
  })
  @IsString()
  @IsNotEmpty()
  regime: string;

  @ApiProperty({
    description: 'Culturas produzidas (JSON array)',
    example: '["Soja", "Milho"]',
  })
  @IsString()
  @IsNotEmpty()
  culturas: string;
}

export class UpdateProdutorDto {
  @ApiPropertyOptional({ description: 'Nome do produtor' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'E-mail' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsString()
  @IsOptional()
  cidade?: string;

  @ApiPropertyOptional({ description: 'Regime tributário' })
  @IsString()
  @IsOptional()
  regime?: string;

  @ApiPropertyOptional({ description: 'Culturas produzidas (JSON array)' })
  @IsString()
  @IsOptional()
  culturas?: string;
}

// ==========================================
// ITEM NOTA FISCAL DTOs
// ==========================================
export class CreateItemNotaFiscalDto {
  @ApiProperty({ description: 'Número do item na nota', example: 1 })
  @IsNumber()
  numeroItem: number;

  @ApiPropertyOptional({ description: 'Código do produto', example: '101665' })
  @IsString()
  @IsOptional()
  codigoProduto?: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'SEMENTE DE SOJA BONUS 8277IPRO',
  })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiPropertyOptional({ description: 'NCM do produto', example: '12010000' })
  @IsString()
  @IsOptional()
  ncm?: string;

  @ApiPropertyOptional({ description: 'CFOP do item', example: '5102' })
  @IsString()
  @IsOptional()
  cfop?: string;

  @ApiPropertyOptional({ description: 'Unidade', example: 'SC' })
  @IsString()
  @IsOptional()
  unidade?: string;

  @ApiProperty({ description: 'Quantidade', example: 72 })
  @IsNumber()
  quantidade: number;

  @ApiProperty({ description: 'Valor unitário', example: 186.9 })
  @IsNumber()
  valorUnitario: number;

  @ApiProperty({ description: 'Valor total do item', example: 13456.8 })
  @IsNumber()
  valorTotal: number;

  @ApiPropertyOptional({ description: 'Valor de desconto' })
  @IsNumber()
  @IsOptional()
  valorDesconto?: number;

  @ApiPropertyOptional({ description: 'Valor de frete do item' })
  @IsNumber()
  @IsOptional()
  valorFrete?: number;

  @ApiPropertyOptional({ description: 'Base de cálculo ICMS' })
  @IsNumber()
  @IsOptional()
  baseCalculoIcms?: number;

  @ApiPropertyOptional({ description: 'Valor ICMS' })
  @IsNumber()
  @IsOptional()
  valorIcms?: number;

  @ApiPropertyOptional({ description: 'Alíquota ICMS (%)' })
  @IsNumber()
  @IsOptional()
  aliquotaIcms?: number;

  @ApiPropertyOptional({ description: 'Base de cálculo IPI' })
  @IsNumber()
  @IsOptional()
  baseCalculoIpi?: number;

  @ApiPropertyOptional({ description: 'Valor IPI' })
  @IsNumber()
  @IsOptional()
  valorIpi?: number;

  @ApiPropertyOptional({ description: 'Alíquota IPI (%)' })
  @IsNumber()
  @IsOptional()
  aliquotaIpi?: number;

  @ApiPropertyOptional({ description: 'Valor CBS do item' })
  @IsNumber()
  @IsOptional()
  valorCbs?: number;

  @ApiPropertyOptional({ description: 'Valor IBS do item' })
  @IsNumber()
  @IsOptional()
  valorIbs?: number;

  @ApiPropertyOptional({ description: 'Valor FUNRURAL do item' })
  @IsNumber()
  @IsOptional()
  valorFunrural?: number;

  @ApiPropertyOptional({ description: 'Informações adicionais' })
  @IsString()
  @IsOptional()
  informacoes?: string;
}

// ==========================================
// NOTA FISCAL DTOs
// ==========================================
export class CreateNotaFiscalDto {
  @ApiProperty({ description: 'ID do produtor' })
  @IsString()
  @IsNotEmpty()
  produtorId: string;

  @ApiProperty({
    description: 'Chave de acesso da NF-e (44 dígitos)',
    example: '41260100000000000000550010000115441000115448',
  })
  @IsString()
  @IsNotEmpty()
  chaveAcesso: string;

  @ApiProperty({
    description: 'Tipo de nota',
    enum: ['entrada', 'saida'],
    example: 'saida',
  })
  @IsEnum(['entrada', 'saida'])
  tipo: string;

  @ApiPropertyOptional({ description: 'Número da nota', example: '11544' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ description: 'Série da nota', example: '001' })
  @IsString()
  @IsOptional()
  serie?: string;

  @ApiPropertyOptional({
    description: 'CFOP da operação',
    example: '5102',
  })
  @IsString()
  @IsOptional()
  cfop?: string;

  @ApiPropertyOptional({
    description: 'Natureza da operação',
    example: 'Venda de mercadoria',
  })
  @IsString()
  @IsOptional()
  naturezaOperacao?: string;

  @ApiPropertyOptional({
    description: 'Nome do emitente',
    example: 'Cooperativa ABC',
  })
  @IsString()
  @IsOptional()
  nomeEmitente?: string;

  @ApiPropertyOptional({
    description: 'CPF/CNPJ do emitente',
    example: '12.345.678/0001-00',
  })
  @IsString()
  @IsOptional()
  cpfCnpjEmitente?: string;

  @ApiPropertyOptional({ description: 'Estado de destino', example: 'SP' })
  @IsString()
  @IsOptional()
  destino?: string;

  @ApiPropertyOptional({ description: 'É exportação?', example: false })
  @IsBoolean()
  @IsOptional()
  exportacao?: boolean;

  @ApiProperty({ description: 'Valor total da nota', example: 4916.14 })
  @IsNumber()
  valorTotal: number;

  @ApiPropertyOptional({ description: 'Valor dos produtos' })
  @IsNumber()
  @IsOptional()
  valorProdutos?: number;

  @ApiPropertyOptional({ description: 'Valor do frete' })
  @IsNumber()
  @IsOptional()
  valorFrete?: number;

  @ApiPropertyOptional({ description: 'Valor do seguro' })
  @IsNumber()
  @IsOptional()
  valorSeguro?: number;

  @ApiPropertyOptional({ description: 'Valor de desconto' })
  @IsNumber()
  @IsOptional()
  valorDesconto?: number;

  @ApiPropertyOptional({ description: 'Outros valores' })
  @IsNumber()
  @IsOptional()
  valorOutros?: number;

  @ApiPropertyOptional({ description: 'URL do arquivo (foto ou PDF)' })
  @IsString()
  @IsOptional()
  arquivoUrl?: string;

  @ApiPropertyOptional({
    description: 'Tipo de arquivo',
    enum: ['foto', 'pdf'],
    example: 'pdf',
  })
  @IsString()
  @IsOptional()
  arquivoTipo?: string;

  @ApiPropertyOptional({
    description: 'Status da nota',
    enum: ['pendente', 'validada', 'erro'],
    example: 'validada',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Valor CBS total', example: 1760 })
  @IsNumber()
  @IsOptional()
  valorCbs?: number;

  @ApiPropertyOptional({ description: 'Valor IBS total', example: 3540 })
  @IsNumber()
  @IsOptional()
  valorIbs?: number;

  @ApiPropertyOptional({ description: 'Valor FUNRURAL total', example: 600 })
  @IsNumber()
  @IsOptional()
  valorFunrural?: number;

  @ApiPropertyOptional({ description: 'Valor ICMS total' })
  @IsNumber()
  @IsOptional()
  valorIcms?: number;

  @ApiPropertyOptional({ description: 'Valor IPI total' })
  @IsNumber()
  @IsOptional()
  valorIpi?: number;

  @ApiPropertyOptional({
    description: 'Observações',
    example: 'Nota validada automaticamente',
  })
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiProperty({
    description: 'Data de emissão',
    example: '2026-01-12T00:00:00.000Z',
  })
  @IsDateString()
  dataEmissao: string;

  @ApiProperty({
    description: 'Itens da nota fiscal',
    type: [CreateItemNotaFiscalDto],
  })
  @IsArray()
  @IsNotEmpty()
  itens: CreateItemNotaFiscalDto[];
}

export class UpdateNotaFiscalDto {
  @ApiPropertyOptional({ description: 'Número da nota' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ description: 'Série da nota' })
  @IsString()
  @IsOptional()
  serie?: string;

  @ApiPropertyOptional({ description: 'Valor CBS total' })
  @IsNumber()
  @IsOptional()
  valorCbs?: number;

  @ApiPropertyOptional({ description: 'Valor IBS total' })
  @IsNumber()
  @IsOptional()
  valorIbs?: number;

  @ApiPropertyOptional({ description: 'Valor FUNRURAL total' })
  @IsNumber()
  @IsOptional()
  valorFunrural?: number;

  @ApiPropertyOptional({ description: 'Valor ICMS total' })
  @IsNumber()
  @IsOptional()
  valorIcms?: number;

  @ApiPropertyOptional({ description: 'Valor IPI total' })
  @IsNumber()
  @IsOptional()
  valorIpi?: number;

  @ApiPropertyOptional({ description: 'Valor total da nota' })
  @IsNumber()
  @IsOptional()
  valorTotal?: number;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ['pendente', 'validada', 'erro'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsString()
  @IsOptional()
  observacoes?: string;
}

// ==========================================
// DASHBOARD QUERY DTOs
// ==========================================
export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Ano de referência', example: 2026 })
  @IsNumber()
  @IsOptional()
  ano?: number;

  @ApiPropertyOptional({ description: 'Mês de referência (1-12)', example: 2 })
  @IsNumber()
  @IsOptional()
  mes?: number;

  @ApiPropertyOptional({
    description: 'Data inicial',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  dataFim?: string;
}

// ==========================================
// RESPONSE DTOs
// ==========================================
export class FluxoCaixaDto {
  @ApiProperty({ description: 'Total de entradas (compras)' })
  totalEntradas: number;

  @ApiProperty({ description: 'Total de saídas (vendas)' })
  totalSaidas: number;

  @ApiProperty({ description: 'Saldo (vendas - compras)' })
  saldo: number;

  @ApiProperty({
    description:
      'Total de impostos pagos (CBS, IBS, FUNRURAL, ICMS, IPI) em compras e vendas',
  })
  totalImpostos: number;

  @ApiProperty({
    description:
      'Lucro estimado (igual ao saldo, pois impostos já estão incluídos no valorTotal das notas)',
  })
  lucroEstimado: number;

  @ApiProperty({ description: 'Quantidade de notas de entrada' })
  qtdNotasEntrada: number;

  @ApiProperty({ description: 'Quantidade de notas de saída' })
  qtdNotasSaida: number;
}

export class DashboardResumoDto {
  @ApiProperty({ description: 'Fluxo de caixa' })
  fluxoCaixa: FluxoCaixaDto;

  @ApiProperty({ description: 'Notas pendentes' })
  notasPendentes: number;

  @ApiProperty({ description: 'Principais produtos' })
  produtosPrincipais: { produto: string; valor: number; quantidade: number }[];

  @ApiProperty({ description: 'Impostos por tipo' })
  impostosPorTipo: {
    cbs: number;
    ibs: number;
    funrural: number;
    total: number;
  };
}
