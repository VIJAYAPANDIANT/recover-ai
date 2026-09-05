import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Layers,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getDashboardMetrics, runRecoveryBatch, resetDemoData } from '../services/api';
import { DashboardMetrics, BatchRecoveryResult } from '../types';
import { RiskBadge, RecoveryStatusBadge, RecoveryActionBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';

// Helper for formatting Indian Rupee currency
export const formatINR = (val: string | number): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Batch Modal & Execution States
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchLimit, setBatchLimit] = useState(50);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStep, setBatchStep] = useState(0);
  const [batchResult, setBatchResult] = useState<BatchRecoveryResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Reset Demo modal state
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await resetDemoData();
      setResetSuccess('Demo environment restored to 500 clean payments and 150 recovery cases.');
      await fetchMetrics();
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
      setTimeout(() => {
        setResetSuccess(null);
        setResetModalOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to reset demo dataset');
    } finally {
      setIsResetting(false);
    }
  };

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    const handleDatasetSeeded = () => {
      fetchMetrics();
    };
    window.addEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
    return () => {
      window.removeEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
    };
  }, [fetchMetrics]);

  // Execute Batch Recovery Experiment
  const handleRunBatch = async () => {
    try {
      setBatchRunning(true);
      setBatchResult(null);
      setBatchError(null);
      setBatchStep(1); // Preparing cases

      // Visual pipeline progression
      setTimeout(() => setBatchStep(2), 600); // Analyzing with AI
      setTimeout(() => setBatchStep(3), 1200); // Applying policies
      setTimeout(() => setBatchStep(4), 1800); // Executing actions

      const result = await runRecoveryBatch(batchLimit, { simulateFailure });

      setBatchStep(5); // Calculating recovery
      setBatchResult(result);
      // Refresh dashboard metrics
      await fetchMetrics();
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
    } catch (err: any) {
      setBatchError(err.response?.data?.error?.message || err.message || 'Failed to execute recovery batch');
    } finally {
      setBatchRunning(false);
    }
  };

  if (loading && !metrics) {
    return <LoadingSpinner size="lg" label="Computing real-time recovery metrics from PostgreSQL..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchMetrics} />;
  }

  if (!metrics || metrics.totalPayments === 0) {
    return (
      <EmptyState
        title="No Payment Data Available"
        description="Initialize the demo environment with 500 realistic payment records and 150 recovery cases."
        actionLabel="Load Demo Data"
        onAction={fetchMetrics}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. FinTech SaaS Hero Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-teal-950/40 border border-slate-800/80 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AUTONOMOUS REVENUE RECOVERY
              </span>
              <span className="text-xs text-slate-400">Razorpay Buildathon</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Recover revenue that would otherwise be lost.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              AI-powered payment diagnosis, safe policy enforcement, and bounded recovery execution with measurable financial recovery.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 mt-6">
              <button
                onClick={() => {
                  setBatchResult(null);
                  setBatchError(null);
                  setBatchStep(0);
                  setBatchModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-teal-500/20 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Run Recovery Batch</span>
              </button>

              <button
                onClick={() => navigate('/payments?status=FAILED')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <span>View At-Risk Payments</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setResetModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-900/80 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-rose-900/40 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Hero Highlight Card: Money Recovered */}
          <div className="lg:w-80 p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
              <span className="uppercase tracking-wider">Revenue Recovered</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                VERIFIED
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {formatINR(metrics.revenueRecovered)}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Recovery Rate:</span>
              <span className="font-bold text-teal-300 text-sm">{metrics.recoveryRate}%</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Attempted: {formatINR(metrics.revenueAttempted)}</span>
              <span>Successful: {metrics.successfulRecoveries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Financial Metrics */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-teal-400" />
          Core Financial Recovery Metrics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue at Risk */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900/70 to-slate-900/70 border border-rose-900/40 shadow-sm">
            <div className="flex items-center justify-between text-rose-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue at Risk</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-200 tracking-tight">
              {formatINR(metrics.revenueAtRisk)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              {metrics.paymentsAtRisk} non-successful transactions
            </div>
          </div>

          {/* Revenue Recovered */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900/70 to-slate-900/70 border border-emerald-800/40 shadow-sm">
            <div className="flex items-center justify-between text-emerald-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue Recovered</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-200 tracking-tight">
              {formatINR(metrics.revenueRecovered)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              From {metrics.successfulRecoveries} recovered transactions
            </div>
          </div>

          {/* Recovery Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-300 tracking-tight">
              {metrics.recoveryRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Recovered / Attempted revenue
            </div>
          </div>

          {/* Payments at Risk */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Payments at Risk</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.paymentsAtRisk}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {metrics.failedPayments} failed · {metrics.abandonedPayments} abandoned · {metrics.subscriptionFailedPayments} sub
            </div>
          </div>

          {/* Successful Recoveries */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Successful Recoveries</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 tracking-tight">
              {metrics.successfulRecoveries}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Out of {metrics.recoveryAttempts} recovery attempts
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Recovery Attempts</span>
          <div className="text-lg font-semibold text-slate-100">{metrics.recoveryAttempts}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Failed Recoveries</span>
          <div className="text-lg font-semibold text-rose-400">{metrics.failedRecoveries}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Blocked by Policy</span>
          <div className="text-lg font-semibold text-yellow-400">{metrics.blockedActions}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Escalated Cases</span>
          <div className="text-lg font-semibold text-orange-400">{metrics.escalatedCases}</div>
        </div>
      </div>

      {/* 3. Recovery Funnel Visualization */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Recovery Funnel Conversion
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end pipeline progression from detection to realized recovery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Stage 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">1. At Risk</span>
            <div className="text-lg font-bold text-white mt-1">{formatINR(metrics.revenueAtRisk)}</div>
            <div className="text-[10px] text-slate-500">{metrics.paymentsAtRisk} payments</div>
          </div>

          {/* Stage 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">2. Eligible Cases</span>
            <div className="text-lg font-bold text-white mt-1">{metrics.recoveryCases}</div>
            <div className="text-[10px] text-slate-500">Case queue</div>
          </div>

          {/* Stage 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">3. AI Diagnosed</span>
            <div className="text-lg font-bold text-white mt-1">{metrics.funnel?.aiAnalyzed || 0}</div>
            <div className="text-[10px] text-slate-500">Telemetry analyzed</div>
          </div>

          {/* Stage 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">4. Policy Approved</span>
            <div className="text-lg font-bold text-white mt-1">{metrics.funnel?.policyApproved || 0}</div>
            <div className="text-[10px] text-slate-500">Safety verified</div>
          </div>

          {/* Stage 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">5. Attempted</span>
            <div className="text-lg font-bold text-white mt-1">{formatINR(metrics.revenueAttempted)}</div>
            <div className="text-[10px] text-slate-500">{metrics.recoveryAttempts} actions</div>
          </div>

          {/* Stage 6 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/40 bg-emerald-950/20">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">6. Recovered</span>
            <div className="text-lg font-bold text-emerald-300 mt-1">{formatINR(metrics.revenueRecovered)}</div>
            <div className="text-[10px] text-emerald-400/80">{metrics.successfulRecoveries} recovered</div>
          </div>
        </div>
      </div>

      {/* 4. Financial Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Recovery Performance Comparison */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              At Risk vs Attempted vs Recovered
            </h3>
            <span className="text-xs text-slate-400">Values in ₹</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.recoveryPerformance}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatINR(value), 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {metrics.recoveryPerformance.map((entry, idx) => (
                    <Cell key={`perf-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Recovery Rate:</span>
            <span className="font-semibold text-teal-300">{metrics.recoveryRate}%</span>
          </div>
        </div>

        {/* Chart 2: Actions Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Actions Executed
            </h3>
            <span className="text-xs text-slate-400">By Strategy</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.recoveryActionsBreakdown || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="action"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} executions`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Total Attempts:</span>
            <span className="font-semibold text-slate-200">{metrics.recoveryAttempts}</span>
          </div>
        </div>

        {/* Chart 3: Recovery Outcomes */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-400" />
              Recovery Outcomes
            </h3>
            <span className="text-xs text-slate-400">Status</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.recoveryOutcomesBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="outcome"
                >
                  {(metrics.recoveryOutcomesBreakdown || []).map((entry, index) => (
                    <Cell key={`outcome-cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} cases`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-slate-800 text-[11px]">
            {(metrics.recoveryOutcomesBreakdown || []).map((item) => (
              <div key={item.outcome} className="flex items-center justify-between p-1 rounded bg-slate-950/40">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.outcome}
                </span>
                <span className="font-semibold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4b. Secondary Financial Analytics: Failure Reason & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Revenue At Risk by Failure Reason */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Revenue at Risk by Failure Reason
            </h3>
            <span className="text-xs text-slate-400">Values in ₹</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(metrics.failureReasonBreakdown || []).map((item) => ({
                  reason: item.reason,
                  amount: item.revenueAtRiskNumeric,
                  count: item.count,
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 65, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <YAxis dataKey="reason" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={70} />
                <Tooltip
                  formatter={(value: any, _name: any, props: any) => [
                    `${formatINR(value)} (${props.payload.count} payments)`,
                    'At Risk',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Risk Score Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Risk Level Distribution
            </h3>
            <span className="text-xs text-slate-400">Case Queue</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.riskDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="level"
                >
                  {(metrics.riskDistribution || []).map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} cases`, `${name} Risk`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-800 text-[11px]">
            {(metrics.riskDistribution || []).map((item) => (
              <div key={item.level} className="flex items-center justify-between p-1.5 rounded bg-slate-950/40">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.level}
                </span>
                <span className="font-semibold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recent Recovery Cases Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Recent Recovery Cases
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live case telemetry awaiting AI recommendation, policy checks, or execution
            </p>
          </div>
          <Link
            to="/recovery-cases"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-slate-700 transition self-start sm:self-auto"
          >
            <span>View All Cases</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Case ID</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Risk</th>
                <th className="py-3 px-5">AI Recommendation</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Created</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.recentCases.map((c) => {
                const latestAi = c.aiAnalyses && c.aiAnalyses.length > 0 ? c.aiAnalyses[0] : null;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-teal-300">
                      <Link to={`/recovery-cases/${c.id}`} className="hover:underline">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-200">{c.payment?.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{c.payment?.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-100">
                      {formatINR(c.estimatedRecoverableAmount)}
                    </td>
                    <td className="py-3.5 px-5">
                      <RiskBadge level={c.riskLevel} score={c.riskScore} />
                    </td>
                    <td className="py-3.5 px-5">
                      {latestAi ? (
                        <RecoveryActionBadge action={latestAi.recommendedAction} />
                      ) : (
                        <span className="text-xs text-slate-500 italic">Pending AI</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <RecoveryStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/recovery-cases/${c.id}`}
                        className="inline-flex items-center text-xs font-semibold text-teal-400 hover:text-teal-300 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Run Recovery Batch Interactive Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Play className="w-4 h-4 fill-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Execute Recovery Batch</h3>
                  <p className="text-xs text-slate-400">Run reproducible AI diagnosis and bounded recovery</p>
                </div>
              </div>
              <button
                onClick={() => setBatchModalOpen(false)}
                disabled={batchRunning}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && <ErrorBanner message={batchError} />}

            {/* If Batch not yet completed, show config and pipeline runner */}
            {!batchResult ? (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Batch Size (Eligible Recovery Cases)
                  </label>
                  <div className="flex items-center gap-3">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBatchLimit(num)}
                        disabled={batchRunning}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          batchLimit === num
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                            : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {num} Cases
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Simulate Failure Scenario</span>
                      <p className="text-[11px] text-slate-400">Test stopping rules and human escalation logic</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      disabled={batchRunning}
                      className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Progress Steps during execution */}
                {batchRunning && (
                  <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-800/40 space-y-2.5 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {batchStep === 1 && 'Preparing recovery cases...'}
                        {batchStep === 2 && 'Analyzing telemetry with AI...'}
                        {batchStep === 3 && 'Applying safety and business policies...'}
                        {batchStep === 4 && 'Executing bounded recovery actions...'}
                        {batchStep === 5 && 'Compiling financial recovery totals...'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-teal-400 h-1.5 transition-all duration-300 rounded-full"
                        style={{ width: `${(batchStep / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(false)}
                    disabled={batchRunning}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRunBatch}
                    disabled={batchRunning}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-md shadow-teal-500/20 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{batchRunning ? 'Running Experiment...' : `Run Batch (${batchLimit} Cases)`}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Batch Completion Summary Screen */
              <div className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">Recovery Batch Complete</h4>
                    <p className="text-xs text-emerald-400/80">
                      Processed {batchResult.processed} cases through the RecoverAI pipeline
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Revenue Recovered</span>
                    <div className="text-lg font-bold text-emerald-300">{formatINR(batchResult.revenueRecovered)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Revenue Attempted</span>
                    <div className="text-lg font-bold text-slate-200">{formatINR(batchResult.revenueAttempted)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Successful Recoveries</span>
                    <div className="text-lg font-bold text-white">{batchResult.successful}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Escalated to Human</span>
                    <div className="text-lg font-bold text-orange-400">{batchResult.escalated}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Blocked by Policy</span>
                    <div className="text-lg font-bold text-yellow-400">{batchResult.blocked}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Failed Retries</span>
                    <div className="text-lg font-bold text-rose-400">{batchResult.failed}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchModalOpen(false);
                      setBatchResult(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Reset Demo Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Demo Environment</h3>
                  <p className="text-xs text-slate-400">Restore clean demo state</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will reset all recovery executions, audit logs, and test data, restoring the pristine demo dataset of <strong>500 payments</strong> (350 Success, 80 Failed, 40 Abandoned, 30 Subscription Failed) and <strong>150 recovery cases</strong>.
            </p>

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={isResetting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md transition flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
