import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarioFiscalModule } from './modules/calendario-fiscal/calendario-fiscal.module';
import { PrismaModule } from './prisma/prisma.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { ContadorModule } from './modules/contador/contador.module';
import { NotificacaoModule } from './modules/notificacao/notificacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ChatModule,
    DashboardModule,
    CalendarioFiscalModule,
    WhatsappModule,
    ContadorModule,
    NotificacaoModule,
  ],
})
export class AppModule {}
