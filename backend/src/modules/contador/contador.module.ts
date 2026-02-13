import { Module } from '@nestjs/common';
import { ContadorController } from './contador.controller';
import { ContadorService } from './contador.service';
import { ContadorOcrService } from './contador-ocr.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [ContadorController],
  providers: [ContadorService, ContadorOcrService],
})
export class ContadorModule {}
