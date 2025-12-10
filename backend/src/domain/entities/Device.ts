import { v4 as uuidv4 } from 'uuid';

export type DeviceType = 'server' | 'router' | 'switch' | 'api' | 'domain' | 'port' | 'service';
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'unknown';
export type CheckType = 'ping' | 'http' | 'https' | 'tcp' | 'dns';

export interface DeviceProps {
  id?: string;
  name: string;
  type: DeviceType;
  host: string;
  port?: number;
  checkType: CheckType;
  checkInterval: number; // em segundos
  timeout: number; // em milissegundos
  status: DeviceStatus;
  lastCheck?: Date;
  lastResponseTime?: number; // em milissegundos
  isActive: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}




export class Device {
  public readonly id: string;
  public name: string;
  public type: DeviceType;
  public host: string;
  public port?: number;
  public checkType: CheckType;
  public checkInterval: number;
  public timeout: number;
  public status: DeviceStatus;
  public lastCheck?: Date;
  public lastResponseTime?: number;
  public isActive: boolean;
  public userId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: DeviceProps) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.type = props.type;
    this.host = props.host;
    this.port = props.port;
    this.checkType = props.checkType;
    this.checkInterval = props.checkInterval;
    this.timeout = props.timeout;
    this.status = props.status;
    this.lastCheck = props.lastCheck;
    this.lastResponseTime = props.lastResponseTime;
    this.isActive = props.isActive;
    this.userId = props.userId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(props: Omit<DeviceProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Device {
    return new Device({
      ...props,
      status: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateStatus(status: DeviceStatus, responseTime?: number): void {
    this.status = status;
    this.lastCheck = new Date();
    this.lastResponseTime = responseTime;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      host: this.host,
      port: this.port,
      checkType: this.checkType,
      checkInterval: this.checkInterval,
      timeout: this.timeout,
      status: this.status,
      lastCheck: this.lastCheck,
      lastResponseTime: this.lastResponseTime,
      isActive: this.isActive,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
