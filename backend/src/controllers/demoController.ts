import { Request, Response, NextFunction } from 'express';
import { seedDemoDataset } from '../services/seedService.js';
import { getDashboardMetrics } from '../services/metricsService.js';

export async function resetDemoEnvironment(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await seedDemoDataset();
    const metrics = await getDashboardMetrics();

    res.status(200).json({
      success: true,
      isDemo: true,
      environment: 'DEMO_SANDBOX',
      message: 'Demo environment reset successfully. Pristine dataset with 500 payments restored.',
      payments: result.payments,
      metrics,
    });
  } catch (error) {
    next(error);
  }
}
