import { Request, Response, NextFunction } from 'express';
import { RecoveryStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';
import { analyzePaymentRecovery, AIAnalysisInput } from '../services/aiService.js';

export async function analyzeCase(req: Request, res: Response, next: NextFunction) {
  try {
    const caseId = (req.params.caseId as string) || '';

    // 1. Load recovery case with payment and customer
    const recoveryCase = await prisma.recoveryCase.findFirst({
      where: {
        OR: [{ id: caseId }, { caseId }],
      },
      include: {
        payment: {
          include: {
            customer: true,
          },
        },
        recoveryActions: true,
      },
    });

    if (!recoveryCase) {
      res.status(404).json({
        success: false,
        error: {
          message: `Recovery Case not found: ${caseId}`,
          statusCode: 404,
        },
      });
      return;
    }

    const payment = recoveryCase.payment;
    const customer = payment.customer;

    // 2. Prepare structured telemetry for AI
    const amountNum = new Decimal(payment.amount.toString()).toNumber();
    const aiInput: AIAnalysisInput = {
      amount: amountNum,
      currency: payment.currency,
      status: payment.status,
      failureReason: payment.failureReason,
      retryCount: payment.retryCount,
      paymentMethod: payment.paymentMethod,
      customerName: customer.name,
      customerEmail: customer.email,
      previousAttemptsCount: recoveryCase.recoveryActions.length,
      riskScore: recoveryCase.riskScore,
      riskLevel: recoveryCase.riskLevel,
      contactOptOut: customer.contactOptOut,
      simulateAiFailure: req.body?.simulateAiFailure === true,
    };

    // 3. Run AI Analysis (Gemini with safe fallback)
    const analysis = await analyzePaymentRecovery(aiInput);

    // 4. Store AI Analysis in DB and update case status
    const storedAnalysis = await prisma.aIAnalysis.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        diagnosis: analysis.diagnosis,
        recommendedAction: analysis.recommendedAction,
        reason: analysis.reason,
        confidence: analysis.confidence,
        expectedRecoveryProbability: analysis.expectedRecoveryProbability,
        provider: analysis.provider,
        model: analysis.model,
      },
    });

    // Update case status: If AI Service error, escalate; else if NEW, mark ANALYZED
    if (analysis.isAiServiceError) {
      await prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: { status: RecoveryStatus.ESCALATED },
      });

      await prisma.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'AI_SERVICE_ERROR',
          message: 'AI analysis unavailable. Automatic recovery was not attempted. Case escalated safely.',
          metadata: {
            analysisId: storedAnalysis.id,
            error: analysis.reason,
            actionTaken: 'HUMAN_ESCALATION',
          },
        },
      });
    } else if (recoveryCase.status === RecoveryStatus.NEW) {
      await prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: { status: RecoveryStatus.ANALYZED },
      });
    }

    // 5. Create structured Audit Log for the recommendation
    await prisma.auditLog.create({
      data: {
        paymentId: payment.id,
        recoveryCaseId: recoveryCase.id,
        eventType: analysis.isAiServiceError ? 'HUMAN_ESCALATION' : 'AI_ANALYSIS_CREATED',
        message: analysis.isAiServiceError
          ? 'AI unavailable; automatic safe escalation triggered.'
          : `AI recommended ${analysis.recommendedAction} with ${(analysis.confidence * 100).toFixed(0)}% confidence`,
        metadata: {
          analysisId: storedAnalysis.id,
          diagnosis: analysis.diagnosis,
          recommendedAction: analysis.recommendedAction,
          reason: analysis.reason,
          confidence: analysis.confidence,
          expectedRecoveryProbability: analysis.expectedRecoveryProbability,
          provider: analysis.provider,
          model: analysis.model,
          isFallback: analysis.isFallback,
        },
      },
    });

    res.status(200).json({
      success: true,
      caseId: recoveryCase.caseId,
      analysis: storedAnalysis,
    });
  } catch (error) {
    next(error);
  }
}
