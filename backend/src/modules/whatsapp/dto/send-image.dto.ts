import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendImageDto {
  @IsString()
  phone: string;

  @IsString()
  base64: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}
