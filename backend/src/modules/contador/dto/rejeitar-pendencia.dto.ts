import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejeitarPendenciaDto {
  @ApiProperty() @IsString()
  motivo: string;
}
