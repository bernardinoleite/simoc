import { MonitoringLog } from '../../domain/entities/MonitoringLog';
import { DeviceStatus } from '../../domain/entities/Device';
import { IMonitoringLogRepository } from '../../domain/repositories/IMonitoringLogRepository';
import prisma from '../database/prisma';
import { DeviceStatus as PrismaDeviceStatus } from '@prisma/client';

export class PrismaMonitoringLogRepository implements IMonitoringLogRepository {
  private mapToDomain(data: any): MonitoringLog {
    return new MonitoringLog({
      id: data.id,
      deviceId: data.deviceId,
      status: data.status.toLowerCase() as DeviceStatus,
      responseTime: data.responseTime,
      errorMessage: data.errorMessage,
      checkedAt: data.checkedAt,
    });
  }

  async save(log: MonitoringLog): Promise<MonitoringLog> {
    const data = await prisma.monitoringLog.create({
      data: {
        id: log.id,
        deviceId: log.deviceId,
        status: log.status.toUpperCase() as PrismaDeviceStatus,
        responseTime: log.responseTime,
        errorMessage: log.errorMessage,
        checkedAt: log.checkedAt,
      },
    });
    return this.mapToDomain(data);
  }

  async findByDeviceId(deviceId: string, limit: number = 100): Promise<MonitoringLog[]> {
    const data = await prisma.monitoringLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
    return data.map(d => this.mapToDomain(d));
  }

  async findByDateRange(deviceId: string, startDate: Date, endDate: Date): Promise<MonitoringLog[]> {
    const data = await prisma.monitoringLog.findMany({
      where: {
        deviceId,
        checkedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { checkedAt: 'desc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async getStatsByDeviceId(deviceId: string): Promise<{
    totalChecks: number;
    onlineCount: number;
    offlineCount: number;
    avgResponseTime: number;
    uptime: number;
  }> {
    const [stats, avgResult] = await Promise.all([
      prisma.monitoringLog.groupBy({
        by: ['status'],
        where: { deviceId },
        _count: { status: true },
      }),
      prisma.monitoringLog.aggregate({
        where: {
          deviceId,
          responseTime: { not: null },
        },
        _avg: { responseTime: true },
        _count: { id: true },
      }),
    ]);

    const totalChecks = stats.reduce((acc, s) => acc + s._count.status, 0);
    const onlineCount = stats.find(s => s.status === 'ONLINE')?._count.status || 0;
    const offlineCount = stats.find(s => s.status === 'OFFLINE')?._count.status || 0;
    const avgResponseTime = avgResult._avg.responseTime || 0;
    const uptime = totalChecks > 0 ? (onlineCount / totalChecks) * 100 : 100;

    return {
      totalChecks,
      onlineCount,
      offlineCount,
      avgResponseTime: Math.round(avgResponseTime),
      uptime: Math.round(uptime * 100) / 100,
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.monitoringLog.deleteMany({
      where: {
        checkedAt: { lt: date },
      },
    });
    return result.count;
  }
}
