export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'SUBSCRIPTION_FAILED';

export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'EMI';

export type FailureReason =
  | 'CARD_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'BANK_ERROR'
  | 'TIMEOUT'
  | 'MANDATE_FAILURE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  | 'NONE';

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
  | 'SUCCESS'
  | 'FAILED'
  | 'ESCALATED';

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone?: string | null;
  contactOptOut?: boolean;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
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
  paymentsAtRisk: number;
  revenueAtRisk: string;
  revenueAtRiskNumeric: number;
  revenueAttempted: string;
  revenueAttemptedNumeric: number;
  revenueRecovered: string;
  revenueRecoveredNumeric: number;
  revenueNotRecovered: string;
  revenueNotRecoveredNumeric: number;
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
  funnel: {
    revenueAtRisk: number;
    eligibleCases: number;
    aiAnalyzed: number;
    policyApproved: number;
    recoveryAttempted: number;
    revenueRecovered: number;
  };
  recentCases: RecoveryCase[];
}

export interface BatchRecoveryCaseSummary {
  caseId: string;
  action: RecoveryActionType;
  actionStatus: RecoveryActionStatus;
  policyAllowed: boolean;
  amount: number;
}

export interface BatchRecoveryResult {
  processed: number;
  approved: number;
  blocked: number;
  escalated: number;
  successful: number;
  failed: number;
  revenueRecovered: number;
  revenueAttempted: number;
  cases: BatchRecoveryCaseSummary[];
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

export interface SystemStatus {
  services: {
    database: {
      name: string;
      status: string;
      latencyMs: number;
      connected: boolean;
    };
    aiService: {
      name: string;
      provider: string;
      status: string;
      connected: boolean;
      isNativeGemini: boolean;
    };
    paymentMode: {
      name: string;
      mode: string;
      status: string;
      isSimulation: boolean;
      demoMode: boolean;
    };
    policyEngine: {
      name: string;
      status: string;
      rulesEnforced: number;
      active: boolean;
    };
  };
  timestamp: string;
}
