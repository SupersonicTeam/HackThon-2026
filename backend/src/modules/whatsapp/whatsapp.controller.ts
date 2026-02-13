import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WhatsappService, SessionStatus } from './whatsapp.service';
import { SendMessageDto, SendFileDto, SendImageDto, GetMessagesDto } from './dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // ===== SESSÃO =====

  /**
   * Gera um token de autenticação
   */
  @Post('token')
  generateToken() {
    return this.whatsappService.generateToken();
  }

  /**
   * Inicia uma sessão (retorna QR Code se necessário)
   */
  @Post('session/start')
  startSession(@Query('waitQrCode') waitQrCode?: string): Promise<SessionStatus> {
    return this.whatsappService.startSession(waitQrCode !== 'false');
  }

  /**
   * Verifica o status da sessão
   */
  @Get('session/status')
  getStatus(): Promise<SessionStatus> {
    return this.whatsappService.getStatus();
  }

  /**
   * Verifica se a conexão está ativa
   */
  @Get('session/check')
  checkConnection() {
    return this.whatsappService.checkConnection();
  }

  /**
   * Encerra a sessão atual
   */
  @Post('session/close')
  closeSession() {
    return this.whatsappService.closeSession();
  }

  /**
   * Faz logout e remove dados da sessão
   */
  @Post('session/logout')
  logoutSession() {
    return this.whatsappService.logoutSession();
  }

  /**
   * Obtém QR Code para conexão
   */
  @Get('session/qrcode')
  getQrCode() {
    return this.whatsappService.getQrCode();
  }

  // ===== MENSAGENS =====

  /**
   * Envia mensagem de texto
   */
  @Post('send')
  send(@Body() body: SendMessageDto) {
    return this.whatsappService.sendText(body.to, body.message);
  }

  /**
   * Envia arquivo/documento
   */
  @Post('send-file')
  sendFile(@Body() body: SendFileDto) {
    return this.whatsappService.sendFile({
      phone: body.phone,
      filename: body.filename,
      base64: body.base64,
      caption: body.caption,
      isGroup: body.isGroup,
    });
  }

  /**
   * Envia imagem
   */
  @Post('send-image')
  sendImage(@Body() body: SendImageDto) {
    return this.whatsappService.sendImage({
      phone: body.phone,
      base64: body.base64,
      caption: body.caption,
      isGroup: body.isGroup,
    });
  }

  /**
   * Obtém mensagens de um chat
   */
  @Get('messages/:phone')
  getMessages(@Param('phone') phone: string, @Query('count') count?: string) {
    return this.whatsappService.getMessages(phone, count ? parseInt(count) : 20);
  }

  /**
   * Marca chat como lido
   */
  @Post('messages/:phone/read')
  markAsRead(@Param('phone') phone: string) {
    return this.whatsappService.markAsRead(phone);
  }

  // ===== CONTATOS & CHATS =====

  /**
   * Lista todos os contatos
   */
  @Get('contacts')
  getAllContacts() {
    return this.whatsappService.getAllContacts();
  }

  /**
   * Obtém informações de um contato
   */
  @Get('contacts/:phone')
  getContact(@Param('phone') phone: string) {
    return this.whatsappService.getContact(phone);
  }

  /**
   * Lista todas as conversas
   */
  @Get('chats')
  getAllChats() {
    return this.whatsappService.getAllChats();
  }
}
