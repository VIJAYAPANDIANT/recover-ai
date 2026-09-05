import { PaymentStatus, RiskLevel, RecoveryStatus, RecoveryActionStatus, RecoveryActionType } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';

export interface DashboardMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  abandonedPayments: number;
  subscriptionFailedPayments: number;
  revenueAtRisk: string; // Formatted Decimal string to preserve precision
  revenueAtRiskNumeric: number;
  revenueRecovered: string; // Day 2: Exact sum of recovered revenue
  revenueRecoveredNumeric: number;
  recoveryRate: number; // Day 2: (revenueRecovered / revenueAtRisk) * 100
  recoveryCases: number;
  highRiskCases: number;
  mediumRiskCases: number;
  lowRiskCases: number;
  successRate: number;
  failureRate: number;
  // Day 2 execution metrics
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
  // Day 2 Charts
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
  recentCases: any[];
}

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

  // 2. Compute Revenue at Risk using PostgreSQL aggregate sum (Decimal)
  // Revenue At Risk = FAILED + ABANDONED + SUBSCRIPTION_FAILED (NEVER includes SUCCESS)
  const nonSuccessAggregate = await prisma.payment.aggregate({
    where: {
      status: {
        in: [
          PaymentStatus.FAILED,
          PaymentStatus.ABANDONED,
          PaymentStatus.SUBSCRIPTION_FAILED,
        ],
      },
    },
    _sum: {
      amount: true,
    },
  });

  const rawRevenueAtRisk = nonSuccessAggregate._sum.amount
    ? new Decimal(nonSuccessAggregate._sum.amount.toString())
    : new Decimal(0);

  // 3. Compute Revenue Recovered (Day 2)
  // Sum of amounts from successful retry actions or recovered payments with a recovery case
  const recoveredActionsAggregate = await prisma.recoveryAction.aggregate({
    where: {
      actionType: RecoveryActionType.RETRY_PAYMENT,
      status: RecoveryActionStatus.SUCCESS,
      amount: { not: null },
    },
    _sum: {
      amount: true,
    },
  });

  const rawRevenueRecovered = recoveredActionsAggregate._sum.amount
    ? new Decimal(recoveredActionsAggregate._sum.amount.toString())
    : new Decimal(0);

  // Recovery Rate formula: revenueRecovered / (revenueAtRisk + revenueRecovered) * 100 or revenueRecovered / revenueAtRisk * 100
  // Per spec: recoveryRate = revenueRecovered / revenueAtRisk * 100 (returns 0 if revenueAtRisk is 0)
  let recoveryRate = 0;
  if (!rawRevenueAtRisk.isZero()) {
    recoveryRate = Number(
      rawRevenueRecovered.dividedBy(rawRevenueAtRisk).times(100).toFixed(1)
    );
    if (isNaN(recoveryRate) || !isFinite(recoveryRate)) {
      recoveryRate = 0;
    }
  }

  // 4. Recovery Case counts & Risk levels
  const recoveryCaseCount = await prisma.recoveryCase.count();

  const riskGroups = await prisma.recoveryCase.groupBy({
    by: ['riskLevel'],
    _count: {
      id: true,
    },
  });

  let highRiskCases = 0;
  let mediumRiskCases = 0;
  let lowRiskCases = 0;

  for (const group of riskGroups) {
    const count = group._count.id;
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

  // 5. Day 2: Action & Case Outcome Counts
  const [
    recoveryAttempts,
    successfulRecoveries,
    failedRecoveries,
    blockedActions,
    escalatedCases,
  ] = await Promise.all([
    prisma.recoveryAction.count(),
    prisma.recoveryAction.count({ where: { status: RecoveryActionStatus.SUCCESS } }),
    prisma.recoveryAction.count({ where: { status: RecoveryActionStatus.FAILED } }),
    prisma.recoveryAction.count({ where: { status: RecoveryActionStatus.BLOCKED } }),
    prisma.recoveryCase.count({ where: { status: RecoveryStatus.ESCALATED } }),
  ]);

  // 6. Calculate rates
  const successRate = totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0;
  const nonSuccessCount = failedPayments + abandonedPayments + subscriptionFailedPayments;
  const failureRate = totalPayments > 0 ? Number(((nonSuccessCount / totalPayments) * 100).toFixed(1)) : 0;

  // 7. Failure Reason Breakdown for charts
  const reasonGroups = await prisma.payment.groupBy({
    by: ['failureReason'],
    where: {
      status: {
        in: [
          PaymentStatus.FAILED,
          PaymentStatus.ABANDONED,
          PaymentStatus.SUBSCRIPTION_FAILED,
        ],
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
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

  // 8. Day 2: Recovery Actions Breakdown for charts
  const actionGroups = await prisma.recoveryAction.groupBy({
    by: ['actionType'],
    _count: {
      id: true,
    },
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

  // 9. Day 2: Recovery Outcomes Breakdown
  const recoveryOutcomesBreakdown = [
    { outcome: 'Successful', count: successfulRecoveries, color: '#10b981' },
    { outcome: 'Failed', count: failedRecoveries, color: '#ef4444' },
    { outcome: 'Blocked', count: blockedActions, color: '#f59e0b' },
    { outcome: 'Escalated', count: escalatedCases, color: '#f97316' },
  ];

  // 10. Recovery Performance Chart Data
  const recoveryPerformance = [
    {
      metric: 'Revenue at Risk',
      amount: rawRevenueAtRisk.toNumber(),
      formatted: `₹${rawRevenueAtRisk.toNumber().toLocaleString('en-IN')}`,
      fill: '#f43f5e',
    },
    {
      metric: 'Revenue Recovered',
      amount: rawRevenueRecovered.toNumber(),
      formatted: `₹${rawRevenueRecovered.toNumber().toLocaleString('en-IN')}`,
      fill: '#10b981',
    },
  ];

  // 11. Recent Cases with AI analysis and actions included
  const recentCases = await prisma.recoveryCase.findMany({
    take: 8,
    orderBy: {
      updatedAt: 'desc',
    },
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

  const statusBreakdown = [
    {
      name: 'Successful',
      count: successfulPayments,
      percentage: totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#10b981',
    },
    {
      name: 'Failed',
      count: failedPayments,
      percentage: totalPayments > 0 ? Number(((failedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#ef4444',
    },
    {
      name: 'Abandoned',
      count: abandonedPayments,
      percentage: totalPayments > 0 ? Number(((abandonedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#f59e0b',
    },
    {
      name: 'Sub Failed',
      count: subscriptionFailedPayments,
      percentage: totalPayments > 0 ? Number(((subscriptionFailedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#8b5cf6',
    },
  ];

  const riskDistribution = [
    { level: 'High Risk', count: highRiskCases, color: '#ef4444' },
    { level: 'Medium Risk', count: mediumRiskCases, color: '#f59e0b' },
    { level: 'Low Risk', count: lowRiskCases, color: '#10b981' },
  ];

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    abandonedPayments,
    subscriptionFailedPayments,
    revenueAtRisk: rawRevenueAtRisk.toFixed(2),
    revenueAtRiskNumeric: rawRevenueAtRisk.toNumber(),
    revenueRecovered: rawRevenueRecovered.toFixed(2),
    revenueRecoveredNumeric: rawRevenueRecovered.toNumber(),
    recoveryRate,
    recoveryCases: recoveryCaseCount,
    highRiskCases,
    mediumRiskCases,
    lowRiskCases,
    successRate,
    failureRate,
    recoveryAttempts,
    successfulRecoveries,
    failedRecoveries,
    blockedActions,
    escalatedCases,
    statusBreakdown,
    failureReasonBreakdown,
    riskDistribution,
    recoveryPerformance,
    recoveryActionsBreakdown,
    recoveryOutcomesBreakdown,
    recentCases,
  };
}
