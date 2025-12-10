import { Device } from '../../../domain/entities/device';
import { MonitoringLog } from '../../../domain/entities/monitoring-log';
import { IDeviceRepository } from '../../../domain/repositories/device-repository';
import { IMonitoringLogRepository } from '../../../domain/repositories/monitoring-log-repository';

export interface CheckResult {
  status: 'online' | 'offline' | 'warning';
  responseTime?: number;
  errorMessage?: string;
}

export interface IHealthChecker {
  check(device: Device): Promise<CheckResult>;
}

export class CheckDeviceHealthUseCase {
  constructor(
    private deviceRepository: IDeviceRepository,
    private monitoringLogRepository: IMonitoringLogRepository,
    private healthChecker: IHealthChecker
  ) {}

  async execute(deviceId: string): Promise<MonitoringLog | null> {
    const device = await this.deviceRepository.findById(deviceId);

    if (!device || !device.isActive) {
      return null;
    }

    const result = await this.healthChecker.check(device);

    // Atualizar status do dispositivo
    device.updateStatus(result.status, result.responseTime);
    await this.deviceRepository.update(device);

    // Criar log de monitoramento
    const log = MonitoringLog.create(
      device.id,
      result.status,
      result.responseTime,
      result.errorMessage
    );

    await this.monitoringLogRepository.save(log);

    return log;
  }
}
