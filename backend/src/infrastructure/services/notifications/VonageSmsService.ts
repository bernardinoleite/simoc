import { Vonage } from '@vonage/server-sdk';
import { INotificationService } from '@application/use-cases/alert/SendAlertUseCase';

export class VonageSmsService implements Partial<INotificationService> {
  private vonage: Vonage;
  private fromNumber: string;

  constructor() {
    const apiKey = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Missing Vonage environment variables');
    }

    this.vonage = new Vonage({
      apiKey,
      apiSecret,
    });

    this.fromNumber = process.env.VONAGE_FROM_NUMBER || 'SIMOC';
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      // Formatar número de telefone (remover caracteres especiais)
      const formattedNumber = this.formatPhoneNumber(to);

      // Truncar mensagem se necessário (SMS tem limite de 160 caracteres)
      const truncatedMessage = message.length > 160
        ? message.substring(0, 157) + '...'
        : message;

      const response = await this.vonage.sms.send({
        from: this.fromNumber,
        to: formattedNumber,
        text: truncatedMessage,
      });

      const messageResponse = response.messages[0];

      if (messageResponse.status === '0') {
        console.log(`📱 SMS sent successfully to ${to}. ID: ${messageResponse['message-id']}`);
        return true;
      } else {
        console.error(`SMS failed: ${messageResponse.errorText}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos exceto o '+'
    let formatted = phone.replace(/[^\d+]/g, '');

    // Se não começar com '+', assume que é um número brasileiro
    if (!formatted.startsWith('+')) {
      formatted = '+55' + formatted;
    }

    return formatted;
  }
}
