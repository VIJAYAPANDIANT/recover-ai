import { RecoveryActionType, PaymentStatus, FailureReason } from '@prisma/client';
import Decimal from 'decimal.js';

export interface PolicyEvaluationInput {
  recommendedAction: RecoveryActionType;
  paymentStatus: PaymentStatus;
  failureReason: FailureReason;
  amount: Decimal | number | string;
  retryCount: number;
  contactOptOut?: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  action: RecoveryActionType;
  fallbackAction?: RecoveryActionType;
  reason: string;
  ruleTriggered?: string;
  evaluatedAt: string;
}

/**
 * Evaluates an AI-recommended recovery action against strict safety and business policies.
 *
 * Rules:
 * 1. Retry Limit: retryCount >= 3 blocks RETRY_PAYMENT -> fallback HUMAN_ESCALATION
 * 2. High-Value Payment: amount > 50,000 blocks RETRY_PAYMENT -> fallback HUMAN_ESCALATION
 * 3. Customer Contact: contactOptOut = true blocks SEND_RECOVERY_MESSAGE -> fallback OFFER_ALTERNATE_PAYMENT
 * 4. Successful Payment: paymentStatus === SUCCESS -> NO_ACTION
 * 5. Unknown Failure: failureReason === UNKNOWN blocks RETRY_PAYMENT -> fallback HUMAN_ESCALATION
 */
export function evaluatePolicy(input: PolicyEvaluationInput): PolicyDecision {
  const decAmount = new Decimal(input.amount.toString());
  const evaluatedAt = new Date().toISOString();

  // Rule 4: Successful payment check
  if (input.paymentStatus === PaymentStatus.SUCCESS) {
    return {
      allowed: false,
      action: RecoveryActionType.NO_ACTION,
      reason: 'Payment has already succeeded. No recovery action permitted.',
      ruleTriggered: 'RULE_ALREADY_SUCCESS',
      evaluatedAt,
    };
  }

  // If AI already recommended NO_ACTION or HUMAN_ESCALATION, approve directly
  if (
    input.recommendedAction === RecoveryActionType.NO_ACTION ||
    input.recommendedAction === RecoveryActionType.HUMAN_ESCALATION
  ) {
    return {
      allowed: true,
      action: input.recommendedAction,
      reason: 'Non-automated intervention approved under policy.',
      evaluatedAt,
    };
  }

  // Rule 1: Retry Limit check (retryCount >= 3)
  if (input.recommendedAction === RecoveryActionType.RETRY_PAYMENT && input.retryCount >= 3) {
    return {
      allowed: false,
      action: input.recommendedAction,
      fallbackAction: RecoveryActionType.HUMAN_ESCALATION,
      reason: 'Maximum automatic retry limit reached (3 attempts). Manual escalation required.',
      ruleTriggered: 'RULE_RETRY_LIMIT',
      evaluatedAt,
    };
  }

  // Rule 2: High-Value Payment check (amount > ₹50,000)
  if (input.recommendedAction === RecoveryActionType.RETRY_PAYMENT && decAmount.greaterThan(50000)) {
    return {
      allowed: false,
      action: input.recommendedAction,
      fallbackAction: RecoveryActionType.HUMAN_ESCALATION,
      reason: 'High-value transaction (> ₹50,000) requires manual review before re-attempting.',
      ruleTriggered: 'RULE_HIGH_VALUE',
      evaluatedAt,
    };
  }

  // Rule 5: Unknown Failure check (failureReason === UNKNOWN)
  if (
    input.recommendedAction === RecoveryActionType.RETRY_PAYMENT &&
    input.failureReason === FailureReason.UNKNOWN
  ) {
    return {
      allowed: false,
      action: input.recommendedAction,
      fallbackAction: RecoveryActionType.HUMAN_ESCALATION,
      reason: 'Unknown failure reason detected. Escalating to human review instead of blind retry.',
      ruleTriggered: 'RULE_UNKNOWN_FAILURE',
      evaluatedAt,
    };
  }

  // Rule 3: Customer Contact Opt-Out check
  if (input.recommendedAction === RecoveryActionType.SEND_RECOVERY_MESSAGE && input.contactOptOut) {
    return {
      allowed: false,
      action: input.recommendedAction,
      fallbackAction: RecoveryActionType.OFFER_ALTERNATE_PAYMENT,
      reason: 'Customer has opted out of automated recovery messages.',
      ruleTriggered: 'RULE_CONTACT_OPTOUT',
      evaluatedAt,
    };
  }

  // All policy rules satisfied
  return {
    allowed: true,
    action: input.recommendedAction,
    reason: 'Action is allowed under current recovery policy.',
    evaluatedAt,
  };
}
