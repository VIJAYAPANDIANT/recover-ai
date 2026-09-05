import { Router } from 'express';
import { analyzeCase } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/analyze/:caseId - AI Diagnosis and Recovery Recommendation
router.post('/analyze/:caseId', analyzeCase);

export default router;
