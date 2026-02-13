import { Injectable, Logger } from '@nestjs/common';

export interface SendFileOptions {
  phone: string;
  filename: string;
  base64: string;
  caption?: string;
  isGroup?: boolean;
}

export interface SendImageOptions {
  phone: string;
  base64: string;
  caption?: string;
  isGroup?: boolean;
}

export interface SessionStatus {
  status: string;
  qrcode?: string;
  urlcode?: string;
  session?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private baseUrl = process.env.WPP_BASE_URL ?? 'http://localhost:21465';
  private session = process.env.WPP_SESSION ?? 'NERDWHATS_AMERICA';
  private secretKey = process.env.WPP_SECRET_KEY ?? 'THISISMYSECURETOKEN';
  private token = process.env.WPP_TOKEN ?? '';

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Formata telefone para padrão WhatsApp Brasil (55 + DDD + número)
   * Aceita formatos: (44) 99999-8888, 44999998888, +55 44 99999-8888
   */
  private formatPhone(phone: string): string {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    
    // Se já começa com 55 e tem 13 dígitos, retorna como está
    if (numbers.startsWith('55') && numbers.length >= 12) {
      return numbers;
    }
    
    // Se tem 10 ou 11 dígitos (DDD + número), adiciona 55
    if (numbers.length >= 10 && numbers.length <= 11) {
      return '55' + numbers;
    }
    
    // Retorna original se não conseguir formatar
    return numbers;
  }

  /**
   * Gera um token de autenticação para a sessão
   */
  async generateToken(): Promise<{ token: string }> {
    const url = `${this.baseUrl}/api/${this.session}/${this.secretKey}/generate-token`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao gerar token WPP: ${res.status} - ${err}`);
    }

    const data = await res.json();
    this.token = data.token;
    return data;
  }

  /**
   * Inicia uma sessão do WhatsApp (retorna QR Code se necessário)
   */
  async startSession(waitQrCode = true): Promise<SessionStatus> {
    const url = `${this.baseUrl}/api/${this.session}/start-session`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        webhook: '',
        waitQrCode,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao iniciar sessão WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Verifica o status da sessão atual
   */
  async getStatus(): Promise<SessionStatus> {
    const url = `${this.baseUrl}/api/${this.session}/status-session`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao verificar status WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Verifica se a conexão está ativa
   */
  async checkConnection(): Promise<{ status: boolean; message: string }> {
    const url = `${this.baseUrl}/api/${this.session}/check-connection-session`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      return { status: false, message: 'Sessão desconectada' };
    }

    return res.json();
  }

  /**
   * Encerra a sessão atual
   */
  async closeSession(): Promise<{ status: boolean; message: string }> {
    const url = `${this.baseUrl}/api/${this.session}/close-session`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao encerrar sessão WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Faz logout e remove dados da sessão
   */
  async logoutSession(): Promise<{ status: boolean; message: string }> {
    const url = `${this.baseUrl}/api/${this.session}/logout-session`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao fazer logout WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Envia uma mensagem de texto
   */
  async sendText(to: string, message: string) {
    const phone = this.formatPhone(to);
    const url = `${this.baseUrl}/api/${this.session}/send-message`;

    this.logger.log(`📱 Enviando mensagem para ${phone}...`);

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        phone,
        isGroup: false,
        isNewsletter: false,
        isLid: false,
        message,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Envia um arquivo (documento) via base64
   */
  async sendFile(options: SendFileOptions) {
    const phone = this.formatPhone(options.phone);
    const url = `${this.baseUrl}/api/${this.session}/send-file`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        phone,
        isGroup: options.isGroup ?? false,
        isNewsletter: false,
        isLid: false,
        filename: options.filename,
        caption: options.caption ?? '',
        base64: options.base64,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao enviar arquivo WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Envia uma imagem via base64
   */
  async sendImage(options: SendImageOptions) {
    const phone = this.formatPhone(options.phone);
    const url = `${this.baseUrl}/api/${this.session}/send-image`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        phone,
        isGroup: options.isGroup ?? false,
        isNewsletter: false,
        isLid: false,
        caption: options.caption ?? '',
        base64: options.base64,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao enviar imagem WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Lista todos os contatos
   */
  async getAllContacts() {
    const url = `${this.baseUrl}/api/${this.session}/show-all-contacts`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao listar contatos WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Obtém informações de um contato específico
   */
  async getContact(phone: string) {
    const url = `${this.baseUrl}/api/${this.session}/contact/${phone}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao obter contato WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Lista todas as conversas/chats
   */
  async getAllChats() {
    const url = `${this.baseUrl}/api/${this.session}/all-chats`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao listar chats WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Obtém mensagens de um chat específico
   */
  async getMessages(phone: string, count = 20) {
    const url = `${this.baseUrl}/api/${this.session}/load-messages-in-chat/${phone}?count=${count}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao carregar mensagens WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Marca uma conversa como lida
   */
  async markAsRead(phone: string) {
    const url = `${this.baseUrl}/api/${this.session}/mark-messages-as-read`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao marcar como lida WPP: ${res.status} - ${err}`);
    }

    return res.json();
  }

  /**
   * Obtém o QR Code da sessão como base64
   */
  async getQrCode(): Promise<{ qrcode: string } | null> {
    try {
      const status = await this.startSession(true);
      if (status.qrcode) {
        return { qrcode: status.qrcode };
      }
      return null;
    } catch (error) {
      this.logger.error('Erro ao obter QR Code', error);
      return null;
    }
  }
}
