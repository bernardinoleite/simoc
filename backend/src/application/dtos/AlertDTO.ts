import { AlertType, AlertChannel, AlertStatus } from '../../domain/entities/alert';

export interface CreateAlertDTO {
  deviceId: string;
  deviceName: string;
  type: AlertType;
  channel: AlertChannel;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface AlertResponseDTO {
  id: string;
  deviceId: string;
  deviceName: string;
  type: AlertType;
  message: string;
  channel: AlertChannel;
  status: AlertStatus;
  recipientEmail?: string;
  recipientPhone?: string;
  sentAt?: Date;
  createdAt: Date;
}
