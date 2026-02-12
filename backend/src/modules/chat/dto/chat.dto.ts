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
