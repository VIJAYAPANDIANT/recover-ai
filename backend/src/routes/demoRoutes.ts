import { Router } from 'express';
import { resetDemoEnvironment } from '../controllers/demoController.js';

const router = Router();

// POST /api/demo/reset
router.post('/reset', resetDemoEnvironment);

export default router;
