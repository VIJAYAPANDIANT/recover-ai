import { RecoveryStatus, RecoveryActionType, RecoveryActionStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';
import { analyzePaymentRecovery, AIAnalysisInput } from './aiService.js';
import { evaluatePolicy } from './policyEngine.js';
import { executeRecoveryAction } from './recoveryExecutor.js';

export interface BatchRecoveryOptions {
  limit?: number;
  includeEscalated?: boolean;
  simulateFailure?: boolean;
}

export interface BatchRecoveryCaseSummary {
  caseId: string;
  action: RecoveryActionType;
  actionStatus: RecoveryActionStatus;
  policyAllowed: boolean;
  amount: number;
}

export interface BatchRecoveryResult {
  processed: number;
  approved: number;
  blocked: number;
  escalated: number;
  successful: number;
  failed: number;
  revenueRecovered: number;
  revenueAttempted: number;
  cases: BatchRecoveryCaseSummary[];
}

/**
 * Executes a controlled recovery experiment across a batch of eligible recovery cases.
 * Sequentially analyzes telemetry, validates safety rules, executes bounded actions,
 * and compiles exact financial recovery totals.
 */
export async function runRecoveryBatch(
  options: BatchRecoveryOptions = {}
): Promise<BatchRecoveryResult> {
  const limit = Math.min(100, Math.max(1, options.limit || 50));

  // 1. Fetch eligible recovery cases (exclude already RECOVERED or ESCALATED unless requested)
  const excludedStatuses: RecoveryStatus[] = [RecoveryStatus.RECOVERED];
  if (!options.includeEscalated) {
    excludedStatuses.push(RecoveryStatus.ESCALATED);
  }

  const eligibleCases = await prisma.recoveryCase.findMany({
    where: {
      status: {
        notIn: excludedStatuses,
      },
      payment: {
        status: {
          not: 'SUCCESS',
        },
      },
    },
    take: limit,
    orderBy: [
      { riskScore: 'desc' },
      { createdAt: 'desc' },
    ],
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
  });

  let processed = 0;
  let approved = 0;
  let blocked = 0;
  let escalated = 0;
  let successful = 0;
  let failed = 0;
  let decRevenueRecovered = new Decimal(0);
  let decRevenueAttempted = new Decimal(0);
  const caseSummaries: BatchRecoveryCaseSummary[] = [];

  for (const rCase of eligibleCases) {
    processed++;
    const payment = rCase.payment;
    const paymentAmountDec = new Decimal(payment.amount.toString());

    try {
      // 2. Obtain AI recommendation (reuse recent analysis if exists, or generate new)
      let recommendedAction: RecoveryActionType;

      if (rCase.aiAnalyses && rCase.aiAnalyses.length > 0) {
        recommendedAction = rCase.aiAnalyses[0].recommendedAction;
      } else {
        const aiInput: AIAnalysisInput = {
          amount: paymentAmountDec.toNumber(),
          currency: payment.currency,
          status: payment.status,
          failureReason: payment.failureReason,
          retryCount: payment.retryCount,
          paymentMethod: payment.paymentMethod,
          customerName: payment.customer.name,
          customerEmail: payment.customer.email,
          previousAttemptsCount: rCase.recoveryActions.length,
          riskScore: rCase.riskScore,
          riskLevel: rCase.riskLevel,
          contactOptOut: payment.customer.contactOptOut,
        };

        const analysis = await analyzePaymentRecovery(aiInput);
        recommendedAction = analysis.recommendedAction;

        await prisma.aIAnalysis.create({
          data: {
            recoveryCaseId: rCase.id,
            diagnosis: analysis.diagnosis,
            recommendedAction: analysis.recommendedAction,
            reason: analysis.reason,
            confidence: analysis.confidence,
            expectedRecoveryProbability: analysis.expectedRecoveryProbability,
            provider: analysis.provider,
            model: analysis.model,
          },
        });
      }

      // 3. Evaluate Policy Engine rules
      const policyDecision = evaluatePolicy({
        recommendedAction,
        paymentStatus: payment.status,
        failureReason: payment.failureReason,
        amount: payment.amount,
        retryCount: payment.retryCount,
        contactOptOut: payment.customer.contactOptOut,
      });

      if (!policyDecision.allowed) {
        blocked++;
        if (policyDecision.fallbackAction === RecoveryActionType.HUMAN_ESCALATION) {
          escalated++;
        }

        caseSummaries.push({
          caseId: rCase.caseId,
          action: recommendedAction,
          actionStatus: RecoveryActionStatus.PENDING,
          policyAllowed: false,
          amount: paymentAmountDec.toNumber(),
        });
        continue;
      }

      approved++;
      if (policyDecision.action === RecoveryActionType.HUMAN_ESCALATION) {
        escalated++;
      }

      // 4. Bounded Recovery Execution
      decRevenueAttempted = decRevenueAttempted.plus(paymentAmountDec);

      const execResult = await executeRecoveryAction(rCase.id, policyDecision, {
        simulateFailure: options.simulateFailure,
      });

      if (execResult.actionStatus === RecoveryActionStatus.SUCCESS) {
        successful++;
        decRevenueRecovered = decRevenueRecovered.plus(paymentAmountDec);
      } else if (execResult.actionStatus === RecoveryActionStatus.FAILED) {
        failed++;
      }

      if (execResult.escalatedToHuman && policyDecision.action !== RecoveryActionType.HUMAN_ESCALATION) {
        escalated++;
      }

      caseSummaries.push({
        caseId: rCase.caseId,
        action: execResult.actionType,
        actionStatus: execResult.actionStatus,
        policyAllowed: true,
        amount: paymentAmountDec.toNumber(),
      });
    } catch (err: any) {
      console.error(`[BatchRecovery] Error processing case ${rCase.caseId}:`, err.message);
      failed++;
    }
  }

  // 5. Create immutable audit record for the batch experiment
  await prisma.auditLog.create({
    data: {
      eventType: 'BATCH_RECOVERY_COMPLETED',
      message: `Batch recovery processed ${processed} cases: ${successful} recovered (₹${decRevenueRecovered.toNumber().toLocaleString('en-IN')}), ${failed} failed, ${blocked} blocked, ${escalated} escalated`,
      metadata: {
        processed,
        approved,
        blocked,
        escalated,
        successful,
        failed,
        revenueAttempted: decRevenueAttempted.toNumber(),
        revenueRecovered: decRevenueRecovered.toNumber(),
        recoveryRate: decRevenueAttempted.isZero()
          ? 0
          : Number(decRevenueRecovered.dividedBy(decRevenueAttempted).times(100).toFixed(1)),
      },
    },
  });

  return {
    processed,
    approved,
    blocked,
    escalated,
    successful,
    failed,
    revenueRecovered: decRevenueRecovered.toNumber(),
    revenueAttempted: decRevenueAttempted.toNumber(),
    cases: caseSummaries,
  };
}
