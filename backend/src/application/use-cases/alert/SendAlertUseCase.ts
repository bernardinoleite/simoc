import { Alert } from '../../../domain/entities/alert';
import { IAlertRepository } from '../../../domain/repositories/alert-repository';
import { CreateAlertDTO, AlertResponseDTO } from '../../dtos/AlertDTO';

export interface INotificationService {
  sendEmail(to: string, subject: string, message: string): Promise<boolean>;
  sendSMS(to: string, message: string): Promise<boolean>;
}

export class SendAlertUseCase {
  constructor(
    private alertRepository: IAlertRepository,
    private notificationService: INotificationService
  ) {}

  async execute(data: CreateAlertDTO): Promise<AlertResponseDTO> {
    const alert = Alert.create(
      data.deviceId,
      data.deviceName,
      data.type,
      data.channel,
      data.recipientEmail,
      data.recipientPhone
    );

    await this.alertRepository.save(alert);

    try {
      let emailSent = false;
      let smsSent = false;

      if ((data.channel === 'email' || data.channel === 'both') && data.recipientEmail) {
        const subject = `SIMOC Alert: ${data.deviceName}`;
        emailSent = await this.notificationService.sendEmail(
          data.recipientEmail,
          subject,
          alert.message
        );
      }

      if ((data.channel === 'sms' || data.channel === 'both') && data.recipientPhone) {
        smsSent = await this.notificationService.sendSMS(data.recipientPhone, alert.message);
      }

      if (emailSent || smsSent) {
        alert.markAsSent();
      } else {
        alert.markAsFailed();
      }

      await this.alertRepository.update(alert);
    } catch (error) {
      alert.markAsFailed();
      await this.alertRepository.update(alert);
    }

    return alert.toJSON();
  }
}
