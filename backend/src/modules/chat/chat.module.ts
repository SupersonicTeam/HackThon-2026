import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiService } from './ai.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [ChatController],
  providers: [ChatService, AiService],
  exports: [ChatService],
})
export class ChatModule {}
