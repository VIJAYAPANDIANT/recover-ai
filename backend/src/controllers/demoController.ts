import { Request, Response, NextFunction } from 'express';
import { seedDemoDataset } from '../services/seedService.js';

export async function resetDemoEnvironment(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await seedDemoDataset();
    res.status(200).json({
      success: true,
      message: 'Demo environment reset successfully',
      payments: result.payments,
    });
  } catch (error) {
    next(error);
  }
}
