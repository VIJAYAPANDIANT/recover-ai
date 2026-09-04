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

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
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
  recentCases: RecoveryCase[];
}
