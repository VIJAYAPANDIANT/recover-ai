import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  User,
  ShieldAlert,
  History,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getPayment } from '../services/api';
import { Payment } from '../types';
import { PaymentStatusBadge, RiskBadge, RecoveryStatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { formatINR } from './DashboardPage';

export const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPayment(id);
      setPayment(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  if (loading) {
    return <LoadingSpinner size="lg" label="Retrieving payment details & audit history..." />;
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/payments')}
          className="inline-flex items-center text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Payments
        </button>
        <ErrorBanner message={error || 'Payment not found'} onRetry={fetchPaymentDetails} />
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
              {payment.paymentId}
            </h1>
            <PaymentStatusBadge status={payment.status} />
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl sm:text-3xl font-bold text-white font-sans">
            {formatINR(payment.amount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Currency: <span className="font-semibold text-slate-300">{payment.currency}</span> · Method:{' '}
            <span className="font-semibold text-slate-300">{payment.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <CreditCard className="w-4 h-4 text-teal-400" />
              Payment Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Transaction ID</span>
                <span className="font-mono text-xs text-slate-300 select-all">{payment.id}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Payment Method</span>
                <span className="font-medium text-slate-200">{payment.paymentMethod}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Failure Reason</span>
                <span className="font-mono text-xs font-semibold text-rose-300">
                  {payment.failureReason === 'NONE' ? 'None (Successful)' : payment.failureReason.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Retry Attempts</span>
                <span className="font-semibold text-slate-200">
                  {payment.retryCount} {payment.retryCount === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Processed Timestamp</span>
                <span className="text-slate-300 text-xs">
                  {new Date(payment.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Last Updated</span>
                <span className="text-slate-300 text-xs">
                  {new Date(payment.updatedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Assessment Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Deterministic Risk Assessment
              </h2>
              {payment.recoveryCase ? (
                <RiskBadge level={payment.recoveryCase.riskLevel} score={payment.recoveryCase.riskScore} />
              ) : (
                <span className="text-xs text-emerald-400 font-medium">Low Risk (Success)</span>
              )}
            </div>

            {payment.recoveryCase ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Computed Risk Score: {payment.recoveryCase.riskScore} / 100</span>
                    <span className="font-semibold text-slate-400">Level: {payment.recoveryCase.riskLevel}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        payment.recoveryCase.riskLevel === 'HIGH'
                          ? 'bg-rose-500'
                          : payment.recoveryCase.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${payment.recoveryCase.riskScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300 space-y-1.5">
                  <p className="font-medium text-slate-200">Rule-Based Score Factors:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li>Payment Status weight ({payment.status})</li>
                    <li>Value threshold weight ({formatINR(payment.amount)})</li>
                    <li>Retry counter penalty ({payment.retryCount} retries)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                This transaction completed successfully with zero revenue risk.
              </p>
            )}
          </div>

          {/* AI Analysis Section (Day 2 Placeholder as requested) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/90 border border-indigo-500/20 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-indigo-200">AI Diagnostic & Recovery Engine</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50 uppercase tracking-wider">
                Coming in Day 2
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xl mb-4">
              Autonomous AI root-cause diagnosis, payment gateway telemetry interpretation, and targeted smart retry schedule recommendation will be activated in Day 2.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-slate-300 block mb-1">Root Cause</span>
                <span className="text-slate-400 italic">Available in Day 2</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-slate-300 block mb-1">Recommended Action</span>
                <span className="text-slate-400 italic">Available in Day 2</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-slate-300 block mb-1">Predicted Recovery %</span>
                <span className="text-slate-400 italic">Available in Day 2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <User className="w-4 h-4 text-cyan-400" />
              Customer Profile
            </h2>
            {payment.customer ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Customer ID</span>
                  <span className="font-mono text-xs font-semibold text-teal-300">{payment.customer.customerId}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Name</span>
                  <span className="font-semibold text-slate-100">{payment.customer.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="text-slate-300 font-mono text-xs">{payment.customer.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="text-slate-300 font-mono text-xs">{payment.customer.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Customer details unavailable.</p>
            )}
          </div>

          {/* Associated Recovery Case */}
          {payment.recoveryCase && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Recovery Case
                </h2>
                <RecoveryStatusBadge status={payment.recoveryCase.status} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Case Reference</span>
                  <span className="font-mono text-xs font-semibold text-teal-300">
                    {payment.recoveryCase.caseId}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Recoverable Amount</span>
                  <span className="font-bold text-slate-100 text-lg">
                    {formatINR(payment.recoveryCase.estimatedRecoverableAmount)}
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    to={`/recovery-cases/${payment.recoveryCase.id}`}
                    className="inline-flex items-center justify-center w-full px-3 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    View Recovery Case <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Timeline for this payment */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
          <History className="w-4 h-4 text-teal-400" />
          Audit Timeline & System Logs
        </h2>

        {payment.auditLogs && payment.auditLogs.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {payment.auditLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Dot */}
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
          <p className="text-xs text-slate-400 italic">No audit events recorded for this payment yet.</p>
        )}
      </div>
    </div>
  );
};
