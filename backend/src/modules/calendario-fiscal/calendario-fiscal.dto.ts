import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class ConfigurarNotificacoesDto {
  @ApiProperty({
    description: 'Dias de antecedência para notificações',
    example: [1, 7, 15],
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  diasAntecedencia: number[];

  @ApiProperty({
    description: 'Tipos de notificação',
    example: ['email', 'sistema'],
    enum: ['email', 'whatsapp', 'sistema'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  tiposNotificacao: ('email' | 'whatsapp' | 'sistema')[];

  @ApiProperty({ description: 'Ativar notificações', example: true })
  @IsBoolean()
  @IsNotEmpty()
  ativo: boolean;
}

export class GerarRelatorioMensalDto {
  @ApiProperty({ description: 'Mês (1-12)', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  mes: number;

  @ApiProperty({ description: 'Ano', example: 2026 })
  @IsNumber()
  @IsNotEmpty()
  ano: number;
}

export class EnviarRelatorioContadorDto {
  @ApiProperty({ description: 'ID do relatório' })
  @IsString()
  @IsNotEmpty()
  relatorioId: string;

  @ApiProperty({
    description: 'E-mail do contador',
    example: 'contador@escritorio.com.br',
  })
  @IsString()
  @IsNotEmpty()
  contadorEmail: string;
}

export class ConfigurarEnvioAutomaticoDto {
  @ApiProperty({
    description: 'E-mail do contador',
    example: 'contador@escritorio.com.br',
  })
  @IsString()
  @IsNotEmpty()
  contadorEmail: string;

  @ApiProperty({
    description: 'Dia do mês para envio automático (1-28)',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  diaEnvio: number;

  @ApiProperty({ description: 'Ativar envio automático', example: true })
  @IsBoolean()
  @IsNotEmpty()
  ativo: boolean;

  @ApiProperty({
    description: 'Anexos para incluir no relatório',
    example: ['notas', 'impostos', 'financeiro'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  incluirAnexos: string[];
}

// ==========================================
// PENDÊNCIAS E ANEXOS DTOs
// ==========================================

export class CriarPendenciaDto {
  @ApiProperty({
    description: 'Título da pendência',
    example: 'Anexar folhas de pagamento e notas fiscais',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description: 'Descrição detalhada da pendência',
    example:
      'Enviar folhas de pagamento de janeiro/2026 e todas as notas fiscais de entrada e saída',
  })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({
    description: 'Data limite para cumprimento',
    example: '2026-02-21T00:00:00.000Z',
  })
  @IsString()
  @IsNotEmpty()
  dataLimite: string;

  @ApiProperty({
    description: 'Tipos de documentos solicitados',
    example: ['folha-pagamento', 'nf-entrada', 'nf-saida'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  tiposDocumentos: string[];

  @ApiProperty({
    description: 'Prioridade da pendência',
    example: 'alta',
    enum: ['baixa', 'media', 'alta', 'urgente'],
  })
  @IsString()
  @IsNotEmpty()
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';

  @ApiProperty({ description: 'Observações adicionais', required: false })
  @IsString()
  observacoes?: string;
}

export class SelecionarDocumentosDto {
  @ApiProperty({
    description: 'ID da pendência a ser atendida',
    example: 'pend-123456789',
  })
  @IsString()
  @IsNotEmpty()
  pendenciaId: string;

  @ApiProperty({
    description: 'IDs dos documentos selecionados',
    example: ['doc-001', 'doc-002', 'nf-entrada-001'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  documentosSelecionados: string[];

  @ApiProperty({
    description: 'Observações do produtor',
    required: false,
    example: 'Todos os documentos de janeiro/2026 conforme solicitado',
  })
  @IsString()
  observacoesProduto?: string;
}

export class GerarPacoteDocumentosDto {
  @ApiProperty({
    description: 'ID da pendência',
    example: 'pend-123456789',
  })
  @IsString()
  @IsNotEmpty()
  pendenciaId: string;

  @ApiProperty({
    description: 'Nome personalizado para o pacote',
    required: false,
    example: 'Documentos_Janeiro_2026_FazendaSoja',
  })
  @IsString()
  nomePacote?: string;

  @ApiProperty({
    description: 'Incluir senha no arquivo ZIP',
    example: false,
  })
  @IsBoolean()
  incluirSenha: boolean;

  @ApiProperty({
    description: 'Notificar contador automaticamente',
    example: true,
  })
  @IsBoolean()
  notificarContador: boolean;
}
