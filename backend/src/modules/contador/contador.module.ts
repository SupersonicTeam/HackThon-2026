import { Module } from '@nestjs/common';
import { ContadorController } from './contador.controller';
import { ContadorService } from './contador.service';

@Module({
  controllers: [ContadorController],
  providers: [ContadorService],
})
export class ContadorModule {}
