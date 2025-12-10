import { User, UserProps, UserRole } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import prisma from '../database/prisma';
import { UserRole as PrismaUserRole } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  private mapToDomain(data: any): User {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role.toLowerCase() as UserRole,
      isActive: data.isActive,
      notifyByEmail: data.notifyByEmail,
      notifyBySms: data.notifyBySms,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(user: User, password: string): Promise<User> {
    const data = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: password,
        phone: user.phone,
        role: user.role.toUpperCase() as PrismaUserRole,
        isActive: user.isActive,
        notifyByEmail: user.notifyByEmail,
        notifyBySms: user.notifyBySms,
      },
    });
    return this.mapToDomain(data);
  }

  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: { id },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: { email },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByEmailWithPassword(email: string): Promise<{ user: User; password: string } | null> {
    const data = await prisma.user.findUnique({
      where: { email },
    });
    if (!data) return null;
    return {
      user: this.mapToDomain(data),
      password: data.password,
    };
  }

  async findAll(): Promise<User[]> {
    const data = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map(d => this.mapToDomain(d));
  }

  async update(user: User): Promise<User> {
    const data = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        phone: user.phone,
        role: user.role.toUpperCase() as PrismaUserRole,
        isActive: user.isActive,
        notifyByEmail: user.notifyByEmail,
        notifyBySms: user.notifyBySms,
      },
    });
    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
