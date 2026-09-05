import axios from 'axios';
import {
  DashboardMetrics,
  Payment,
  RecoveryCase,
  AuditLog,
  PaginatedResponse,
  AIAnalysis,
  PolicyDecision,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<{ success: boolean; data: DashboardMetrics }>('/dashboard/metrics');
  return response.data.data;
}

export interface PaymentQueryParams {
  status?: string;
  riskLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPayments(params: PaymentQueryParams = {}): Promise<PaginatedResponse<Payment>> {
  const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
  return response.data;
}

export async function getPayment(id: string): Promise<Payment> {
  const response = await apiClient.get<{ success: boolean; data: Payment }>(`/payments/${id}`);
  return response.data.data;
}

export interface RecoveryCaseQueryParams {
  status?: string;
  riskLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getRecoveryCases(params: RecoveryCaseQueryParams = {}): Promise<PaginatedResponse<RecoveryCase>> {
  const response = await apiClient.get<PaginatedResponse<RecoveryCase>>('/recovery/cases', { params });
  return response.data;
}

export async function getRecoveryCase(id: string): Promise<RecoveryCase> {
  const response = await apiClient.get<{ success: boolean; data: RecoveryCase }>(`/recovery/cases/${id}`);
  return response.data.data;
}

export async function seedDemoData(): Promise<{ message: string; payments: number }> {
  const response = await apiClient.post<{ success: boolean; message: string; payments: number }>('/payments/seed');
  return response.data;
}

export interface AuditLogQueryParams {
  eventType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(params: AuditLogQueryParams = {}): Promise<PaginatedResponse<AuditLog>> {
  const response = await apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
  return response.data;
}

export async function getHealthCheck(): Promise<{ status: string; service: string }> {
  const response = await apiClient.get<{ status: string; service: string }>('/health');
  return response.data;
}

// --- Day 2 API Functions ---

/**
 * POST /api/ai/analyze/:caseId
 * Triggers AI diagnosis and recovery recommendation.
 */
export async function analyzeCaseWithAI(caseId: string): Promise<{
  success: boolean;
  caseId: string;
  analysis: AIAnalysis;
}> {
  const response = await apiClient.post<{
    success: boolean;
    caseId: string;
    analysis: AIAnalysis;
  }>(`/ai/analyze/${caseId}`);
  return response.data;
}

/**
 * POST /api/recovery/cases/:caseId/evaluate
 * Evaluates recovery case against PolicyEngine.
 */
export async function evaluateCasePolicy(caseId: string): Promise<{
  success: boolean;
  caseId: string;
  decision: PolicyDecision;
}> {
  const response = await apiClient.post<{
    success: boolean;
    caseId: string;
    decision: PolicyDecision;
  }>(`/recovery/cases/${caseId}/evaluate`);
  return response.data;
}

/**
 * POST /api/recovery/cases/:caseId/execute
 * Executes policy-approved recovery action.
 */
export async function executeRecoveryAction(
  caseId: string,
  options: { simulateFailure?: boolean } = {}
): Promise<{
  success: boolean;
  caseId: string;
  result: {
    success: boolean;
    actionType: string;
    actionStatus: string;
    caseStatus: string;
    amountRecovered: string;
    amountRecoveredNumeric: number;
    message: string;
    stoppingRuleTriggered?: boolean;
    escalatedToHuman?: boolean;
    actionId?: string;
  };
}> {
  const response = await apiClient.post<{
    success: boolean;
    caseId: string;
    result: {
      success: boolean;
      actionType: string;
      actionStatus: string;
      caseStatus: string;
      amountRecovered: string;
      amountRecoveredNumeric: number;
      message: string;
      stoppingRuleTriggered?: boolean;
      escalatedToHuman?: boolean;
      actionId?: string;
    };
  }>(`/recovery/cases/${caseId}/execute`, options);
  return response.data;
}
