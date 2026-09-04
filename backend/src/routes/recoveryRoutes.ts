import { Router } from 'express';
import {
  getRecoveryCases,
  getRecoveryCaseById,
} from '../controllers/recoveryController.js';

const router = Router();

// GET /api/recovery/cases - Paginated recovery cases
router.get('/cases', getRecoveryCases);

// GET /api/recovery/cases/:id - Recovery case details
router.get('/cases/:id', getRecoveryCaseById);

export default router;
