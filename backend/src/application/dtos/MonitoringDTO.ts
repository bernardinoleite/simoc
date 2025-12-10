import { DeviceStatus } from '../../domain/entities/device';

export interface MonitoringLogResponseDTO {
  id: string;
  deviceId: string;
  status: DeviceStatus;
  responseTime?: number;
  errorMessage?: string;
  checkedAt: Date;
}

export interface DashboardStatsDTO {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  overallUptime: number;
  recentAlerts: number;
}
