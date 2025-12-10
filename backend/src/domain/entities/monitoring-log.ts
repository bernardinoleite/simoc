import { v4 as uuidv4 } from 'uuid';
import { DeviceStatus } from './device';

export interface MonitoringLogProps {
  id?: string;
  deviceId: string;
  status: DeviceStatus;
  responseTime?: number;
  errorMessage?: string;
  checkedAt?: Date;
}

export class MonitoringLog {
  public readonly id: string;
  public readonly deviceId: string;
  public readonly status: DeviceStatus;
  public readonly responseTime?: number;
  public readonly errorMessage?: string;
  public readonly checkedAt: Date;

  constructor(props: MonitoringLogProps) {
    this.id = props.id || uuidv4();
    this.deviceId = props.deviceId;
    this.status = props.status;
    this.responseTime = props.responseTime;
    this.errorMessage = props.errorMessage;
    this.checkedAt = props.checkedAt || new Date();
  }

  static create(
    deviceId: string,
    status: DeviceStatus,
    responseTime?: number,
    errorMessage?: string
  ): MonitoringLog {
    return new MonitoringLog({
      deviceId,
      status,
      responseTime,
      errorMessage,
    });
  }

  toJSON() {
    return {
      id: this.id,
      deviceId: this.deviceId,
      status: this.status,
      responseTime: this.responseTime,
      errorMessage: this.errorMessage,
      checkedAt: this.checkedAt,
    };
  }
}
