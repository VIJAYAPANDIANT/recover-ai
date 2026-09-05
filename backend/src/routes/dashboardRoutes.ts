import { Router } from 'express';
import {
  getMetrics,
  getRecoveryPerformanceHandler,
  getStrategyPerformanceHandler,
  getFailureAnalysisHandler,
  getRiskAnalysisHandler,
} from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/metrics
router.get('/metrics', getMetrics);

// GET /api/dashboard/recovery-performance
router.get('/recovery-performance', getRecoveryPerformanceHandler);

// GET /api/dashboard/strategy-performance
router.get('/strategy-performance', getStrategyPerformanceHandler);

// GET /api/dashboard/failure-analysis
router.get('/failure-analysis', getFailureAnalysisHandler);

// GET /api/dashboard/risk-analysis
router.get('/risk-analysis', getRiskAnalysisHandler);

export default router;
