import { Module } from '@nestjs/common';
import { CalendarioFiscalService } from './calendario-fiscal.service';
import { CalendarioFiscalController } from './calendario-fiscal.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarioFiscalController],
  providers: [CalendarioFiscalService],
  exports: [CalendarioFiscalService],
})
export class CalendarioFiscalModule {}
