import cron from 'node-cron';
import { IDeviceRepository } from '../../../domain/repositories/device-repository';
import { IMonitoringLogRepository } from '../../../domain/repositories/monitoring-log-repository';
import { IAlertRepository } from '../../../domain/repositories/alert-repository';
import { CheckDeviceHealthUseCase } from '../../../application/use-cases/monitoring/CheckDeviceHealthUseCase';
import { SendAlertUseCase, INotificationService } from '../../../application/use-cases/alert/SendAlertUseCase';
import { HealthChecker } from './HealthChecker';
import { Device, DeviceStatus } from '../../../domain/entities/device';

export class MonitoringScheduler {
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private devicePreviousStatus: Map<string, DeviceStatus> = new Map();
  private checkDeviceHealthUseCase: CheckDeviceHealthUseCase;
  private sendAlertUseCase: SendAlertUseCase;

  constructor(
    private deviceRepository: IDeviceRepository,
    private monitoringLogRepository: IMonitoringLogRepository,
    private alertRepository: IAlertRepository,
    private notificationService: INotificationService
  ) {
    const healthChecker = new HealthChecker();
    this.checkDeviceHealthUseCase = new CheckDeviceHealthUseCase(
      deviceRepository,
      monitoringLogRepository,
      healthChecker
    );
    this.sendAlertUseCase = new SendAlertUseCase(alertRepository, notificationService);
  }

  async start(): Promise<void> {
    console.log('🔄 Starting monitoring scheduler...');
    
    // Carregar todos os dispositivos ativos
    const devices = await this.deviceRepository.findAllActive();
    
    for (const device of devices) {
      this.scheduleDevice(device);
    }

    // Agendar limpeza de logs antigos (diariamente às 3h da manhã)
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupOldLogs();
    });

    console.log(`✅ Scheduled monitoring for ${devices.length} devices`);
  }

  scheduleDevice(device: Device): void {
    // Remover agendamento existente se houver
    this.unscheduleDevice(device.id);

    if (!device.isActive) return;

    // Converter intervalo em segundos para expressão cron
    const cronExpression = this.intervalToCron(device.checkInterval);
    
    const task = cron.schedule(cronExpression, async () => {
      await this.checkDevice(device);
    });

    this.scheduledTasks.set(device.id, task);
    console.log(`📅 Scheduled device "${device.name}" (${device.host}) every ${device.checkInterval}s`);
  }

  unscheduleDevice(deviceId: string): void {
    const task = this.scheduledTasks.get(deviceId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(deviceId);
    }
  }

  private async checkDevice(device: Device): Promise<void> {
    try {
      const log = await this.checkDeviceHealthUseCase.execute(device.id);
      
      if (!log) return;

      const previousStatus = this.devicePreviousStatus.get(device.id);
      const currentStatus = log.status;

      // Verificar se houve mudança de status para gerar alerta
      if (previousStatus && previousStatus !== currentStatus) {
        await this.handleStatusChange(device, previousStatus, currentStatus);
      }

      this.devicePreviousStatus.set(device.id, currentStatus);

      // Log para console
      const statusEmoji = currentStatus === 'online' ? '🟢' : currentStatus === 'offline' ? '🔴' : '🟡';
      console.log(`${statusEmoji} [${new Date().toISOString()}] ${device.name}: ${currentStatus} (${log.responseTime}ms)`);
    } catch (error) {
      console.error(`❌ Error checking device ${device.name}:`, error);
    }
  }

  private async handleStatusChange(
    device: Device,
    previousStatus: DeviceStatus,
    currentStatus: DeviceStatus
  ): Promise<void> {
    // Determinar tipo de alerta
    let alertType: 'down' | 'up' | 'warning';
    
    if (currentStatus === 'offline') {
      alertType = 'down';
    } else if (currentStatus === 'online' && previousStatus === 'offline') {
      alertType = 'up';
    } else if (currentStatus === 'warning') {
      alertType = 'warning';
    } else {
      return; // Sem alerta necessário
    }

    // Buscar informações do usuário para enviar notificação
    // Por enquanto, usar email/telefone do ambiente
    const recipientEmail = process.env.ALERT_EMAIL;
    const recipientPhone = process.env.ALERT_PHONE;

    if (!recipientEmail && !recipientPhone) {
      console.warn('⚠️ No alert recipients configured');
      return;
    }

    const channel = recipientEmail && recipientPhone ? 'both' : recipientEmail ? 'email' : 'sms';

    await this.sendAlertUseCase.execute({
      deviceId: device.id,
      deviceName: device.name,
      type: alertType,
      channel,
      recipientEmail,
      recipientPhone,
    });

    console.log(`🚨 Alert sent: ${device.name} is now ${currentStatus}`);
  }

  private intervalToCron(seconds: number): string {
    // Para intervalos comuns, criar expressões cron
    if (seconds < 60) {
      // A cada X segundos (cron não suporta diretamente, usar node-cron com segundos)
      return `*/${seconds} * * * * *`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `*/${minutes} * * * *`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `0 */${hours} * * *`;
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    // Remover logs com mais de 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedCount = await this.monitoringLogRepository.deleteOlderThan(thirtyDaysAgo);
    console.log(`🧹 Cleaned up ${deletedCount} old monitoring logs`);
  }

  stop(): void {
    for (const [deviceId, task] of this.scheduledTasks) {
      task.stop();
    }
    this.scheduledTasks.clear();
    console.log('⏹️ Monitoring scheduler stopped');
  }
}
