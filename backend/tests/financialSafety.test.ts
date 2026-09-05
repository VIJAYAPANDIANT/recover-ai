import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';
import { RecoveryActionType, RecoveryActionStatus, PaymentStatus, FailureReason } from '@prisma/client';
import { evaluatePolicy } from '../src/services/policyEngine.js';
import { analyzePaymentRecovery, AIAnalysisInput } from '../src/services/aiService.js';
import { SimulatedPaymentExecutor } from '../src/services/paymentExecutor.js';

describe('Financial & Execution Safety Verification', () => {
  test('Policy: retryCount >= 3 blocks RETRY_PAYMENT and diverts to HUMAN_ESCALATION', () => {
    const decision = evaluatePolicy({
      recommendedAction: RecoveryActionType.RETRY_PAYMENT,
      paymentStatus: PaymentStatus.FAILED,
      failureReason: FailureReason.CARD_DECLINED,
      amount: 4999,
      retryCount: 3,
    });

    assert.equal(decision.allowed, false);
    assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
    assert.match(decision.reason, /limit reached/i);
  });

  test('Policy: High value (> ₹50,000) blocks automated RETRY_PAYMENT', () => {
    const decision = evaluatePolicy({
      recommendedAction: RecoveryActionType.RETRY_PAYMENT,
      paymentStatus: PaymentStatus.FAILED,
      failureReason: FailureReason.BANK_ERROR,
      amount: 75000,
      retryCount: 0,
    });

    assert.equal(decision.allowed, false);
    assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
    assert.match(decision.reason, /High-value/i);
  });

  test('Policy: SUCCESS payment blocks action with NO_ACTION', () => {
    const decision = evaluatePolicy({
      recommendedAction: RecoveryActionType.RETRY_PAYMENT,
      paymentStatus: PaymentStatus.SUCCESS,
      failureReason: FailureReason.NONE,
      amount: 1999,
      retryCount: 0,
    });

    assert.equal(decision.allowed, false);
    assert.equal(decision.action, RecoveryActionType.NO_ACTION);
  });

  test('Policy: UNKNOWN failure reason requires HUMAN_ESCALATION', () => {
    const decision = evaluatePolicy({
      recommendedAction: RecoveryActionType.RETRY_PAYMENT,
      paymentStatus: PaymentStatus.FAILED,
      failureReason: FailureReason.UNKNOWN,
      amount: 999,
      retryCount: 0,
    });

    assert.equal(decision.allowed, false);
    assert.equal(decision.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
  });

  test('AI Service: Graceful failure handling and emergency circuit breaker', async () => {
    const input: AIAnalysisInput = {
      amount: 3499,
      currency: 'INR',
      status: 'FAILED',
      failureReason: 'CARD_DECLINED',
      retryCount: 1,
      paymentMethod: 'CARD',
      customerName: 'Karan Test',
      customerEmail: 'karan@test.in',
      previousAttemptsCount: 0,
      riskScore: 50,
      riskLevel: 'MEDIUM',
      simulateAiFailure: true,
    };

    const analysis = await analyzePaymentRecovery(input);
    assert.equal(analysis.isAiServiceError, true);
    assert.equal(analysis.recommendedAction, RecoveryActionType.HUMAN_ESCALATION);
    assert.match(analysis.diagnosis, /AI analysis unavailable/i);
  });

  test('Payment Executor: Safe simulated failure handling', async () => {
    const executor = new SimulatedPaymentExecutor();

    // 1. Success execution produces recovered amount
    const successResult = await executor.executeAction({
      actionType: RecoveryActionType.RETRY_PAYMENT,
      paymentId: 'PAY-TEST-001',
      amount: 5000,
      currency: 'INR',
      customerName: 'Priya Test',
      customerEmail: 'priya@test.in',
      failureReason: 'TIMEOUT',
      attemptNumber: 1,
      simulateFailure: false,
    });

    assert.equal(successResult.status, RecoveryActionStatus.SUCCESS);
    assert.equal(successResult.recoveredAmount, 5000);

    // 2. Simulated failure produces zero recovered amount and FAILED status
    const failureResult = await executor.executeAction({
      actionType: RecoveryActionType.RETRY_PAYMENT,
      paymentId: 'PAY-TEST-002',
      amount: 5000,
      currency: 'INR',
      customerName: 'Priya Test',
      customerEmail: 'priya@test.in',
      failureReason: 'TIMEOUT',
      attemptNumber: 1,
      simulateFailure: true,
    });

    assert.equal(failureResult.status, RecoveryActionStatus.FAILED);
    assert.equal(failureResult.recoveredAmount, 0);
  });

  test('Measurement: Accurate Decimal financial formulas and recovery rate', () => {
    const revenueAtRisk = new Decimal('150000.00');
    const revenueAttempted = new Decimal('92000.00');
    const revenueRecovered = new Decimal('48750.00');

    // Revenue Not Recovered = Revenue Attempted - Revenue Recovered
    const revenueNotRecovered = revenueAttempted.minus(revenueRecovered);
    assert.equal(revenueNotRecovered.toNumber(), 43250);

    // Recovery Rate = (Revenue Recovered / Revenue Attempted) * 100
    const recoveryRate = Number(revenueRecovered.dividedBy(revenueAttempted).times(100).toFixed(1));
    assert.equal(recoveryRate, 53.0);

    // Zero attempted revenue yields 0% recovery rate
    const zeroAttempted = new Decimal(0);
    const zeroRate = zeroAttempted.isZero() ? 0 : Number(revenueRecovered.dividedBy(zeroAttempted).times(100).toFixed(1));
    assert.equal(zeroRate, 0);
  });
});
