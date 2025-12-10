import { Device, DeviceProps, DeviceStatus, DeviceType, CheckType } from '../../domain/entities/Device';
import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import prisma from '../database/prisma';
import { DeviceStatus as PrismaDeviceStatus, DeviceType as PrismaDeviceType, CheckType as PrismaCheckType } from '@prisma/client';

export class PrismaDeviceRepository implements IDeviceRepository {
  private mapToDomain(data: any): Device {
    return new Device({
      id: data.id,
      name: data.name,
      type: data.type.toLowerCase() as DeviceType,
      host: data.host,
      port: data.port,
      checkType: data.checkType.toLowerCase() as CheckType,
      checkInterval: data.checkInterval,
      timeout: data.timeout,
      status: data.status.toLowerCase() as DeviceStatus,
      lastCheck: data.lastCheck,
      lastResponseTime: data.lastResponseTime,
      isActive: data.isActive,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private mapToPrisma(device: Device): any {
    return {
      id: device.id,
      name: device.name,
      type: device.type.toUpperCase() as PrismaDeviceType,
      host: device.host,
      port: device.port,
      checkType: device.checkType.toUpperCase() as PrismaCheckType,
      checkInterval: device.checkInterval,
      timeout: device.timeout,
      status: device.status.toUpperCase() as PrismaDeviceStatus,
      lastCheck: device.lastCheck,
      lastResponseTime: device.lastResponseTime,
      isActive: device.isActive,
      userId: device.userId,
    };
  }

  async save(device: Device): Promise<Device> {
    const data = await prisma.device.create({
      data: this.mapToPrisma(device),
    });
    return this.mapToDomain(data);
  }

  async findById(id: string): Promise<Device | null> {
    const data = await prisma.device.findUnique({
      where: { id },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<Device[]> {
    const data = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async findAllActive(): Promise<Device[]> {
    const data = await prisma.device.findMany({
      where: { isActive: true },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async findAll(): Promise<Device[]> {
    const data = await prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async update(device: Device): Promise<Device> {
    const data = await prisma.device.update({
      where: { id: device.id },
      data: this.mapToPrisma(device),
    });
    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.device.delete({
      where: { id },
    });
  }
}
