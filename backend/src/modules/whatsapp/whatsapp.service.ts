import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private baseUrl = process.env.WPP_BASE_URL ?? 'http://localhost:21465';
  private session = process.env.WPP_SESSION ?? 'NERDWHATS_AMERICA';
  private token = process.env.WPP_TOKEN ?? '';

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  async sendText(to: string, message: string) {
    const url = `${this.baseUrl}/api/${this.session}/send-message`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        phone: to,
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
}
