import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelarPendenciaDto {
  @ApiProperty() @IsString()
  motivo: string;
}
