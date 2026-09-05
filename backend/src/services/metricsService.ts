import { PaymentStatus, RiskLevel, RecoveryStatus, RecoveryActionStatus, RecoveryActionType, FailureReason } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';

export interface DashboardMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  abandonedPayments: number;
  subscriptionFailedPayments: number;
  paymentsAtRisk: number;
  revenueAtRisk: string; // Formatted Decimal string to preserve precision
  revenueAtRiskNumeric: number;
  revenueAttempted: string; // Day 3: Revenue from attempted recovery executions
  revenueAttemptedNumeric: number;
  revenueRecovered: string; // Exact sum of successfully recovered revenue
  revenueRecoveredNumeric: number;
  revenueNotRecovered: string; // revenueAttempted - revenueRecovered
  revenueNotRecoveredNumeric: number;
  recoveryRate: number; // (revenueRecovered / revenueAttempted) * 100
  recoveryCases: number;
  highRiskCases: number;
  mediumRiskCases: number;
  lowRiskCases: number;
  successRate: number;
  failureRate: number;
  // Execution outcome counts
  recoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  blockedActions: number;
  escalatedCases: number;
  statusBreakdown: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  failureReasonBreakdown: {
    reason: string;
    rawReason: string;
    count: number;
    revenueAtRisk: string;
    revenueAtRiskNumeric: number;
  }[];
  riskDistribution: {
    level: string;
    count: number;
    color: string;
  }[];
  recoveryPerformance: {
    metric: string;
    amount: number;
    formatted: string;
    fill: string;
  }[];
  recoveryActionsBreakdown: {
    action: string;
    count: number;
  }[];
  recoveryOutcomesBreakdown: {
    outcome: string;
    count: number;
    color: string;
  }[];
  funnel: {
    revenueAtRisk: number;
    eligibleCases: number;
    aiAnalyzed: number;
    policyApproved: number;
    recoveryAttempted: number;
    revenueRecovered: number;
  };
  recentCases: any[];
}

export interface StrategyPerformanceItem {
  strategy: RecoveryActionType;
  strategyLabel: string;
  attempts: number;
  successes: number;
  failures: number;
  amountAttempted: number;
  amountRecovered: number;
  successRate: number;
}

export interface FailureReasonAnalysisItem {
  reason: string;
  rawReason: string;
  cases: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
}

export interface RiskAnalysisItem {
  riskLevel: RiskLevel;
  cases: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  color: string;
}

/**
 * Calculates real-time dashboard financial aggregates and chart models
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // 1. Fetch counts grouped by Payment Status
  const statusGroups = await prisma.payment.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  let totalPayments = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let abandonedPayments = 0;
  let subscriptionFailedPayments = 0;

  for (const group of statusGroups) {
    const count = group._count.id;
    totalPayments += count;
    switch (group.status) {
      case PaymentStatus.SUCCESS:
        successfulPayments = count;
        break;
      case PaymentStatus.FAILED:
        failedPayments = count;
        break;
      case PaymentStatus.ABANDONED:
        abandonedPayments = count;
        break;
      case PaymentStatus.SUBSCRIPTION_FAILED:
        subscriptionFailedPayments = count;
        break;
    }
  }

  const paymentsAtRisk = failedPayments + abandonedPayments + subscriptionFailedPayments;

  // 2. Exact sum of Revenue at Risk (FAILED, ABANDONED, SUBSCRIPTION_FAILED)
  const atRiskAggregate = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: {
        in: [
          PaymentStatus.FAILED,
          PaymentStatus.ABANDONED,
          PaymentStatus.SUBSCRIPTION_FAILED,
        ],
      },
    },
  });

  const rawRevenueAtRisk = atRiskAggregate._sum.amount
    ? new Decimal(atRiskAggregate._sum.amount.toString())
    : new Decimal(0);

  // 3. Exact sum of Revenue Recovered (SUCCESS recoveryActions)
  const recoveredActionsAgg = await prisma.recoveryAction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: RecoveryActionStatus.SUCCESS,
      amount: { not: null },
    },
  });

  const rawRevenueRecovered = recoveredActionsAgg._sum.amount
    ? new Decimal(recoveredActionsAgg._sum.amount.toString())
    : new Decimal(0);

  // 4. Exact sum of Revenue Attempted (SUCCESS or FAILED actions executed)
  const attemptedActionsAgg = await prisma.recoveryAction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: {
        in: [RecoveryActionStatus.SUCCESS, RecoveryActionStatus.FAILED],
      },
      amount: { not: null },
    },
  });

  const rawRevenueAttempted = attemptedActionsAgg._sum.amount
    ? new Decimal(attemptedActionsAgg._sum.amount.toString())
    : new Decimal(0);

  const rawRevenueNotRecovered = Decimal.max(0, rawRevenueAttempted.minus(rawRevenueRecovered));

  // Recovery Rate = (Revenue Recovered / Revenue Attempted) * 100
  // If attempted is zero, rate is 0
  const recoveryRate = rawRevenueAttempted.isZero()
    ? 0
    : Number(rawRevenueRecovered.dividedBy(rawRevenueAttempted).times(100).toFixed(1));

  // 5. Recovery Cases counts grouped by RiskLevel
  const riskGroups = await prisma.recoveryCase.groupBy({
    by: ['riskLevel'],
    _count: {
      id: true,
    },
  });

  let recoveryCases = 0;
  let highRiskCases = 0;
  let mediumRiskCases = 0;
  let lowRiskCases = 0;

  for (const group of riskGroups) {
    const count = group._count.id;
    recoveryCases += count;
    switch (group.riskLevel) {
      case RiskLevel.HIGH:
        highRiskCases = count;
        break;
      case RiskLevel.MEDIUM:
        mediumRiskCases = count;
        break;
      case RiskLevel.LOW:
        lowRiskCases = count;
        break;
    }
  }

  // 6. Action Outcome Counts
  const actionOutcomeGroups = await prisma.recoveryAction.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  let recoveryAttempts = 0;
  let successfulRecoveries = 0;
  let failedRecoveries = 0;

  for (const group of actionOutcomeGroups) {
    recoveryAttempts += group._count.id;
    if (group.status === RecoveryActionStatus.SUCCESS) {
      successfulRecoveries = group._count.id;
    } else if (group.status === RecoveryActionStatus.FAILED) {
      failedRecoveries = group._count.id;
    }
  }

  const [escalatedCases, blockedActionsAudit, aiAnalyzedCount, policyApprovedAudit] = await Promise.all([
    prisma.recoveryCase.count({ where: { status: RecoveryStatus.ESCALATED } }),
    prisma.auditLog.count({ where: { eventType: 'ACTION_BLOCKED' } }),
    prisma.aIAnalysis.count(),
    prisma.auditLog.count({ where: { eventType: 'ACTION_APPROVED' } }),
  ]);

  const successRate = totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0;
  const failureRate = totalPayments > 0 ? Number(((paymentsAtRisk / totalPayments) * 100).toFixed(1)) : 0;

  // 7. Status Breakdown
  const statusColors: Record<PaymentStatus, string> = {
    [PaymentStatus.SUCCESS]: '#10b981',
    [PaymentStatus.FAILED]: '#ef4444',
    [PaymentStatus.ABANDONED]: '#f59e0b',
    [PaymentStatus.SUBSCRIPTION_FAILED]: '#8b5cf6',
  };

  const statusBreakdown = [
    { name: 'Success', count: successfulPayments, percentage: totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0, color: statusColors[PaymentStatus.SUCCESS] },
    { name: 'Failed', count: failedPayments, percentage: totalPayments > 0 ? Number(((failedPayments / totalPayments) * 100).toFixed(1)) : 0, color: statusColors[PaymentStatus.FAILED] },
    { name: 'Abandoned', count: abandonedPayments, percentage: totalPayments > 0 ? Number(((abandonedPayments / totalPayments) * 100).toFixed(1)) : 0, color: statusColors[PaymentStatus.ABANDONED] },
    { name: 'Subscription Failed', count: subscriptionFailedPayments, percentage: totalPayments > 0 ? Number(((subscriptionFailedPayments / totalPayments) * 100).toFixed(1)) : 0, color: statusColors[PaymentStatus.SUBSCRIPTION_FAILED] },
  ];

  // 8. Failure Reason Breakdown
  const reasonGroups = await prisma.payment.groupBy({
    by: ['failureReason'],
    where: {
      status: {
        in: [PaymentStatus.FAILED, PaymentStatus.ABANDONED, PaymentStatus.SUBSCRIPTION_FAILED],
      },
    },
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const failureReasonBreakdown = reasonGroups.map((group) => {
    const sumDec = group._sum.amount ? new Decimal(group._sum.amount.toString()) : new Decimal(0);
    return {
      reason: group.failureReason.replace(/_/g, ' '),
      rawReason: group.failureReason,
      count: group._count.id,
      revenueAtRisk: sumDec.toFixed(2),
      revenueAtRiskNumeric: sumDec.toNumber(),
    };
  });

  // 9. Risk Distribution
  const riskDistribution = [
    { level: 'High Risk', count: highRiskCases, color: '#f43f5e' },
    { level: 'Medium Risk', count: mediumRiskCases, color: '#f59e0b' },
    { level: 'Low Risk', count: lowRiskCases, color: '#10b981' },
  ];

  // 10. Actions Breakdown
  const actionGroups = await prisma.recoveryAction.groupBy({
    by: ['actionType'],
    _count: { id: true },
  });

  const allActionTypes: RecoveryActionType[] = [
    RecoveryActionType.RETRY_PAYMENT,
    RecoveryActionType.SEND_RECOVERY_MESSAGE,
    RecoveryActionType.OFFER_ALTERNATE_PAYMENT,
    RecoveryActionType.HUMAN_ESCALATION,
    RecoveryActionType.NO_ACTION,
  ];

  const recoveryActionsBreakdown = allActionTypes.map((actionType) => {
    const match = actionGroups.find((g) => g.actionType === actionType);
    return {
      action: actionType.replace(/_/g, ' '),
      count: match ? match._count.id : 0,
    };
  });

  // 11. Outcomes Breakdown
  const recoveryOutcomesBreakdown = [
    { outcome: 'Successful', count: successfulRecoveries, color: '#10b981' },
    { outcome: 'Failed', count: failedRecoveries, color: '#ef4444' },
    { outcome: 'Blocked', count: blockedActionsAudit, color: '#f59e0b' },
    { outcome: 'Escalated', count: escalatedCases, color: '#f97316' },
  ];

  // 12. Recovery Performance Bars
  const recoveryPerformance = [
    {
      metric: 'Revenue at Risk',
      amount: rawRevenueAtRisk.toNumber(),
      formatted: `₹${rawRevenueAtRisk.toNumber().toLocaleString('en-IN')}`,
      fill: '#f43f5e',
    },
    {
      metric: 'Revenue Attempted',
      amount: rawRevenueAttempted.toNumber(),
      formatted: `₹${rawRevenueAttempted.toNumber().toLocaleString('en-IN')}`,
      fill: '#38bdf8',
    },
    {
      metric: 'Revenue Recovered',
      amount: rawRevenueRecovered.toNumber(),
      formatted: `₹${rawRevenueRecovered.toNumber().toLocaleString('en-IN')}`,
      fill: '#10b981',
    },
  ];

  // 13. Recovery Funnel
  const funnel = {
    revenueAtRisk: rawRevenueAtRisk.toNumber(),
    eligibleCases: recoveryCases,
    aiAnalyzed: aiAnalyzedCount,
    policyApproved: policyApprovedAudit,
    recoveryAttempted: recoveryAttempts,
    revenueRecovered: rawRevenueRecovered.toNumber(),
  };

  // 14. Recent Cases
  const recentCases = await prisma.recoveryCase.findMany({
    take: 8,
    orderBy: { updatedAt: 'desc' },
    include: {
      payment: {
        include: { customer: true },
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

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    abandonedPayments,
    subscriptionFailedPayments,
    paymentsAtRisk,
    revenueAtRisk: rawRevenueAtRisk.toFixed(2),
    revenueAtRiskNumeric: rawRevenueAtRisk.toNumber(),
    revenueAttempted: rawRevenueAttempted.toFixed(2),
    revenueAttemptedNumeric: rawRevenueAttempted.toNumber(),
    revenueRecovered: rawRevenueRecovered.toFixed(2),
    revenueRecoveredNumeric: rawRevenueRecovered.toNumber(),
    revenueNotRecovered: rawRevenueNotRecovered.toFixed(2),
    revenueNotRecoveredNumeric: rawRevenueNotRecovered.toNumber(),
    recoveryRate,
    recoveryCases,
    highRiskCases,
    mediumRiskCases,
    lowRiskCases,
    successRate,
    failureRate,
    recoveryAttempts,
    successfulRecoveries,
    failedRecoveries,
    blockedActions: blockedActionsAudit,
    escalatedCases,
    statusBreakdown,
    failureReasonBreakdown,
    riskDistribution,
    recoveryPerformance,
    recoveryActionsBreakdown,
    recoveryOutcomesBreakdown,
    funnel,
    recentCases,
  };
}

/**
 * Strategy Performance: Grouped by recovery action type
 */
export async function getStrategyPerformance(): Promise<StrategyPerformanceItem[]> {
  const actions: RecoveryActionType[] = [
    RecoveryActionType.RETRY_PAYMENT,
    RecoveryActionType.SEND_RECOVERY_MESSAGE,
    RecoveryActionType.OFFER_ALTERNATE_PAYMENT,
    RecoveryActionType.HUMAN_ESCALATION,
    RecoveryActionType.NO_ACTION,
  ];

  const labels: Record<RecoveryActionType, string> = {
    [RecoveryActionType.RETRY_PAYMENT]: 'Retry Payment',
    [RecoveryActionType.SEND_RECOVERY_MESSAGE]: 'Recovery Message',
    [RecoveryActionType.OFFER_ALTERNATE_PAYMENT]: 'Alternate Payment Link',
    [RecoveryActionType.HUMAN_ESCALATION]: 'Human Escalation',
    [RecoveryActionType.NO_ACTION]: 'No Action',
  };

  const results: StrategyPerformanceItem[] = [];

  for (const action of actions) {
    const records = await prisma.recoveryAction.findMany({
      where: { actionType: action },
    });

    const attempts = records.length;
    let successes = 0;
    let failures = 0;
    let amountAttemptedDec = new Decimal(0);
    let amountRecoveredDec = new Decimal(0);

    for (const rec of records) {
      const amt = rec.amount ? new Decimal(rec.amount.toString()) : new Decimal(0);
      amountAttemptedDec = amountAttemptedDec.plus(amt);

      if (rec.status === RecoveryActionStatus.SUCCESS) {
        successes++;
        amountRecoveredDec = amountRecoveredDec.plus(amt);
      } else if (rec.status === RecoveryActionStatus.FAILED) {
        failures++;
      }
    }

    const successRate = attempts > 0 ? Number(((successes / attempts) * 100).toFixed(1)) : 0;

    results.push({
      strategy: action,
      strategyLabel: labels[action],
      attempts,
      successes,
      failures,
      amountAttempted: amountAttemptedDec.toNumber(),
      amountRecovered: amountRecoveredDec.toNumber(),
      successRate,
    });
  }

  return results;
}

/**
 * Failure Reason Analytics: Identifies which failure types are most recoverable
 */
export async function getFailureReasonAnalysis(): Promise<FailureReasonAnalysisItem[]> {
  const failureReasons: FailureReason[] = [
    FailureReason.BANK_ERROR,
    FailureReason.INSUFFICIENT_FUNDS,
    FailureReason.CARD_DECLINED,
    FailureReason.NETWORK_ERROR,
    FailureReason.TIMEOUT,
    FailureReason.MANDATE_FAILURE,
    FailureReason.UNKNOWN,
  ];

  const results: FailureReasonAnalysisItem[] = [];

  for (const reason of failureReasons) {
    // 1. Sum total amount and count of payments with this failure reason
    const payments = await prisma.payment.findMany({
      where: {
        failureReason: reason,
        status: { in: [PaymentStatus.FAILED, PaymentStatus.ABANDONED, PaymentStatus.SUBSCRIPTION_FAILED] },
      },
      include: {
        recoveryCase: {
          include: {
            recoveryActions: true,
          },
        },
      },
    });

    // Also include payments that originally failed with this reason and were recovered
    const allMatchingCases = await prisma.recoveryCase.findMany({
      where: {
        payment: {
          failureReason: reason,
        },
      },
      include: {
        payment: true,
        recoveryActions: true,
      },
    });

    const cases = allMatchingCases.length;
    let decAtRisk = new Decimal(0);
    let decRecovered = new Decimal(0);

    for (const c of allMatchingCases) {
      const amt = new Decimal(c.payment.amount.toString());
      decAtRisk = decAtRisk.plus(amt);

      const hasSuccess = c.recoveryActions.some((a) => a.status === RecoveryActionStatus.SUCCESS);
      if (hasSuccess || c.status === RecoveryStatus.RECOVERED) {
        decRecovered = decRecovered.plus(amt);
      }
    }

    const recoveryRate = decAtRisk.isZero()
      ? 0
      : Number(decRecovered.dividedBy(decAtRisk).times(100).toFixed(1));

    results.push({
      reason: reason.replace(/_/g, ' '),
      rawReason: reason,
      cases,
      revenueAtRisk: decAtRisk.toNumber(),
      revenueRecovered: decRecovered.toNumber(),
      recoveryRate,
    });
  }

  return results.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);
}

/**
 * Risk Analytics: Low, Medium, High risk recovery distribution
 */
export async function getRiskAnalysis(): Promise<RiskAnalysisItem[]> {
  const riskLevels: RiskLevel[] = [RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW];
  const colors: Record<RiskLevel, string> = {
    [RiskLevel.HIGH]: '#f43f5e',
    [RiskLevel.MEDIUM]: '#f59e0b',
    [RiskLevel.LOW]: '#10b981',
  };

  const results: RiskAnalysisItem[] = [];

  for (const level of riskLevels) {
    const cases = await prisma.recoveryCase.findMany({
      where: { riskLevel: level },
      include: {
        payment: true,
        recoveryActions: true,
      },
    });

    let decAtRisk = new Decimal(0);
    let decRecovered = new Decimal(0);

    for (const c of cases) {
      const amt = new Decimal(c.payment.amount.toString());
      decAtRisk = decAtRisk.plus(amt);

      const isRecovered = c.status === RecoveryStatus.RECOVERED || c.recoveryActions.some((a) => a.status === RecoveryActionStatus.SUCCESS);
      if (isRecovered) {
        decRecovered = decRecovered.plus(amt);
      }
    }

    const recoveryRate = decAtRisk.isZero()
      ? 0
      : Number(decRecovered.dividedBy(decAtRisk).times(100).toFixed(1));

    results.push({
      riskLevel: level,
      cases: cases.length,
      revenueAtRisk: decAtRisk.toNumber(),
      revenueRecovered: decRecovered.toNumber(),
      recoveryRate,
      color: colors[level],
    });
  }

  return results;
}
