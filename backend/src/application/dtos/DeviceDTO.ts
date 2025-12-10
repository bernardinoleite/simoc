import { DeviceType, CheckType } from '../../domain/entities/device';

export interface CreateDeviceDTO {
  name: string;
  type: DeviceType;
  host: string;
  port?: number;
  checkType: CheckType;
  checkInterval?: number;
  timeout?: number;
  userId: string;
}

export interface UpdateDeviceDTO {
  name?: string;
  type?: DeviceType;
  host?: string;
  port?: number;
  checkType?: CheckType;
  checkInterval?: number;
  timeout?: number;
  isActive?: boolean;
}

export interface DeviceResponseDTO {
  id: string;
  name: string;
  type: DeviceType;
  host: string;
  port?: number;
  checkType: CheckType;
  checkInterval: number;
  timeout: number;
  status: string;
  lastCheck?: Date;
  lastResponseTime?: number;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceStatsDTO {
  deviceId: string;
  deviceName: string;
  totalChecks: number;
  onlineCount: number;
  offlineCount: number;
  avgResponseTime: number;
  uptime: number;
}
