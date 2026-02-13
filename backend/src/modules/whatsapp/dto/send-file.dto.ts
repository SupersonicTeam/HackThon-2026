import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendFileDto {
  @IsString()
  phone: string;

  @IsString()
  filename: string;

  @IsString()
  base64: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}
