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
 * Executes strictly policy-approved actions in a bounded, safe manner.
 * Never executes unapproved actions or real-money transactions.
 */
export async function executeRecoveryAction(
  recoveryCaseId: string,
  policyDecision: PolicyDecision,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  // Guard: Reject if policy explicitly blocked the action
  if (!policyDecision.allowed) {
    throw new Error(
      `Cannot execute blocked action (${policyDecision.action}). Reason: ${policyDecision.reason}`
    );
  }

  const actionToExecute = policyDecision.action;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch RecoveryCase and associated Payment
    const recoveryCase = await tx.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      include: {
        payment: {
          include: { customer: true },
        },
        recoveryActions: {
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!recoveryCase) {
      throw new Error(`Recovery case not found: ${recoveryCaseId}`);
    }

    const payment = recoveryCase.payment;
    const currentAttempt = (recoveryCase.recoveryActions[0]?.attemptNumber || 0) + 1;
    const paymentAmountDecimal = new Decimal(payment.amount.toString());

    // Record that recovery execution has started
    await tx.auditLog.create({
      data: {
        paymentId: payment.id,
        recoveryCaseId: recoveryCase.id,
        eventType: 'RECOVERY_STARTED',
        message: `Recovery execution initiated for action: ${actionToExecute} (Attempt #${currentAttempt})`,
        metadata: {
          actionType: actionToExecute,
          attemptNumber: currentAttempt,
          amount: paymentAmountDecimal.toNumber(),
          policyReason: policyDecision.reason,
          simulatedFailureMode: !!options.simulateFailure,
        },
      },
    });

    // 2. Execute Action based on type
    switch (actionToExecute) {
      case RecoveryActionType.SEND_RECOVERY_MESSAGE: {
        // Simulate sending multi-channel recovery reminder (WhatsApp/SMS)
        const messageBody = `Hi ${payment.customer.name}, your payment of ₹${paymentAmountDecimal.toNumber()} for ${payment.paymentId} was interrupted. Click here to resume your checkout securely with UPI/Card.`;

        const actionRecord = await tx.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType: RecoveryActionType.SEND_RECOVERY_MESSAGE,
            status: RecoveryActionStatus.SUCCESS,
            reason: 'Automated recovery message successfully dispatched to customer.',
            attemptNumber: currentAttempt,
            amount: paymentAmountDecimal,
            executedAt: new Date(),
            metadata: {
              channel: 'WhatsApp / SMS Simulated',
              recipient: payment.customer.phone,
              preview: messageBody,
            },
          },
        });

        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: { status: RecoveryStatus.ACTION_REQUIRED },
        });

        const audit = await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'MESSAGE_SENT',
            message: `Recovery message sent to customer ${payment.customer.name} (${payment.customer.phone})`,
            metadata: {
              actionId: actionRecord.id,
              channel: 'SMS/WhatsApp Simulated',
              phone: payment.customer.phone,
            },
          },
        });

        return {
          success: true,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.SUCCESS,
          caseStatus: RecoveryStatus.ACTION_REQUIRED,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: 'Recovery notification message dispatched successfully to customer.',
          actionId: actionRecord.id,
          auditLogId: audit.id,
        };
      }

      case RecoveryActionType.OFFER_ALTERNATE_PAYMENT: {
        // Simulate generating smart dynamic link / alternate UPI intent
        const alternateUrl = `https://pay.recoverai.internal/alt/${payment.paymentId}`;

        const actionRecord = await tx.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType: RecoveryActionType.OFFER_ALTERNATE_PAYMENT,
            status: RecoveryActionStatus.SUCCESS,
            reason: 'Alternate smart checkout link generated.',
            attemptNumber: currentAttempt,
            amount: paymentAmountDecimal,
            executedAt: new Date(),
            metadata: {
              alternateUrl,
              allowedMethods: ['UPI_INTENT', 'NET_BANKING', 'CARDS'],
            },
          },
        });

        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: { status: RecoveryStatus.ACTION_REQUIRED },
        });

        const audit = await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'ALTERNATE_PAYMENT_OFFERED',
            message: `Generated alternate payment option link for ${payment.paymentId}`,
            metadata: {
              actionId: actionRecord.id,
              alternateUrl,
            },
          },
        });

        return {
          success: true,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.SUCCESS,
          caseStatus: RecoveryStatus.ACTION_REQUIRED,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: 'Alternate payment checkout link generated successfully.',
          actionId: actionRecord.id,
          auditLogId: audit.id,
        };
      }

      case RecoveryActionType.HUMAN_ESCALATION: {
        const actionRecord = await tx.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType: RecoveryActionType.HUMAN_ESCALATION,
            status: RecoveryActionStatus.ESCALATED,
            reason: policyDecision.reason || 'Case flagged for manual operations review.',
            attemptNumber: currentAttempt,
            executedAt: new Date(),
          },
        });

        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: { status: RecoveryStatus.ESCALATED },
        });

        const audit = await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'HUMAN_ESCALATION',
            message: `Recovery case escalated to human review: ${policyDecision.reason}`,
            metadata: {
              actionId: actionRecord.id,
              escalationReason: policyDecision.reason,
              ruleTriggered: policyDecision.ruleTriggered,
            },
          },
        });

        return {
          success: true,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.ESCALATED,
          caseStatus: RecoveryStatus.ESCALATED,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: 'Case successfully escalated to human operations queue.',
          escalatedToHuman: true,
          actionId: actionRecord.id,
          auditLogId: audit.id,
        };
      }

      case RecoveryActionType.NO_ACTION: {
        const actionRecord = await tx.recoveryAction.create({
          data: {
            recoveryCaseId: recoveryCase.id,
            actionType: RecoveryActionType.NO_ACTION,
            status: RecoveryActionStatus.SUCCESS,
            reason: 'No recovery action required.',
            attemptNumber: currentAttempt,
            executedAt: new Date(),
          },
        });

        return {
          success: true,
          actionType: actionToExecute,
          actionStatus: RecoveryActionStatus.SUCCESS,
          caseStatus: recoveryCase.status,
          amountRecovered: '0.00',
          amountRecoveredNumeric: 0,
          message: 'No recovery action needed.',
          actionId: actionRecord.id,
        };
      }

      case RecoveryActionType.RETRY_PAYMENT: {
        // Safe Simulated Payment Retry Execution
        // Deterministic simulation rule:
        // If options.simulateFailure is true OR payment.retryCount >= 2 -> SIMULATE FAILURE
        // Otherwise -> SIMULATE SUCCESSFUL RECOVERY
        const shouldFail = options.simulateFailure === true || payment.retryCount >= 2;

        if (!shouldFail) {
          // --- SIMULATED SUCCESSFUL RECOVERY ---
          const actionRecord = await tx.recoveryAction.create({
            data: {
              recoveryCaseId: recoveryCase.id,
              actionType: RecoveryActionType.RETRY_PAYMENT,
              status: RecoveryActionStatus.SUCCESS,
              reason: 'Simulated automated retry cleared through gateway authorization switch.',
              attemptNumber: currentAttempt,
              amount: paymentAmountDecimal,
              executedAt: new Date(),
              metadata: {
                authCode: `AUTH-REC-${Math.floor(100000 + Math.random() * 900000)}`,
                networkResponse: '00_SUCCESS',
              },
            },
          });

          // Mark payment as SUCCESS
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              failureReason: FailureReason.NONE,
              updatedAt: new Date(),
            },
          });

          // Mark case as RECOVERED
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
              message: `Payment ${payment.paymentId} recovered successfully for ₹${paymentAmountDecimal.toNumber()}`,
              metadata: {
                actionId: actionRecord.id,
                amountRecovered: paymentAmountDecimal.toNumber(),
                authStatus: 'SUCCESS',
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
        } else {
          // --- SIMULATED FAILED RETRY ---
          const newRetryCount = payment.retryCount + 1;
          const stoppingRuleTriggered = newRetryCount >= 3 || paymentAmountDecimal.greaterThan(50000);

          // Update Payment with incremented retry count
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              retryCount: newRetryCount,
              updatedAt: new Date(),
            },
          });

          if (stoppingRuleTriggered) {
            // STOPPING RULE: Stop automated retries and escalate to human
            const actionRecord = await tx.recoveryAction.create({
              data: {
                recoveryCaseId: recoveryCase.id,
                actionType: RecoveryActionType.RETRY_PAYMENT,
                status: RecoveryActionStatus.ESCALATED,
                reason: `Retry attempt #${newRetryCount} failed. Stopping rule triggered (Max retries reached: ${newRetryCount}).`,
                attemptNumber: currentAttempt,
                executedAt: new Date(),
              },
            });

            await tx.recoveryCase.update({
              where: { id: recoveryCase.id },
              data: {
                status: RecoveryStatus.ESCALATED,
                updatedAt: new Date(),
              },
            });

            await tx.auditLog.create({
              data: {
                paymentId: payment.id,
                recoveryCaseId: recoveryCase.id,
                eventType: 'RECOVERY_FAILED',
                message: `Simulated payment retry failed (Attempt #${newRetryCount}). Bank declined again.`,
                metadata: {
                  actionId: actionRecord.id,
                  retryCount: newRetryCount,
                },
              },
            });

            const audit = await tx.auditLog.create({
              data: {
                paymentId: payment.id,
                recoveryCaseId: recoveryCase.id,
                eventType: 'HUMAN_ESCALATION',
                message: `Automatic recovery stopped after ${newRetryCount} failed attempts. Case escalated to human review.`,
                metadata: {
                  actionId: actionRecord.id,
                  reason: 'MAX_RETRIES_EXCEEDED',
                  retryCount: newRetryCount,
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
              message: 'Recovery action failed. Automatic retries stopped; case escalated to human review.',
              stoppingRuleTriggered: true,
              escalatedToHuman: true,
              actionId: actionRecord.id,
              auditLogId: audit.id,
            };
          } else {
            // Regular failure with remaining retries
            const actionRecord = await tx.recoveryAction.create({
              data: {
                recoveryCaseId: recoveryCase.id,
                actionType: RecoveryActionType.RETRY_PAYMENT,
                status: RecoveryActionStatus.FAILED,
                reason: `Retry attempt #${newRetryCount} failed. Gateway returned temporary bank error.`,
                attemptNumber: currentAttempt,
                executedAt: new Date(),
              },
            });

            await tx.recoveryCase.update({
              where: { id: recoveryCase.id },
              data: {
                status: RecoveryStatus.FAILED,
                updatedAt: new Date(),
              },
            });

            const audit = await tx.auditLog.create({
              data: {
                paymentId: payment.id,
                recoveryCaseId: recoveryCase.id,
                eventType: 'RECOVERY_FAILED',
                message: `Simulated payment retry failed (Attempt #${newRetryCount}).`,
                metadata: {
                  actionId: actionRecord.id,
                  retryCount: newRetryCount,
                },
              },
            });

            return {
              success: false,
              actionType: actionToExecute,
              actionStatus: RecoveryActionStatus.FAILED,
              caseStatus: RecoveryStatus.FAILED,
              amountRecovered: '0.00',
              amountRecoveredNumeric: 0,
              message: 'Simulated retry attempt failed. Retry recorded.',
              actionId: actionRecord.id,
              auditLogId: audit.id,
            };
          }
        }
      }

      default:
        throw new Error(`Unsupported recovery action type: ${actionToExecute}`);
    }
  });
}
