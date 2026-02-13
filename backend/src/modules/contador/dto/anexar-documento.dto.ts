import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class AnexarDocumentoDto {
  @ApiProperty({ description: 'ID da pendência' })
  @IsString()
  @IsNotEmpty()
  pendenciaId: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @IsNotEmpty()
  nomeArquivo: string;

  @ApiProperty({ description: 'Tipo do documento', example: 'nf-entrada' })
  @IsString()
  @IsNotEmpty()
  tipoDocumento: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes', required: false })
  @IsOptional()
  @IsNumber()
  tamanho?: number;

  @ApiProperty({ description: 'Caminho do arquivo no servidor', required: false })
  @IsOptional()
  @IsString()
  caminhoArquivo?: string;
}
