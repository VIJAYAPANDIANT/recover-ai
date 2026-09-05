import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePolicy } from '../src/services/policyEngine.js';
import { PaymentStatus, FailureReason, RecoveryActionType } from '@prisma/client';

test('Policy Engine - Rule 1: Retry limit (retryCount >= 3) blocks RETRY_PAYMENT', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.RETRY_PAYMENT,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.INSUFFICIENT_FUNDS,
    amount: 2499,
    retryCount: 3,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.action, RecoveryActionType.RETRY_PAYMENT);
  assert.equal(result.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
  assert.equal(result.ruleTriggered, 'RULE_RETRY_LIMIT');
});

test('Policy Engine - Rule 2: High-value payment (> ₹50,000) blocks automated RETRY_PAYMENT', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.RETRY_PAYMENT,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.BANK_ERROR,
    amount: 75000,
    retryCount: 0,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.action, RecoveryActionType.RETRY_PAYMENT);
  assert.equal(result.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
  assert.equal(result.ruleTriggered, 'RULE_HIGH_VALUE');
});

test('Policy Engine - Rule 3: Customer opt-out blocks SEND_RECOVERY_MESSAGE', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.SEND_RECOVERY_MESSAGE,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.CARD_DECLINED,
    amount: 999,
    retryCount: 0,
    contactOptOut: true,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.action, RecoveryActionType.SEND_RECOVERY_MESSAGE);
  assert.equal(result.fallbackAction, RecoveryActionType.OFFER_ALTERNATE_PAYMENT);
  assert.equal(result.ruleTriggered, 'RULE_CONTACT_OPTOUT');
});

test('Policy Engine - Rule 4: Successful payment returns NO_ACTION', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.RETRY_PAYMENT,
    paymentStatus: PaymentStatus.SUCCESS,
    failureReason: FailureReason.NONE,
    amount: 4999,
    retryCount: 0,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.action, RecoveryActionType.NO_ACTION);
  assert.equal(result.ruleTriggered, 'RULE_ALREADY_SUCCESS');
});

test('Policy Engine - Rule 5: Unknown failure reason blocks RETRY_PAYMENT and requires HUMAN_ESCALATION', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.RETRY_PAYMENT,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.UNKNOWN,
    amount: 1499,
    retryCount: 1,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.action, RecoveryActionType.RETRY_PAYMENT);
  assert.equal(result.fallbackAction, RecoveryActionType.HUMAN_ESCALATION);
  assert.equal(result.ruleTriggered, 'RULE_UNKNOWN_FAILURE');
});

test('Policy Engine - Allows legitimate action within policy bounds', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.RETRY_PAYMENT,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.TIMEOUT,
    amount: 1499,
    retryCount: 1,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.action, RecoveryActionType.RETRY_PAYMENT);
});

test('Policy Engine - Allows customer recovery message when not opted out', () => {
  const result = evaluatePolicy({
    recommendedAction: RecoveryActionType.SEND_RECOVERY_MESSAGE,
    paymentStatus: PaymentStatus.FAILED,
    failureReason: FailureReason.CARD_DECLINED,
    amount: 4999,
    retryCount: 0,
    contactOptOut: false,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.action, RecoveryActionType.SEND_RECOVERY_MESSAGE);
});
