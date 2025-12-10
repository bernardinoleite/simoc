import { Device } from '../../../domain/entities/device';
import { IDeviceRepository } from '../../../domain/repositories/device-repository';
import { CreateDeviceDTO, DeviceResponseDTO } from '../../dtos/DeviceDTO';

export class CreateDeviceUseCase {
  constructor(private deviceRepository: IDeviceRepository) {}

  async execute(data: CreateDeviceDTO): Promise<DeviceResponseDTO> {
    const device = Device.create({
      name: data.name,
      type: data.type,
      host: data.host,
      port: data.port,
      checkType: data.checkType,
      checkInterval: data.checkInterval || 60,
      timeout: data.timeout || 5000,
      isActive: true,
      userId: data.userId,
    });

    const savedDevice = await this.deviceRepository.save(device);
    return savedDevice.toJSON();
  }
}
