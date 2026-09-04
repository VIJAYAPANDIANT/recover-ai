import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';

const router = Router();

// GET /api/audit-logs
router.get('/', getAuditLogs);

export default router;
