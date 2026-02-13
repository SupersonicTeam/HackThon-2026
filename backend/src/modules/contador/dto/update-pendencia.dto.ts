import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePendenciaDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  titulo?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: '2026-02-28' }) @IsOptional() @IsDateString()
  dataLimite?: string;

  @ApiPropertyOptional({ enum: ['baixa', 'media', 'alta', 'urgente'] })
  @IsOptional() @IsIn(['baixa', 'media', 'alta', 'urgente'])
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  tiposDocumentos?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacoes?: string;
}
