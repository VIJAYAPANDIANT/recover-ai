import { PaymentStatus, RiskLevel } from '@prisma/client';
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
  totalRevenueRecovered: string;
  recoveryCases: number;
  highRiskCases: number;
  mediumRiskCases: number;
  lowRiskCases: number;
  successRate: number;
  failureRate: number;
  statusBreakdown: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  failureReasonBreakdown: {
    reason: string;
    count: number;
    revenueAtRisk: string;
    revenueAtRiskNumeric: number;
  }[];
  riskDistribution: {
    level: string;
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

  // 3. Recovery Case counts & Risk levels
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

  // 4. Calculate rates
  const successRate = totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0;
  const nonSuccessCount = failedPayments + abandonedPayments + subscriptionFailedPayments;
  const failureRate = totalPayments > 0 ? Number(((nonSuccessCount / totalPayments) * 100).toFixed(1)) : 0;

  // 5. Failure Reason Breakdown for charts
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

  // 6. Recent Cases (top 8 latest cases)
  const recentCases = await prisma.recoveryCase.findMany({
    take: 8,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      payment: {
        include: {
          customer: true,
        },
      },
    },
  });

  const statusBreakdown = [
    {
      name: 'Successful',
      count: successfulPayments,
      percentage: totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#10b981', // emerald-500
    },
    {
      name: 'Failed',
      count: failedPayments,
      percentage: totalPayments > 0 ? Number(((failedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#ef4444', // red-500
    },
    {
      name: 'Abandoned',
      count: abandonedPayments,
      percentage: totalPayments > 0 ? Number(((abandonedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#f59e0b', // amber-500
    },
    {
      name: 'Sub Failed',
      count: subscriptionFailedPayments,
      percentage: totalPayments > 0 ? Number(((subscriptionFailedPayments / totalPayments) * 100).toFixed(1)) : 0,
      color: '#8b5cf6', // violet-500
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
    totalRevenueRecovered: '0.00',
    recoveryCases: recoveryCaseCount,
    highRiskCases,
    mediumRiskCases,
    lowRiskCases,
    successRate,
    failureRate,
    statusBreakdown,
    failureReasonBreakdown,
    riskDistribution,
    recentCases,
  };
}
