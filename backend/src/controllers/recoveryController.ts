import { Request, Response, NextFunction } from 'express';
import { RecoveryStatus, RiskLevel, RecoveryActionType, RecoveryActionStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { evaluatePolicy } from '../services/policyEngine.js';
import { executeRecoveryAction } from '../services/recoveryExecutor.js';
import { runRecoveryBatch } from '../services/batchRecoveryService.js';

export async function getRecoveryCases(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const { status, riskLevel, search } = req.query;

    const where: Prisma.RecoveryCaseWhereInput = {};

    if (status && Object.values(RecoveryStatus).includes(status as RecoveryStatus)) {
      where.status = status as RecoveryStatus;
    }

    if (riskLevel && Object.values(RiskLevel).includes(riskLevel as RiskLevel)) {
      where.riskLevel = riskLevel as RiskLevel;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { caseId: { contains: q, mode: 'insensitive' } },
        { payment: { paymentId: { contains: q, mode: 'insensitive' } } },
        { payment: { customer: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [total, cases] = await Promise.all([
      prisma.recoveryCase.count({ where }),
      prisma.recoveryCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            include: {
              customer: true,
            },
          },
          aiAnalyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          recoveryActions: {
            orderBy: { attemptNumber: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: cases,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryCaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = (req.params.id as string) || '';

    const recoveryCase = await prisma.recoveryCase.findFirst({
      where: {
        OR: [{ id }, { caseId: id }],
      },
      include: {
        payment: {
          include: {
            customer: true,
          },
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
        },
        recoveryActions: {
          orderBy: { attemptNumber: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!recoveryCase) {
      res.status(404).json({
        success: false,
        error: {
          message: `Recovery Case not found with identifier: ${id}`,
          statusCode: 404,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: recoveryCase,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/recovery/cases/:caseId/evaluate
 * Evaluates the case and latest AI recommendation against the PolicyEngine.
 */
export async function evaluateCasePolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const caseId = (req.params.caseId as string) || '';

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
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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

    const latestAnalysis = recoveryCase.aiAnalyses[0];
    const recommendedAction = latestAnalysis?.recommendedAction || RecoveryActionType.HUMAN_ESCALATION;
    const payment = recoveryCase.payment;

    const decision = evaluatePolicy({
      recommendedAction,
      paymentStatus: payment.status,
      failureReason: payment.failureReason,
      amount: payment.amount,
      retryCount: payment.retryCount,
      contactOptOut: payment.customer.contactOptOut,
    });

    // Record Audit Logs for Policy Decision
    await prisma.auditLog.create({
      data: {
        paymentId: payment.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'POLICY_EVALUATED',
        message: decision.allowed
          ? `Policy evaluated: Action ${decision.action} APPROVED.`
          : `Policy evaluated: Action ${decision.action} BLOCKED. Fallback: ${decision.fallbackAction}`,
        metadata: {
          allowed: decision.allowed,
          action: decision.action,
          fallbackAction: decision.fallbackAction,
          reason: decision.reason,
          ruleTriggered: decision.ruleTriggered,
          originalRecommendation: recommendedAction,
        },
      },
    });

    if (!decision.allowed) {
      await prisma.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'ACTION_BLOCKED',
          message: `Recovery action ${decision.action} was blocked by policy: ${decision.reason}`,
          metadata: {
            blockedAction: decision.action,
            fallbackAction: decision.fallbackAction,
            reason: decision.reason,
            ruleTriggered: decision.ruleTriggered,
          },
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'ACTION_APPROVED',
          message: `Recovery action ${decision.action} was approved by policy.`,
          metadata: {
            approvedAction: decision.action,
            reason: decision.reason,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      caseId: recoveryCase.caseId,
      decision,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/recovery/cases/:caseId/execute
 * Executes strictly policy-approved recovery action via RecoveryExecutor.
 */
export async function executeCaseAction(req: Request, res: Response, next: NextFunction) {
  try {
    const caseId = (req.params.caseId as string) || '';
    const { simulateFailure } = req.body || {};

    const recoveryCase = await prisma.recoveryCase.findFirst({
      where: {
        OR: [{ id: caseId }, { caseId }],
      },
      include: {
        payment: {
          include: { customer: true },
        },
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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

    const latestAnalysis = recoveryCase.aiAnalyses[0];
    const recommendedAction = latestAnalysis?.recommendedAction || RecoveryActionType.HUMAN_ESCALATION;
    const payment = recoveryCase.payment;

    // 1. Validate against Policy Engine
    const policyDecision = evaluatePolicy({
      recommendedAction,
      paymentStatus: payment.status,
      failureReason: payment.failureReason,
      amount: payment.amount,
      retryCount: payment.retryCount,
      contactOptOut: payment.customer.contactOptOut,
    });

    if (!policyDecision.allowed) {
      res.status(400).json({
        success: false,
        error: {
          message: `Cannot execute recovery action. Policy blocked: ${policyDecision.reason}`,
          policyDecision,
        },
      });
      return;
    }

    // 2. Execute bounded recovery action
    const executionResult = await executeRecoveryAction(recoveryCase.id, policyDecision, {
      simulateFailure: !!simulateFailure,
    });

    if (!executionResult.success && executionResult.message.includes('already')) {
      res.status(409).json({
        success: false,
        message: executionResult.message,
        result: executionResult,
      });
      return;
    }

    res.status(200).json({
      success: true,
      caseId: recoveryCase.caseId,
      result: executionResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function runBatchRecoveryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.body?.limit as string) || 50;
    const includeEscalated = req.body?.includeEscalated === true;
    const simulateFailure = req.body?.simulateFailure === true;

    const result = await runRecoveryBatch({ limit, includeEscalated, simulateFailure });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
