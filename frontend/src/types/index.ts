export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'SUBSCRIPTION_FAILED';

export type FailureReason =
  | 'NONE'
  | 'BANK_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_DECLINED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'MANDATE_FAILURE'
  | 'UNKNOWN';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'EMI';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecoveryStatus =
  | 'NEW'
  | 'ANALYZED'
  | 'ACTION_REQUIRED'
  | 'RECOVERED'
  | 'FAILED'
  | 'ESCALATED';

export type RecoveryActionType =
  | 'RETRY_PAYMENT'
  | 'SEND_RECOVERY_MESSAGE'
  | 'OFFER_ALTERNATE_PAYMENT'
  | 'HUMAN_ESCALATION'
  | 'NO_ACTION';

export type RecoveryActionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'BLOCKED'
  | 'ESCALATED';

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  contactOptOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentId: string;
  customerId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  failureReason: FailureReason;
  retryCount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  recoveryCase?: RecoveryCase | null;
  auditLogs?: AuditLog[];
}

export interface AIAnalysis {
  id: string;
  recoveryCaseId: string;
  diagnosis: string;
  recommendedAction: RecoveryActionType;
  reason: string;
  confidence: number;
  expectedRecoveryProbability: number;
  provider: string;
  model: string;
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  recoveryCaseId: string;
  actionType: RecoveryActionType;
  status: RecoveryActionStatus;
  reason?: string | null;
  attemptNumber: number;
  amount?: string | null;
  executedAt?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface PolicyDecision {
  allowed: boolean;
  action: RecoveryActionType;
  fallbackAction?: RecoveryActionType;
  reason: string;
  ruleTriggered?: string;
  evaluatedAt: string;
}

export interface RecoveryCase {
  id: string;
  caseId: string;
  paymentId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: RecoveryStatus;
  estimatedRecoverableAmount: string;
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
  aiAnalyses?: AIAnalysis[];
  recoveryActions?: RecoveryAction[];
  auditLogs?: AuditLog[];
}

export interface AuditLog {
  id: string;
  paymentId?: string | null;
  recoveryCaseId?: string | null;
  eventType: string;
  message: string;
  metadata?: any;
  createdAt: string;
  payment?: Payment;
  recoveryCase?: RecoveryCase;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface DashboardMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  abandonedPayments: number;
  subscriptionFailedPayments: number;
  revenueAtRisk: string;
  revenueAtRiskNumeric: number;
  revenueRecovered: string;
  revenueRecoveredNumeric: number;
  recoveryRate: number;
  recoveryCases: number;
  highRiskCases: number;
  mediumRiskCases: number;
  lowRiskCases: number;
  successRate: number;
  failureRate: number;
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
  recentCases: RecoveryCase[];
}
