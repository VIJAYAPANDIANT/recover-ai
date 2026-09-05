import { Request, Response, NextFunction } from 'express';
import {
  getDashboardMetrics,
  getStrategyPerformance,
  getFailureReasonAnalysis,
  getRiskAnalysis,
} from '../services/metricsService.js';

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

export async function getRecoveryPerformanceHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: {
        revenueAtRisk: metrics.revenueAtRiskNumeric,
        revenueAttempted: metrics.revenueAttemptedNumeric,
        revenueRecovered: metrics.revenueRecoveredNumeric,
        revenueNotRecovered: metrics.revenueNotRecoveredNumeric,
        recoveryRate: metrics.recoveryRate,
        recoveryPerformance: metrics.recoveryPerformance,
        funnel: metrics.funnel,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStrategyPerformanceHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const strategies = await getStrategyPerformance();
    res.status(200).json({
      success: true,
      data: strategies,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFailureAnalysisHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const analysis = await getFailureReasonAnalysis();
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRiskAnalysisHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const riskAnalysis = await getRiskAnalysis();
    res.status(200).json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error) {
    next(error);
  }
}
