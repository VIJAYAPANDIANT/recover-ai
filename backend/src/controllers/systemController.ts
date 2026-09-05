import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { getPaymentExecutor } from '../services/paymentExecutor.js';

export async function getSystemStatus(_req: Request, res: Response) {
  let dbStatus = 'Disconnected';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'Connected';
  } catch (err: any) {
    dbStatus = 'Error';
  }

  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'
  );

  const aiStatus = process.env.AI_FAILURE_MODE === 'true'
    ? 'Unavailable'
    : hasGeminiKey
    ? 'Connected'
    : 'Fallback Active';

  const aiProvider = hasGeminiKey && process.env.AI_FAILURE_MODE !== 'true'
    ? 'Google Gemini 2.5 Flash'
    : 'Deterministic Rule Engine (Fallback)';

  const executor = getPaymentExecutor();
  const paymentMode = executor.mode; // 'SIMULATION' or 'RAZORPAY_TEST'

  res.status(200).json({
    success: true,
    data: {
      services: {
        database: {
          name: 'PostgreSQL',
          status: dbStatus,
          latencyMs: dbLatencyMs,
          connected: dbStatus === 'Connected',
        },
        aiService: {
          name: 'AI Diagnostic Engine',
          provider: aiProvider,
          status: aiStatus,
          connected: aiStatus === 'Connected' || aiStatus === 'Fallback Active',
          isNativeGemini: hasGeminiKey,
        },
        paymentMode: {
          name: 'Payment Execution Rails',
          mode: paymentMode,
          status: 'Active',
          isSimulation: paymentMode === 'SIMULATION',
          demoMode: process.env.DEMO_MODE !== 'false',
        },
        policyEngine: {
          name: 'Safety & Business Policy Engine',
          status: 'Active',
          rulesEnforced: 5,
          active: true,
        },
      },
      timestamp: new Date().toISOString(),
    },
  });
}
