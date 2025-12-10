import { Alert, AlertType, AlertChannel, AlertStatus } from '../../domain/entities/Alert';
import { IAlertRepository } from '../../domain/repositories/IAlertRepository';
import prisma from '../database/prisma';
import { AlertType as PrismaAlertType, AlertChannel as PrismaAlertChannel, AlertStatus as PrismaAlertStatus } from '@prisma/client';

export class PrismaAlertRepository implements IAlertRepository {
  private mapToDomain(data: any): Alert {
    return new Alert({
      id: data.id,
      deviceId: data.deviceId,
      deviceName: data.device?.name || '',
      type: data.type.toLowerCase() as AlertType,
      message: data.message,
      channel: data.channel.toLowerCase() as AlertChannel,
      status: data.status.toLowerCase() as AlertStatus,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      sentAt: data.sentAt,
      createdAt: data.createdAt,
    });
  }

  async save(alert: Alert): Promise<Alert> {
    const data = await prisma.alert.create({
      data: {
        id: alert.id,
        deviceId: alert.deviceId,
        type: alert.type.toUpperCase() as PrismaAlertType,
        message: alert.message,
        channel: alert.channel.toUpperCase() as PrismaAlertChannel,
        status: alert.status.toUpperCase() as PrismaAlertStatus,
        recipientEmail: alert.recipientEmail,
        recipientPhone: alert.recipientPhone,
        sentAt: alert.sentAt,
      },
      include: { device: true },
    });
    return this.mapToDomain(data);
  }

  async findById(id: string): Promise<Alert | null> {
    const data = await prisma.alert.findUnique({
      where: { id },
      include: { device: true },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByDeviceId(deviceId: string): Promise<Alert[]> {
    const data = await prisma.alert.findMany({
      where: { deviceId },
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async findPending(): Promise<Alert[]> {
    const data = await prisma.alert.findMany({
      where: { status: 'PENDING' },
      include: { device: true },
      orderBy: { createdAt: 'asc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async findRecent(limit: number = 50): Promise<Alert[]> {
    const data = await prisma.alert.findMany({
      include: { device: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return data.map(d => this.mapToDomain(d));
  }

  async update(alert: Alert): Promise<Alert> {
    const data = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: alert.status.toUpperCase() as PrismaAlertStatus,
        sentAt: alert.sentAt,
      },
      include: { device: true },
    });
    return this.mapToDomain(data);
  }
}
