import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from "class-validator";

export class ChatMessageDto {
  @ApiProperty({ description: "Mensagem do usuário", example: "O que é CBS?" })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: "Contexto adicional (perfil do produtor, etc)",
  })
  @IsOptional()
  context?: {
    produtorId?: string;
    cpfCnpj?: string;
    regimeTributario?: string;
    culturas?: string[];
    estado?: string;
    history?: { role: string; content: string }[];
  };
}

export class CalcularImpostoDto {
  @ApiProperty({ description: "Faturamento anual em reais", example: 500000 })
  @IsNumber()
  faturamentoAnual: number;

  @ApiProperty({ description: "Regime tributário atual", example: "simples" })
  @IsString()
  regime: string;

  @ApiProperty({
    description: "Culturas produzidas",
    example: ["Soja", "Milho"],
  })
  @IsArray()
  @IsString({ each: true })
  culturas: string[];

  @ApiPropertyOptional({
    description: "Custo anual com insumos",
    example: 150000,
  })
  @IsNumber()
  @IsOptional()
  custoInsumos?: number;
}

export class ChatResponseDto {
  @ApiProperty({ description: "Resposta do assistente" })
  response: string;

  @ApiProperty({ description: "Fontes da informação" })
  sources: string[];

  @ApiProperty({ description: "Timestamp da resposta" })
  timestamp: string;
}

export class NotaFiscalDto {
  @ApiProperty({ description: "Tipo de nota", example: "entrada" })
  @IsString()
  @IsNotEmpty()
  tipo: "entrada" | "saida";

  @ApiProperty({ description: "Produto/cultura", example: "Soja" })
  @IsString()
  @IsNotEmpty()
  produto: string;

  @ApiProperty({ description: "Valor total da nota", example: 50000 })
  @IsNumber()
  valor: number;

  @ApiPropertyOptional({ description: "Quantidade em toneladas", example: 100 })
  @IsNumber()
  @IsOptional()
  quantidade?: number;

  @ApiPropertyOptional({ description: "Destino (estado)", example: "SP" })
  @IsString()
  @IsOptional()
  destino?: string;

  @ApiPropertyOptional({ description: "É exportação?", example: false })
  @IsOptional()
  exportacao?: boolean;
}

export class AnalisarNotaDto {
  @ApiProperty({ description: "Dados da nota a ser analisada", type: NotaFiscalDto })
  nota: NotaFiscalDto;

  @ApiPropertyOptional({ description: "Regime tributário do produtor", example: "simples" })
  @IsString()
  @IsOptional()
  regimeTributario?: string;
}

export class SimularPrecoDto {
  @ApiProperty({ description: "Produto/cultura", example: "Soja" })
  @IsString()
  @IsNotEmpty()
  produto: string;

  @ApiProperty({ description: "Custo de produção total", example: 30000 })
  @IsNumber()
  custoProducao: number;

  @ApiProperty({ description: "Quantidade produzida (toneladas)", example: 100 })
  @IsNumber()
  quantidade: number;

  @ApiProperty({ description: "Regime tributário", example: "simples" })
  @IsString()
  regime: string;

  @ApiPropertyOptional({ description: "Margem de lucro desejada (%)", example: 20 })
  @IsNumber()
  @IsOptional()
  margemLucro?: number;

  @ApiPropertyOptional({ description: "É exportação?", example: false })
  @IsOptional()
  exportacao?: boolean;
}

export class DicasLucroDto {
  @ApiProperty({ description: "Faturamento anual", example: 500000 })
  @IsNumber()
  faturamentoAnual: number;

  @ApiProperty({ description: "Custos totais", example: 350000 })
  @IsNumber()
  custoTotal: number;

  @ApiProperty({ description: "Regime atual", example: "simples" })
  @IsString()
  regime: string;

  @ApiProperty({ description: "Culturas produzidas", example: ["Soja", "Milho"] })
  @IsArray()
  @IsString({ each: true })
  culturas: string[];

  @ApiPropertyOptional({ description: "Notas fiscais do período", type: [NotaFiscalDto] })
  @IsOptional()
  @IsArray()
  notas?: NotaFiscalDto[];
}
