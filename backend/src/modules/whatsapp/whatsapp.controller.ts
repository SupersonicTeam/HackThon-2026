import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  send(@Body() body: SendMessageDto) {
    return this.whatsappService.sendText(body.to, body.message);
  }
}
