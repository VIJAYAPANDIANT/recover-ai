import { Router, Request, Response } from 'express';
import paymentRoutes from './paymentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import recoveryRoutes from './recoveryRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'RecoverAI API',
    timestamp: new Date().toISOString(),
  });
});

// Module Routes
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/recovery', recoveryRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
