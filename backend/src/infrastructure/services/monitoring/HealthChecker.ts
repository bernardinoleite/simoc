import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import https from 'https';
import net from 'net';
import dns from 'dns';
import { Device } from '../../../domain/entities/device';
import { CheckResult, IHealthChecker } from '../../../application/use-cases/monitoring/CheckDeviceHealthUseCase';

const execAsync = promisify(exec);
const dnsLookup = promisify(dns.lookup);

export class HealthChecker implements IHealthChecker {
  async check(device: Device): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      switch (device.checkType) {
        case 'ping':
          return await this.pingCheck(device, startTime);
        case 'http':
        case 'https':
          return await this.httpCheck(device, startTime);
        case 'tcp':
          return await this.tcpCheck(device, startTime);
        case 'dns':
          return await this.dnsCheck(device, startTime);
        default:
          return {
            status: 'offline',
            errorMessage: `Unknown check type: ${device.checkType}`,
          };
      }
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
      };
    }
  }

  private async pingCheck(device: Device, startTime: number): Promise<CheckResult> {
    try {
      // Usar ping do sistema operacional
      const command = process.platform === 'win32'
        ? `ping -n 1 -w ${device.timeout} ${device.host}`
        : `ping -c 1 -W ${Math.ceil(device.timeout / 1000)} ${device.host}`;

      await execAsync(command);
      
      return {
        status: 'online',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorMessage: 'Ping failed - host unreachable',
      };
    }
  }

  private async httpCheck(device: Device, startTime: number): Promise<CheckResult> {
    return new Promise((resolve) => {
      const protocol = device.checkType === 'https' ? https : http;
      const port = device.port || (device.checkType === 'https' ? 443 : 80);
      const url = `${device.checkType}://${device.host}:${port}`;

      const request = protocol.get(url, { timeout: device.timeout }, (res) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode || 0;

        if (statusCode >= 200 && statusCode < 400) {
          resolve({
            status: 'online',
            responseTime,
          });
        } else if (statusCode >= 400 && statusCode < 500) {
          resolve({
            status: 'warning',
            responseTime,
            errorMessage: `HTTP ${statusCode}`,
          });
        } else {
          resolve({
            status: 'offline',
            responseTime,
            errorMessage: `HTTP ${statusCode}`,
          });
        }
      });

      request.on('error', (error) => {
        resolve({
          status: 'offline',
          responseTime: Date.now() - startTime,
          errorMessage: error.message,
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({
          status: 'offline',
          responseTime: device.timeout,
          errorMessage: 'Request timeout',
        });
      });
    });
  }

  private async tcpCheck(device: Device, startTime: number): Promise<CheckResult> {
    return new Promise((resolve) => {
      const port = device.port || 80;
      const socket = new net.Socket();

      socket.setTimeout(device.timeout);

      socket.connect(port, device.host, () => {
        const responseTime = Date.now() - startTime;
        socket.destroy();
        resolve({
          status: 'online',
          responseTime,
        });
      });

      socket.on('error', (error) => {
        socket.destroy();
        resolve({
          status: 'offline',
          responseTime: Date.now() - startTime,
          errorMessage: error.message,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          status: 'offline',
          responseTime: device.timeout,
          errorMessage: 'Connection timeout',
        });
      });
    });
  }

  private async dnsCheck(device: Device, startTime: number): Promise<CheckResult> {
    try {
      await dnsLookup(device.host);
      
      return {
        status: 'online',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorMessage: `DNS lookup failed: ${(error as Error).message}`,
      };
    }
  }
}
