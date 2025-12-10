import express, { Application } from 'express';
import cors from 'cors';

// Infrastructure - Prisma Repositories
import { PrismaDeviceRepository } from './infrastructure/repositories/PrismaDeviceRepository';
import { PrismaMonitoringLogRepository } from './infrastructure/repositories/PrismaMonitoringLogRepository';
import { PrismaAlertRepository } from './infrastructure/repositories/PrismaAlertRepository';
import { NotificationService } from './infrastructure/services/notifications/NotificationService';
import { HealthChecker } from './infrastructure/services/monitoring/HealthChecker';
import { MonitoringScheduler } from './infrastructure/services/monitoring/MonitoringScheduler';
import prisma from './infrastructure/database/prisma';

// Use Cases - Device
import { CreateDeviceUseCase } from './application/use-cases/device/CreateDeviceUseCase';
import { ListDevicesUseCase } from './application/use-cases/device/ListDevicesUseCase';
import { UpdateDeviceUseCase } from './application/use-cases/device/UpdateDeviceUseCase';
import { DeleteDeviceUseCase } from './application/use-cases/device/DeleteDeviceUseCase';

// Use Cases - Monitoring
import { CheckDeviceHealthUseCase } from './application/use-cases/monitoring/CheckDeviceHealthUseCase';
import { GetDashboardStatsUseCase } from './application/use-cases/monitoring/GetDashboardStatsUseCase';
import { GetDeviceLogsUseCase } from './application/use-cases/monitoring/GetDeviceLogsUseCase';

// Use Cases - Alert
import { SendAlertUseCase } from './application/use-cases/alert/SendAlertUseCase';
import { ListAlertsUseCase } from './application/use-cases/alert/ListAlertsUseCase';

// Controllers
import { DeviceController } from './interfaces/controllers/DeviceController';
import { MonitoringController } from './interfaces/controllers/MonitoringController';
import { AlertController } from './interfaces/controllers/AlertController';

// Routes
import { DeviceRoutes } from './interfaces/routes/DeviceRoutes';
import { MonitoringRoutes } from './interfaces/routes/MonitoringRoutes';
import { AlertRoutes } from './interfaces/routes/AlertRoutes';

// Middlewares
import { errorMiddleware, notFoundMiddleware } from './interfaces/middlewares/errorMiddleware';

class App {
  public app: Application;
  private port: number;
  private monitoringScheduler?: MonitoringScheduler;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Repositories (Prisma)
    const deviceRepository = new PrismaDeviceRepository();
    const monitoringLogRepository = new PrismaMonitoringLogRepository();
    const alertRepository = new PrismaAlertRepository();

    // Services
    const notificationService = new NotificationService();
    const healthChecker = new HealthChecker();

    // Use Cases - Device
    const createDeviceUseCase = new CreateDeviceUseCase(deviceRepository);
    const listDevicesUseCase = new ListDevicesUseCase(deviceRepository);
    const updateDeviceUseCase = new UpdateDeviceUseCase(deviceRepository);
    const deleteDeviceUseCase = new DeleteDeviceUseCase(deviceRepository);

    // Use Cases - Monitoring
    const checkDeviceHealthUseCase = new CheckDeviceHealthUseCase(
      deviceRepository,
      monitoringLogRepository,
      healthChecker
    );
    const getDashboardStatsUseCase = new GetDashboardStatsUseCase(
      deviceRepository,
      monitoringLogRepository,
      alertRepository
    );
    const getDeviceLogsUseCase = new GetDeviceLogsUseCase(monitoringLogRepository);

    // Use Cases - Alert
    const sendAlertUseCase = new SendAlertUseCase(alertRepository, notificationService);
    const listAlertsUseCase = new ListAlertsUseCase(alertRepository);

    // Controllers
    const deviceController = new DeviceController(
      createDeviceUseCase,
      listDevicesUseCase,
      updateDeviceUseCase,
      deleteDeviceUseCase,
      checkDeviceHealthUseCase
    );
    const monitoringController = new MonitoringController(
      getDashboardStatsUseCase,
      getDeviceLogsUseCase
    );
    const alertController = new AlertController(sendAlertUseCase, listAlertsUseCase);

    // Routes
    const deviceRoutes = new DeviceRoutes(deviceController);
    const monitoringRoutes = new MonitoringRoutes(monitoringController);
    const alertRoutes = new AlertRoutes(alertController);

    // API Routes
    this.app.use('/api/devices', deviceRoutes.router);
    this.app.use('/api/monitoring', monitoringRoutes.router);
    this.app.use('/api/alerts', alertRoutes.router);

    // Health check
    // Initialize Monitoring Scheduler
    this.monitoringScheduler = new MonitoringScheduler(
      deviceRepository,
      monitoringLogRepository,
      alertRepository,
      notificationService
    );
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      await prisma.$connect();
      
      // Start monitoring scheduler
      await this.monitoringScheduler?.start();
    } catch (error) {
      console.warn('Could not start monitoring scheduler:', (error as Error).message);
    }

    this.app.listen(this.port, () => {
      console.log(`🚀 Server is running on http://localhost:${this.port}`);
    });
  }

  public async stop(): Promise<void> {
    this.monitoringScheduler?.stop();
    await prisma.$disconnect();
  }
}

const server = new App(parseInt(process.env.PORT || '3000'));
server.start();

export default App;
