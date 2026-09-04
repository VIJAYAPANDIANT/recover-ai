import { Router } from 'express';
import {
  seedPayments,
  getPayments,
  getPaymentById,
  getFailedPayments,
} from '../controllers/paymentController.js';

const router = Router();

// POST /api/payments/seed - Generate/reset demo dataset
router.post('/seed', seedPayments);

// GET /api/payments/failed - Non-successful payments
router.get('/failed', getFailedPayments);

// GET /api/payments - Paginated & filtered payments
router.get('/', getPayments);

// GET /api/payments/:id - Payment details
router.get('/:id', getPaymentById);

export default router;
