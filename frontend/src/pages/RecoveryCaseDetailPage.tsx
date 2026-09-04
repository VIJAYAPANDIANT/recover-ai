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
  AlertTriangle,
} from 'lucide-react';
import { getRecoveryCase } from '../services/api';
import { RecoveryCase } from '../types';
import { RiskBadge, RecoveryStatusBadge, PaymentStatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { formatINR } from './DashboardPage';

export const RecoveryCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recoveryCase, setRecoveryCase] = useState<RecoveryCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRecoveryCase(id);
      setRecoveryCase(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load recovery case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

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
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recovery Case Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Recovery Case Telemetry
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Case ID</span>
                <span className="font-mono text-xs font-semibold text-teal-300">{recoveryCase.caseId}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Current Status</span>
                <span className="font-medium text-slate-200">{recoveryCase.status}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Risk Level & Score</span>
                <div className="mt-1">
                  <RiskBadge level={recoveryCase.riskLevel} score={recoveryCase.riskScore} />
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Creation Timestamp</span>
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
                <span>Calculated Risk Metric: {recoveryCase.riskScore} / 100</span>
                <span className="text-slate-400">Deterministic Model v1.0</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
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

          {/* AI Recovery Recommendation (Day 2 Placeholder as requested) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/90 border border-indigo-500/20 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-indigo-200">AI Recovery Recommendation</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50 uppercase tracking-wider">
                Coming in Day 2
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xl mb-4">
              AI analysis will be available in Day 2. The automated recovery policy engine will evaluate bank downtime patterns, retry cooldowns, and personalized customer outreach channels.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Day 2 Planned Interventions:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Dynamic retry scheduling based on issuing bank uptime window</li>
                <li>Alternate payment method recommendation link delivery via WhatsApp/SMS</li>
                <li>Bounded agentic recovery execution with strict financial guardrails</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column (1 span) */}
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
                  <span className="font-mono text-xs text-rose-300">
                    {recoveryCase.payment.failureReason.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Retries</span>
                  <span className="font-semibold text-slate-200">{recoveryCase.payment.retryCount}</span>
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
          <History className="w-4 h-4 text-teal-400" />
          Recovery Audit Timeline
        </h2>

        {recoveryCase.auditLogs && recoveryCase.auditLogs.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {recoveryCase.auditLogs.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-950" />
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
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
    </div>
  );
};
