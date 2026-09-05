import test from 'node:test';
import assert from 'node:assert/strict';
import { getFallbackAnalysis } from '../src/services/aiService.js';
import { RecoveryActionType } from '@prisma/client';

test('AI Service - Rule fallback generates structured diagnosis and recommendation', () => {
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

  assert.equal(typeof analysis.diagnosis, 'string');
  assert.ok(analysis.diagnosis.length > 10);
  assert.equal(analysis.recommendedAction, RecoveryActionType.SEND_RECOVERY_MESSAGE);
  assert.ok(analysis.confidence > 0 && analysis.confidence <= 1);
  assert.ok(analysis.expectedRecoveryProbability > 0 && analysis.expectedRecoveryProbability <= 1);
  assert.equal(analysis.isFallback, true);
});

test('AI Service - Safe escalation when retries >= 3', () => {
  const analysis = getFallbackAnalysis({
    amount: 4999,
    currency: 'INR',
    status: 'FAILED',
    failureReason: 'INSUFFICIENT_FUNDS',
    retryCount: 3,
    paymentMethod: 'CARD',
    customerName: 'Priya Iyer',
    customerEmail: 'priya@finflow.co',
    previousAttemptsCount: 3,
    riskScore: 85,
    riskLevel: 'HIGH',
  });

  assert.equal(analysis.recommendedAction, RecoveryActionType.HUMAN_ESCALATION);
});

test('AI Service - Recommends alternate payment for mandate failure', () => {
  const analysis = getFallbackAnalysis({
    amount: 999,
    currency: 'INR',
    status: 'SUBSCRIPTION_FAILED',
    failureReason: 'MANDATE_FAILURE',
    retryCount: 1,
    paymentMethod: 'UPI',
    customerName: 'Rohan Verma',
    customerEmail: 'rohan@cloudscale.io',
    previousAttemptsCount: 1,
    riskScore: 65,
    riskLevel: 'MEDIUM',
  });

  assert.equal(analysis.recommendedAction, RecoveryActionType.OFFER_ALTERNATE_PAYMENT);
});
