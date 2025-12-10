import { PrismaClient } from '@prisma/client';
import { hash } from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production use bcrypt
  return Buffer.from(password).toString('base64');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simoc.local' },
    update: {},
    create: {
      email: 'admin@simoc.local',
      name: 'Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      notifyByEmail: true,
      notifyBySms: false,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample devices
  const devices = [
    {
      name: 'Google DNS',
      type: 'SERVER' as const,
      host: '8.8.8.8',
      checkType: 'PING' as const,
      checkInterval: 60,
      timeout: 5000,
      isActive: true,
      userId: admin.id,
    },
    {
      name: 'Google Website',
      type: 'API' as const,
      host: 'google.com',
      port: 443,
      checkType: 'HTTPS' as const,
      checkInterval: 120,
      timeout: 10000,
      isActive: true,
      userId: admin.id,
    },
    {
      name: 'Cloudflare DNS',
      type: 'SERVER' as const,
      host: '1.1.1.1',
      checkType: 'PING' as const,
      checkInterval: 60,
      timeout: 5000,
      isActive: true,
      userId: admin.id,
    },
    {
      name: 'GitHub API',
      type: 'API' as const,
      host: 'api.github.com',
      port: 443,
      checkType: 'HTTPS' as const,
      checkInterval: 300,
      timeout: 10000,
      isActive: true,
      userId: admin.id,
    },
  ];

  for (const device of devices) {
    const created = await prisma.device.upsert({
      where: { id: device.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: device,
    });
    console.log('✅ Created device:', created.name);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
