import { MonitoringLog } from '../entities/monitoring-log';

export interface IMonitoringLogRepository {
  save(log: MonitoringLog): Promise<MonitoringLog>;
  findByDeviceId(deviceId: string, limit?: number): Promise<MonitoringLog[]>;
  findByDateRange(deviceId: string, startDate: Date, endDate: Date): Promise<MonitoringLog[]>;
  getStatsByDeviceId(deviceId: string): Promise<{
    totalChecks: number;
    onlineCount: number;
    offlineCount: number;
    avgResponseTime: number;
    uptime: number;
  }>;
  deleteOlderThan(date: Date): Promise<number>;
}
