import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  RecoveryActionType,
  RecoveryActionStatus,
  PaymentStatus,
  FailureReason,
  RecoveryStatus,
} from '@prisma/client';
import prisma from '../src/utils/prisma.js';
import { evaluatePolicy } from '../src/services/policyEngine.js';
import { getFallbackAnalysis, analyzePaymentRecovery } from '../src/services/aiService.js';
import { SimulatedPaymentExecutor } from '../src/services/paymentExecutor.js';
import { executeRecoveryAction } from '../src/services/recoveryExecutor.js';
import { runRecoveryBatch } from '../src/services/batchRecoveryService.js';
import { seedDemoDataset } from '../src/services/seedService.js';

describe('Day 4 - Final Submission & Production Hardening Test Suite', () => {
  // --- 1. POLICY ENGINE SAFETY CHECKS ---
  describe('Policy Engine Rules', () => {
    test('Rule 1: retryCount >= 3 blocks RETRY_PAYMENT and diverts to HUMAN_ESCALATION', () => {
      const decision = evaluatePolicy({
        recommendedAction: RecoveryActionType.RETRY_PAYMENT,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: FailureReason.CARD_DECLINED,
        amount: 2500,
        retryCount: 3,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
      assert.equal(decision.ruleTriggered, 'RULE_RETRY_LIMIT');
    });

    test('Rule 2: amount > 50000 blocks automated RETRY_PAYMENT and escalates', () => {
      const decision = evaluatePolicy({
        recommendedAction: RecoveryActionType.RETRY_PAYMENT,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: FailureReason.BANK_ERROR,
        amount: 99999,
        retryCount: 0,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
      assert.equal(decision.ruleTriggered, 'RULE_HIGH_VALUE');
    });

    test('Rule 3: contact opt-out blocks SEND_RECOVERY_MESSAGE and falls back to alternate payment', () => {
      const decision = evaluatePolicy({
        recommendedAction: RecoveryActionType.SEND_RECOVERY_MESSAGE,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: FailureReason.CARD_DECLINED,
        amount: 1499,
        retryCount: 0,
        contactOptOut: true,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.fallbackAction, RecoveryActionType.OFFER_ALTERNATE_PAYMENT);
      assert.equal(decision.ruleTriggered, 'RULE_CONTACT_OPTOUT');
    });

    test('Rule 4: SUCCESS payment blocks action with NO_ACTION', () => {
      const decision = evaluatePolicy({
        recommendedAction: RecoveryActionType.RETRY_PAYMENT,
        paymentStatus: PaymentStatus.SUCCESS,
        failureReason: FailureReason.NONE,
        amount: 4999,
        retryCount: 0,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.action, RecoveryActionType.NO_ACTION);
      assert.equal(decision.ruleTriggered, 'RULE_ALREADY_SUCCESS');
    });

    test('Rule 5: UNKNOWN failure reason blocks RETRY_PAYMENT and requires HUMAN_ESCALATION', () => {
      const decision = evaluatePolicy({
        recommendedAction: RecoveryActionType.RETRY_PAYMENT,
        paymentStatus: PaymentStatus.FAILED,
        failureReason: FailureReason.UNKNOWN,
        amount: 799,
        retryCount: 0,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
      assert.equal(decision.ruleTriggered, 'RULE_UNKNOWN_FAILURE');
    });
  });

  // --- 2. AI DIAGNOSTIC SERVICE & CIRCUIT BREAKER ---
  describe('AI Diagnostic Service', () => {
    test('AI Fallback generates structured diagnosis and valid probabilities', () => {
      const analysis = getFallbackAnalysis({
        amount: 2499,
        currency: 'INR',
        status: 'FAILED',
        failureReason: 'CARD_DECLINED',
        retryCount: 0,
        paymentMethod: 'UPI',
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav@techcorp.in',
        previousAttemptsCount: 0,
        riskScore: 75,
        riskLevel: 'HIGH',
        contactOptOut: false,
      });

      assert.ok(analysis.diagnosis.length > 5);
      assert.equal(analysis.recommendedAction, RecoveryActionType.SEND_RECOVERY_MESSAGE);
      assert.ok(analysis.confidence >= 0 && analysis.confidence <= 1);
      assert.ok(analysis.expectedRecoveryProbability >= 0 && analysis.expectedRecoveryProbability <= 1);
      assert.equal(analysis.isFallback, true);
    });

    test('AI Provider Outage triggers Circuit Breaker and safe Human Escalation', async () => {
      const analysis = await analyzePaymentRecovery({
        amount: 4999,
        currency: 'INR',
        status: 'FAILED',
        failureReason: 'BANK_ERROR',
        retryCount: 1,
        paymentMethod: 'CARD',
        customerName: 'Priya Iyer',
        customerEmail: 'priya@finflow.co',
        previousAttemptsCount: 0,
        riskScore: 60,
        riskLevel: 'MEDIUM',
        simulateAiFailure: true,
      });

      assert.equal(analysis.isAiServiceError, true);
      assert.equal(analysis.recommendedAction, RecoveryActionType.HUMAN_ESCALATION);
      assert.match(analysis.diagnosis, /AI analysis unavailable/i);
    });
  });

  // --- 3. RECOVERY EXECUTOR & PAYMENT ABSTRACTION ---
  describe('Recovery Executor & Payment Simulation', () => {
    test('SimulatedPaymentExecutor executes successful recovery with positive amount', async () => {
      const executor = new SimulatedPaymentExecutor();
      const res = await executor.executeAction({
        actionType: RecoveryActionType.RETRY_PAYMENT,
        paymentId: 'PAY-TEST-999',
        amount: 1999,
        currency: 'INR',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        failureReason: 'TIMEOUT',
        attemptNumber: 1,
        simulateFailure: false,
      });

      assert.equal(res.status, RecoveryActionStatus.SUCCESS);
      assert.equal(res.recoveredAmount, 1999);
      assert.ok(res.reason.includes('secondary gateway routing') || res.reason.includes('authorized'));
    });

    test('SimulatedPaymentExecutor failure simulation records FAILED with zero amount', async () => {
      const executor = new SimulatedPaymentExecutor();
      const res = await executor.executeAction({
        actionType: RecoveryActionType.RETRY_PAYMENT,
        paymentId: 'PAY-TEST-888',
        amount: 4999,
        currency: 'INR',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        failureReason: 'CARD_DECLINED',
        attemptNumber: 1,
        simulateFailure: true,
      });

      assert.equal(res.status, RecoveryActionStatus.FAILED);
      assert.equal(res.recoveredAmount, 0);
      assert.ok(res.reason.includes('Simulated issuing bank decline') || res.reason.includes('refused'));
    });

    test('Blocked policy action is strictly prevented from executing', async () => {
      await assert.rejects(
        async () => {
          await executeRecoveryAction(
            'non-existent-case-id',
            {
              allowed: false,
              action: RecoveryActionType.RETRY_PAYMENT,
              reason: 'Blocked by policy rule',
              ruleTriggered: 'RULE_RETRY_LIMIT',
            }
          );
        },
        /Cannot execute blocked action/
      );
    });
  });

  // --- 4. IDEMPOTENCY SAFETY CHECK ---
  describe('Idempotency & Duplicate Execution Protection', () => {
    test('Duplicate recovery attempt on an already recovered case returns already executed message', async () => {
      // Find an eligible case with status NEW
      const eligibleCase = await prisma.recoveryCase.findFirst({
        where: {
          status: RecoveryStatus.NEW,
          payment: { status: { not: PaymentStatus.SUCCESS } },
        },
        include: { payment: { include: { customer: true } } },
      });

      if (eligibleCase) {
        // First execution: successful recovery
        const firstResult = await executeRecoveryAction(eligibleCase.id, {
          allowed: true,
          action: RecoveryActionType.RETRY_PAYMENT,
          reason: 'Initial valid recovery execution',
        });

        assert.equal(firstResult.success, true);
        assert.equal(firstResult.caseStatus, RecoveryStatus.RECOVERED);

        // Second duplicate execution: must be rejected by idempotency guard
        const secondResult = await executeRecoveryAction(eligibleCase.id, {
          allowed: true,
          action: RecoveryActionType.RETRY_PAYMENT,
          reason: 'Duplicate malicious or network retry execution',
        });

        assert.equal(secondResult.success, false);
        assert.ok(secondResult.message.includes('already'));
        assert.equal(secondResult.amountRecoveredNumeric, 0);
      }
    });
  });

  // --- 5. BATCH RECOVERY PROCESSING ---
  describe('Batch Recovery Pipeline', () => {
    test('Batch runner executes bounded limit and calculates dynamic financial aggregates', async () => {
      const batchResult = await runRecoveryBatch({
        limit: 5,
        includeEscalated: false,
        simulateFailure: false,
      });

      assert.ok(typeof batchResult.processed === 'number');
      assert.ok(typeof batchResult.approved === 'number');
      assert.ok(typeof batchResult.revenueRecovered === 'number');
      assert.ok(typeof batchResult.revenueAttempted === 'number');
      assert.ok(Array.isArray(batchResult.cases));
      assert.ok(batchResult.cases.length <= 5);
    });
  });

  // --- 6. DEMO RESET RESTORATION ---
  describe('Demo Dataset Reset', () => {
    test('Demo reset restores exact 500 payment dataset breakdown and 150 cases', async () => {
      const resetRes = await seedDemoDataset();
      assert.equal(resetRes.payments, 500);

      const [totalPayments, successCount, failedCount, abandonedCount, subFailedCount, caseCount] =
        await Promise.all([
          prisma.payment.count(),
          prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
          prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
          prisma.payment.count({ where: { status: PaymentStatus.ABANDONED } }),
          prisma.payment.count({ where: { status: PaymentStatus.SUBSCRIPTION_FAILED } }),
          prisma.recoveryCase.count(),
        ]);

      assert.equal(totalPayments, 500);
      assert.equal(successCount, 350);
      assert.equal(failedCount, 80);
      assert.equal(abandonedCount, 40);
      assert.equal(subFailedCount, 30);
      assert.equal(caseCount, 150); // exactly 80 + 40 + 30
    });
  });
});
