import { Router } from 'express';
import { getMetrics } from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/metrics
router.get('/metrics', getMetrics);

export default router;
