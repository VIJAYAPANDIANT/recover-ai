import { Router } from 'express';
import {
  getRecoveryCases,
  getRecoveryCaseById,
  evaluateCasePolicy,
  executeCaseAction,
} from '../controllers/recoveryController.js';

const router = Router();

// GET /api/recovery/cases - Paginated recovery cases
router.get('/cases', getRecoveryCases);

// GET /api/recovery/cases/:id - Recovery case details
router.get('/cases/:id', getRecoveryCaseById);

// POST /api/recovery/cases/:caseId/evaluate - Policy evaluation
router.post('/cases/:caseId/evaluate', evaluateCasePolicy);

// POST /api/recovery/cases/:caseId/execute - Bounded action execution
router.post('/cases/:caseId/execute', executeCaseAction);

export default router;
