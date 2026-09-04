import { PaymentStatus, RiskLevel } from '@prisma/client';
import Decimal from 'decimal.js';

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  breakdown: {
    statusWeight: number;
    amountWeight: number;
    retryWeight: number;
  };
}

/**
 * Calculates a deterministic risk score (0-100) and risk level for a payment.
 *
 * Status Weight:
 * - FAILED: +40
 * - ABANDONED: +30
 * - SUBSCRIPTION_FAILED: +45
 * - SUCCESS: 0
 *
 * Amount Weight:
 * - >= 10,000: +25
 * - >= 5,000: +15
 * - >= 1,000: +10
 * - otherwise: +5
 *
 * Retry Weight:
 * - >= 3: +20
 * - == 2: +15
 * - == 1: +10
 * - == 0: +5
 *
 * Level:
 * - 0–39: LOW
 * - 40–69: MEDIUM
 * - 70–100: HIGH
 */
export function calculateRiskScore(
  status: PaymentStatus,
  amount: Decimal | number | string,
  retryCount: number
): RiskScoreResult {
  if (status === PaymentStatus.SUCCESS) {
    return {
      score: 0,
      level: RiskLevel.LOW,
      breakdown: {
        statusWeight: 0,
        amountWeight: 0,
        retryWeight: 0,
      },
    };
  }

  // 1. Payment status weight
  let statusWeight = 0;
  switch (status) {
    case PaymentStatus.FAILED:
      statusWeight = 40;
      break;
    case PaymentStatus.ABANDONED:
      statusWeight = 30;
      break;
    case PaymentStatus.SUBSCRIPTION_FAILED:
      statusWeight = 45;
      break;
    default:
      statusWeight = 0;
  }

  // 2. Amount weight (using Decimal for exact comparison)
  const decAmount = new Decimal(amount.toString());
  let amountWeight = 5;
  if (decAmount.greaterThanOrEqualTo(10000)) {
    amountWeight = 25;
  } else if (decAmount.greaterThanOrEqualTo(5000)) {
    amountWeight = 15;
  } else if (decAmount.greaterThanOrEqualTo(1000)) {
    amountWeight = 10;
  } else {
    amountWeight = 5;
  }

  // 3. Retry count weight
  let retryWeight = 5;
  if (retryCount >= 3) {
    retryWeight = 20;
  } else if (retryCount === 2) {
    retryWeight = 15;
  } else if (retryCount === 1) {
    retryWeight = 10;
  } else {
    retryWeight = 5;
  }

  // Cap score at 100
  const rawScore = statusWeight + amountWeight + retryWeight;
  const score = Math.min(100, Math.max(0, rawScore));

  // Determine Risk Level
  let level: RiskLevel = RiskLevel.LOW;
  if (score >= 70) {
    level = RiskLevel.HIGH;
  } else if (score >= 40) {
    level = RiskLevel.MEDIUM;
  } else {
    level = RiskLevel.LOW;
  }

  return {
    score,
    level,
    breakdown: {
      statusWeight,
      amountWeight,
      retryWeight,
    },
  };
}
