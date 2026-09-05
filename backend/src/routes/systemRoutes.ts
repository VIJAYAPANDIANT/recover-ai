import { Router } from 'express';
import { getSystemStatus } from '../controllers/systemController.js';

const router = Router();

// GET /api/system/status
router.get('/status', getSystemStatus);

export default router;
