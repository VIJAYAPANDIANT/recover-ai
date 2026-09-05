import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  CreditCard,
  User,
  History,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
} from 'lucide-react';
import {
  getRecoveryCase,
  analyzeCaseWithAI,
  evaluateCasePolicy,
  executeRecoveryAction,
} from '../services/api';
import { RecoveryCase, PolicyDecision } from '../types';
import {
  RiskBadge,
  RecoveryStatusBadge,
  PaymentStatusBadge,
  RecoveryActionBadge,
} from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { formatINR } from './DashboardPage';

export const RecoveryCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recoveryCase, setRecoveryCase] = useState<RecoveryCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Policy Evaluation states
  const [policyDecision, setPolicyDecision] = useState<PolicyDecision | null>(null);
  const [isEvaluatingPolicy, setIsEvaluatingPolicy] = useState<boolean>(false);

  // Execution states
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fetchCaseDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRecoveryCase(id);
      setRecoveryCase(data);

      // If already has an AI analysis, automatically evaluate policy
      if (data.aiAnalyses && data.aiAnalyses.length > 0) {
        evaluateCurrentPolicy(data.caseId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load recovery case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const evaluateCurrentPolicy = async (caseId: string) => {
    try {
      setIsEvaluatingPolicy(true);
      const res = await evaluateCasePolicy(caseId);
      setPolicyDecision(res.decision);
    } catch (err: any) {
      console.warn('Policy evaluation warning:', err.message);
    } finally {
      setIsEvaluatingPolicy(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

  // Handle "Analyze with AI" trigger
  const handleAnalyze = async () => {
    if (!recoveryCase) return;
    try {
      setIsAnalyzing(true);
      setAiError(null);
      setExecutionResult(null);

      await analyzeCaseWithAI(recoveryCase.caseId);

      // Re-fetch updated case with new analysis
      const updatedCase = await getRecoveryCase(recoveryCase.id);
      setRecoveryCase(updatedCase);

      // Evaluate policy for the newly generated recommendation
      await evaluateCurrentPolicy(recoveryCase.caseId);

      // Dispatch global event so metrics refresh
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
    } catch (err: any) {
      setAiError(err.response?.data?.error?.message || err.message || 'AI diagnosis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle "Execute Recovery Action" trigger
  const handleExecute = async () => {
    if (!recoveryCase || !policyDecision || !policyDecision.allowed) return;
    try {
      setIsExecuting(true);
      setShowConfirmModal(false);

      const res = await executeRecoveryAction(recoveryCase.caseId, {
        simulateFailure,
      });

      setExecutionResult(res.result);

      // Refresh case to update status, payment status, and audit trail
      const updatedCase = await getRecoveryCase(recoveryCase.id);
      setRecoveryCase(updatedCase);

      // Notify dashboard to re-compute metrics
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
    } catch (err: any) {
      alert(`Execution failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading recovery case telemetry and audit timeline..." />;
  }

  if (error || !recoveryCase) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/recovery-cases')}
          className="inline-flex items-center text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Recovery Cases
        </button>
        <ErrorBanner message={error || 'Recovery case not found'} onRetry={fetchCaseDetails} />
      </div>
    );
  }

  const latestAnalysis = recoveryCase.aiAnalyses && recoveryCase.aiAnalyses.length > 0
    ? recoveryCase.aiAnalyses[0]
    : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-teal-400 transition mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
              {recoveryCase.caseId}
            </h1>
            <RecoveryStatusBadge status={recoveryCase.status} />
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
            Estimated Recoverable Value
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-sans">
            {formatINR(recoveryCase.estimatedRecoverableAmount)}
          </div>
        </div>
      </div>

      {/* Grid: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Telemetry, AI Section, Policy Section, Execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recovery Case Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Recovery Case Telemetry
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Case Reference</span>
                <span className="font-mono text-xs font-semibold text-teal-300">{recoveryCase.caseId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Current Lifecycle State</span>
                <span className="font-medium text-slate-200">{recoveryCase.status}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Risk Score & Severity</span>
                <div className="mt-1">
                  <RiskBadge level={recoveryCase.riskLevel} score={recoveryCase.riskScore} />
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Created Timestamp</span>
                <span className="text-slate-300 text-xs">
                  {new Date(recoveryCase.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>
            </div>

            {/* Risk Gauge */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Deterministic Risk Score: {recoveryCase.riskScore} / 100</span>
                <span className="text-slate-400">{recoveryCase.riskLevel} Risk</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    recoveryCase.riskLevel === 'HIGH'
                      ? 'bg-rose-500'
                      : recoveryCase.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${recoveryCase.riskScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI RECOVERY ANALYSIS SECTION (Day 2 Core) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-indigo-500/30 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-indigo-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-inner">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    AI Recovery Diagnosis & Recommendation
                  </h3>
                  <p className="text-xs text-indigo-300/80">
                    Autonomous payment telemetry interpretation powered by Gemini
                  </p>
                </div>
              </div>

              {/* Action Button: Analyze with AI */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer self-start sm:self-auto"
              >
                <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>
                  {isAnalyzing
                    ? 'Analyzing...'
                    : latestAnalysis
                    ? 'Re-Analyze with AI'
                    : 'Analyze with AI'}
                </span>
              </button>
            </div>

            {aiError && <ErrorBanner message={aiError} onRetry={handleAnalyze} />}

            {latestAnalysis ? (
              <div className="space-y-5 animate-fade-in">
                {/* Diagnosis Text */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 block mb-1">
                    Telemetry Diagnosis
                  </span>
                  <p className="text-sm text-slate-100 leading-relaxed font-sans">
                    {latestAnalysis.diagnosis}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Recommended Action */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs font-medium text-slate-400 block mb-1.5">
                      Recommended Action
                    </span>
                    <RecoveryActionBadge action={latestAnalysis.recommendedAction} />
                  </div>

                  {/* Confidence */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                      <span>Model Confidence</span>
                      <span className="text-slate-200 font-bold">
                        {(latestAnalysis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{ width: `${latestAnalysis.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Expected Recovery Probability */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                      <span>Expected Recovery %</span>
                      <span className="text-emerald-300 font-bold">
                        {(latestAnalysis.expectedRecoveryProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${latestAnalysis.expectedRecoveryProbability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Strategic Rationale */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300">
                  <span className="font-semibold text-slate-200 block mb-0.5">AI Strategic Justification:</span>
                  <p className="text-slate-400 leading-normal">{latestAnalysis.reason}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Provider: {latestAnalysis.provider} · Model: {latestAnalysis.model}</span>
                  <span>Analyzed {new Date(latestAnalysis.createdAt).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <Sparkles className="w-8 h-8 text-indigo-400/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300 mb-1">No AI Analysis Run Yet</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Click 'Analyze with AI' above to trigger autonomous telemetry diagnosis, root cause detection, and recovery strategy recommendation.
                </p>
              </div>
            )}
          </div>

          {/* POLICY & SAFETY ENGINE DECISION SECTION */}
          {latestAnalysis && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-teal-400" />
                  <h3 className="text-base font-semibold text-white">
                    Policy & Safety Engine Validation
                  </h3>
                </div>
                {policyDecision && (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      policyDecision.allowed
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                        : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
                    }`}
                  >
                    {policyDecision.allowed ? '✓ ACTION APPROVED' : '⚠ ACTION BLOCKED'}
                  </span>
                )}
              </div>

              {isEvaluatingPolicy ? (
                <LoadingSpinner size="sm" label="Validating with safety policies..." />
              ) : policyDecision ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border text-sm ${
                      policyDecision.allowed
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {policyDecision.allowed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block text-white mb-0.5">
                          {policyDecision.allowed
                            ? `Approved Action: ${policyDecision.action.replace(/_/g, ' ')}`
                            : `Blocked: ${policyDecision.action.replace(/_/g, ' ')}`}
                        </span>
                        <p className="text-xs leading-relaxed opacity-90">{policyDecision.reason}</p>
                        {policyDecision.fallbackAction && (
                          <div className="mt-2 text-xs font-medium text-amber-300">
                            Automatic Safe Fallback:{' '}
                            <span className="font-bold underline">{policyDecision.fallbackAction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXECUTION BAR */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Failure Simulation Demo Toggle */}
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Simulate Failure Scenario (Tests Stopping Rule & Escalation)</span>
                    </label>

                    {/* Execute Action Button */}
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!policyDecision.allowed || isExecuting || recoveryCase.status === 'RECOVERED'}
                      className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        {isExecuting
                          ? 'Executing Action...'
                          : recoveryCase.status === 'RECOVERED'
                          ? 'Already Recovered'
                          : `Execute ${policyDecision.action.replace(/_/g, ' ')}`}
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* EXECUTION RESULT BANNER */}
          {executionResult && (
            <div
              className={`p-5 rounded-2xl border animate-fade-in ${
                executionResult.success
                  ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-600/60 text-rose-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {executionResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {executionResult.success
                      ? '✓ Bounded Recovery Execution Succeeded'
                      : '⚠ Recovery Execution Failed Safely'}
                  </h4>
                  <p className="text-xs leading-relaxed">{executionResult.message}</p>
                  {executionResult.amountRecoveredNumeric > 0 && (
                    <div className="mt-2 text-sm font-bold text-emerald-300">
                      Amount Recovered: {formatINR(executionResult.amountRecoveredNumeric)}
                    </div>
                  )}
                  {executionResult.stoppingRuleTriggered && (
                    <div className="mt-1.5 text-xs text-amber-300 font-medium">
                      Stopping rule enforced: Retries exhausted. Case escalated for human review.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Payment Info, Customer Contact, Recovery History */}
        <div className="space-y-6">
          {/* Associated Payment Card */}
          {recoveryCase.payment && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  Payment Details
                </h2>
                <PaymentStatusBadge status={recoveryCase.payment.status} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Payment ID</span>
                  <Link
                    to={`/payments/${recoveryCase.payment.id}`}
                    className="font-mono text-xs font-semibold text-teal-300 hover:underline flex items-center gap-1"
                  >
                    {recoveryCase.payment.paymentId}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Amount</span>
                  <span className="font-bold text-slate-100">{formatINR(recoveryCase.payment.amount)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Failure Reason</span>
                  <span className="font-mono text-xs text-rose-300 font-semibold">
                    {recoveryCase.payment.failureReason.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Retry Attempts</span>
                  <span className="font-semibold text-slate-200">
                    {recoveryCase.payment.retryCount} / 3 max
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Payment Method</span>
                  <span className="font-medium text-slate-300">{recoveryCase.payment.paymentMethod}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Details Card */}
          {recoveryCase.payment?.customer && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
                <User className="w-4 h-4 text-cyan-400" />
                Customer Contact
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Name</span>
                  <span className="font-semibold text-slate-100">{recoveryCase.payment.customer.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="text-slate-300 font-mono text-xs">{recoveryCase.payment.customer.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="text-slate-300 font-mono text-xs">{recoveryCase.payment.customer.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Contact Opt-Out</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {recoveryCase.payment.customer.contactOptOut ? (
                      <span className="text-rose-400">Yes (Opted Out)</span>
                    ) : (
                      <span className="text-emerald-400">No (Contact Allowed)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
          <History className="w-4 h-4 text-teal-400" />
          Autonomous Recovery Audit Trail
        </h2>

        {recoveryCase.auditLogs && recoveryCase.auditLogs.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {recoveryCase.auditLogs.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-teal-400 ring-4 ring-slate-950" />
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider">
                      {log.eventType}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{log.message}</p>
                  {log.metadata && (
                    <pre className="mt-3 p-2.5 rounded-lg bg-slate-900/90 text-[11px] font-mono text-slate-400 overflow-x-auto border border-slate-800">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No case events recorded yet.</p>
        )}
      </div>

      {/* Confirmation Modal for Execution */}
      {showConfirmModal && policyDecision && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Recovery Action</h3>
            </div>
            <p className="text-sm text-slate-300">
              Execute <span className="font-bold text-teal-300">{policyDecision.action.replace(/_/g, ' ')}</span>?
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="text-slate-300 font-medium">Policy Verification:</p>
              <p>{policyDecision.reason}</p>
              {simulateFailure && (
                <p className="text-rose-400 font-semibold mt-1">
                  ⚠️ Note: Failure simulation toggle is ON.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition cursor-pointer"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
