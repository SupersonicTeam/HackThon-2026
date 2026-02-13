import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProdutorService } from './produtor.service';
import { NotaFiscalService } from './nota-fiscal.service';
import { OcrService } from './ocr.service';
import { CalculadoraService } from './calculadora.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    ProdutorService,
    NotaFiscalService,
    OcrService,
    CalculadoraService,
  ],
  exports: [DashboardService, ProdutorService, NotaFiscalService],
})
export class DashboardModule {}
