import { Request, Response, NextFunction } from 'express';
import { getDashboardMetrics } from '../services/metricsService.js';

export async function getMetrics(_req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}
