import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePendenciaDto {
  @ApiProperty() @IsString()
  produtorId: string;

  @ApiProperty() @IsString()
  titulo: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  descricao?: string;

  @ApiProperty({ example: '2026-02-28' }) @IsDateString()
  dataLimite: string; // ISO

  @ApiProperty({ enum: ['baixa', 'media', 'alta', 'urgente'] })
  @IsIn(['baixa', 'media', 'alta', 'urgente'])
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';

  @ApiProperty({ type: [String], example: ['nf-entrada', 'nf-saida'] })
  @IsArray()
  tiposDocumentos: string[];

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  observacoes?: string;
}
