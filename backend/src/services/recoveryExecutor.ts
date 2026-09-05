import {
  RecoveryActionType,
  RecoveryActionStatus,
  PaymentStatus,
  FailureReason,
  RecoveryStatus,
} from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';
import { PolicyDecision } from './policyEngine.js';
import { getPaymentExecutor, ExecuteActionParams } from './paymentExecutor.js';

export interface ExecutionOptions {
  simulateFailure?: boolean;
  manualTrigger?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  actionType: RecoveryActionType;
  actionStatus: RecoveryActionStatus;
  caseStatus: RecoveryStatus;
  amountRecovered: string;
  amountRecoveredNumeric: number;
  message: string;
  stoppingRuleTriggered?: boolean;
  escalatedToHuman?: boolean;
  auditLogId?: string;
  actionId?: string;
}

/**
 * Bounded Recovery Executor
 * Strictly enforces policy decisions, idempotency, stopping rules, and delegates
 * execution to the active PaymentExecutor (Simulation or Razorpay Test).
 */
export async function executeRecoveryAction(
  recoveryCaseId: string,
  policyDecision: PolicyDecision,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  // 1. Guard: Reject if policy explicitly blocked the action
  if (!policyDecision.allowed) {
    throw new Error(
      `Cannot execute blocked action (${policyDecision.action}). Reason: ${policyDecision.reason}`
    );
  }

  const actionToExecute = policyDecision.action;
  const paymentExecutor = getPaymentExecutor();

  return await prisma.$transaction(async (tx) => {
    // 2. Fetch RecoveryCase, associated Payment, and prior actions
    const recoveryCase = await tx.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      include: {
        payment: {
          include: { customer: true },
        },
        recoveryActions: {
          orderBy: { attemptNumber: 'desc' },
        },
      },
    });

    if (!recoveryCase) {
      throw new Error(`Recovery case not found: ${recoveryCaseId}`);
    }

    const payment = recoveryCase.payment;
    const paymentAmountDecimal = new Decimal(payment.amount.toString());

    // 3. IDEMPOTENCY SAFETY GUARDS
    // Guard A: Case is already recovered
    if (recoveryCase.status === RecoveryStatus.RECOVERED) {
      return {
        success: false,
        actionType: actionToExecute,
        actionStatus: RecoveryActionStatus.SUCCESS,
        caseStatus: RecoveryStatus.RECOVERED,
        amountRecovered: '0.00',
        amountRecoveredNumeric: 0,
        message: 'Recovery action has already been executed. Case is already recovered.',
      };
    }

    // Guard B: Payment is already marked as SUCCESS
    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        success: false,
        actionType: actionToExecute,
        actionStatus: RecoveryActionStatus.SUCCESS,
        caseStatus: recoveryCase.status,
        amountRecovered: '0.00',
        amountRecoveredNumeric: 0,
        message: 'Payment is already marked as SUCCESS.',
      };
    }

    // Guard C: Check for duplicate identical action already in progress or completed
    const existingSuccessfulAction = recoveryCase.recoveryActions.find(
      (a) => a.actionType === actionToExecute && a.status === RecoveryActionStatus.SUCCESS
    );
    if (existingSuccessfulAction) {
      return {
        success: false,
        actionType: actionToExecute,
        actionStatus: RecoveryActionStatus.SUCCESS,
        caseStatus: recoveryCase.status,
        amountRecovered: '0.00',
        amountRecoveredNumeric: 0,
        message: 'Recovery action has already been executed.',
        actionId: existingSuccessfulAction.id,
      };
    }

    const priorAttempts = recoveryCase.recoveryActions.length;
    const currentAttempt = (recoveryCase.recoveryActions[0]?.attemptNumber || 0) + 1;

    // 4. Record RECOVERY_STARTED audit log
    await tx.auditLog.create({
      data: {
        paymentId: payment.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'RECOVERY_STARTED',
        message: `Recovery execution initiated for action: ${actionToExecute} (Attempt #${currentAttempt}) [Mode: ${paymentExecutor.mode}]`,
        metadata: {
          actionType: actionToExecute,
          attemptNumber: currentAttempt,
          amount: paymentAmountDecimal.toNumber(),
          policyReason: policyDecision.reason,
          executorMode: paymentExecutor.mode,
          simulatedFailure: !!options.simulateFailure,
        },
      },
    });

    // If this is a re-attempt, also record RECOVERY_RETRY event
    if (priorAttempts > 0) {
      await tx.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RECOVERY_RETRY',
          message: `Re-attempting recovery for payment ${payment.paymentId} (Attempt #${currentAttempt})`,
          metadata: {
            attemptNumber: currentAttempt,
            priorAttempts,
          },
        },
      });
    }

    // 5. Delegate execution to PaymentExecutor
    const execParams: ExecuteActionParams = {
      actionType: actionToExecute,
      paymentId: payment.paymentId,
      amount: paymentAmountDecimal.toNumber(),
      currency: payment.currency,
      customerName: payment.customer.name,
      customerEmail: payment.customer.email,
      customerPhone: payment.customer.phone,
      failureReason: payment.failureReason,
      attemptNumber: currentAttempt,
      simulateFailure: options.simulateFailure,
    };

    const execOutcome = await paymentExecutor.executeAction(execParams);

    // 6. Handle Execution Outcome
    if (execOutcome.status === RecoveryActionStatus.SUCCESS) {
      // Create successful RecoveryAction record
      const actionRecord = await tx.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          actionType: actionToExecute,
          status: RecoveryActionStatus.SUCCESS,
          reason: execOutcome.reason,
          attemptNumber: currentAttempt,
          amount: paymentAmountDecimal,
          executedAt: new Date(),
          metadata: execOutcome.metadata,
        },
      });

      // Successful recovery marks payment as SUCCESS and case as RECOVERED
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          failureReason: FailureReason.NONE,
          updatedAt: new Date(),
        },
      });

      await tx.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: RecoveryStatus.RECOVERED,
          updatedAt: new Date(),
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RECOVERY_SUCCESS',
          message: `Payment ${payment.paymentId} recovered successfully for ₹${paymentAmountDecimal.toNumber().toLocaleString('en-IN')}`,
          metadata: {
            actionId: actionRecord.id,
            actionType: actionToExecute,
            amountRecovered: paymentAmountDecimal.toNumber(),
            executorMode: paymentExecutor.mode,
            ...execOutcome.metadata,
          },
        },
      });

      return {
        success: true,
        actionType: actionToExecute,
        actionStatus: RecoveryActionStatus.SUCCESS,
        caseStatus: RecoveryStatus.RECOVERED,
        amountRecovered: paymentAmountDecimal.toFixed(2),
        amountRecoveredNumeric: paymentAmountDecimal.toNumber(),
        message: `Recovery action completed. ₹${paymentAmountDecimal.toNumber().toLocaleString('en-IN')} recovered successfully!`,
        actionId: actionRecord.id,
        auditLogId: audit.id,
      };
    } else if (execOutcome.status === RecoveryActionStatus.FAILED) {
      // Increment retry count on Payment
      const newRetryCount = payment.retryCount + 1;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          retryCount: newRetryCount,
          updatedAt: new Date(),
        },
      });

      // STOPPING RULE EVALUATION:
      // If total attempts >= 2 OR newRetryCount >= 3 OR options.simulateFailure === true
      const shouldStopAndEscalate = currentAttempt >= 2 || newRetryCount >= 3 || options.simulateFailure === true;

      // Create failed recoveryAction record
      const actionRecord = await tx.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          actionType: actionToExecute,
          status: RecoveryActionStatus.FAILED,
          reason: execOutcome.reason,
          attemptNumber: currentAttempt,
          amount: paymentAmountDecimal,
          executedAt: new Date(),
          metadata: {
            ...execOutcome.metadata,
            retryCount: newRetryCount,
            stoppingRuleTriggered: shouldStopAndEscalate,
          },
        },
      });

      // Audit RECOVERY_FAILED
      await tx.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'RECOVERY_FAILED',
          message: `Recovery attempt #${currentAttempt} failed for payment ${payment.paymentId}. ${execOutcome.reason}`,
          metadata: {
            actionId: actionRecord.id,
            actionType: actionToExecute,
            attemptNumber: currentAttempt,
            retryCount: newRetryCount,
          },
        },
      });

      if (shouldStopAndEscalate) {
        // STOPPING RULE TRIGGERED: Stop automatic recovery and escalate to human
        await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'AUTOMATIC_RECOVERY_STOPPED',
            message: `Automatic recovery stopped after ${currentAttempt} failure(s). Stopping rule enforced to protect merchant balance and customer experience.`,
            metadata: {
              priorAttempts: currentAttempt,
              retryCount: newRetryCount,
              reason: 'STOPPING_RULE_ENFORCED',
            },
          },
        });

        // Escalate the recovery case
        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: {
            status: RecoveryStatus.ESCALATED,
            updatedAt: new Date(),
          },
        });

        // Record human escalation action
        const escalationAction = await tx.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType: RecoveryActionType.HUMAN_ESCALATION,
            status: RecoveryActionStatus.ESCALATED,
            reason: `Automatic recovery stopped. Case escalated to finance team after ${currentAttempt} failed attempt(s).`,
            attemptNumber: currentAttempt + 1,
            executedAt: new Date(),
          },
        });

        const audit = await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'HUMAN_ESCALATION',
            message: `Case escalated to human operations queue after repeated recovery failures.`,
            metadata: {
              actionId: escalationAction.id,
              escalatedFromAttempt: currentAttempt,
              reason: 'REPEATED_FAILURE_STOPPING_RULE',
            },
          },
        });

        return {
          success: false,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.ESCALATED,
          caseStatus: RecoveryStatus.ESCALATED,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: 'Recovery execution failed. Automatic recovery stopped; case safely escalated to human review.',
          stoppingRuleTriggered: true,
          escalatedToHuman: true,
          actionId: actionRecord.id,
          auditLogId: audit.id,
        };
      } else {
        // Case remains in FAILED or ACTION_REQUIRED for further manual action
        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: {
            status: RecoveryStatus.FAILED,
            updatedAt: new Date(),
          },
        });

        return {
          success: false,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.FAILED,
          caseStatus: RecoveryStatus.FAILED,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: `Recovery attempt failed: ${execOutcome.reason}`,
          stoppingRuleTriggered: false,
          actionId: actionRecord.id,
        };
      }
    } else {
      // ESCALATED or other statuses
      const actionRecord = await tx.recoveryAction.create({
        data: {
          recoveryCaseId: recoveryCase.id,
          actionType: actionToExecute,
          status: execOutcome.status,
          reason: execOutcome.reason,
          attemptNumber: currentAttempt,
          executedAt: new Date(),
          metadata: execOutcome.metadata,
        },
      });

      await tx.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: RecoveryStatus.ESCALATED,
          updatedAt: new Date(),
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          paymentId: payment.id,
          recoveryCaseId: recoveryCase.id,
          eventType: 'HUMAN_ESCALATION',
          message: `Case escalated: ${execOutcome.reason}`,
          metadata: {
            actionId: actionRecord.id,
            actionType: actionToExecute,
          },
        },
      });

      return {
        success: true,
        actionType: actionToExecute,
        actionStatus: execOutcome.status,
        caseStatus: RecoveryStatus.ESCALATED,
        amountRecovered: '0.00',
        amountRecoveredNumeric: 0,
        message: execOutcome.reason,
        escalatedToHuman: true,
        actionId: actionRecord.id,
        auditLogId: audit.id,
      };
    }
  });
}
