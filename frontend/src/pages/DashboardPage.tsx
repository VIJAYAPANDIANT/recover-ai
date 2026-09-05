import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
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
import { getDashboardMetrics } from '../services/api';
import { DashboardMetrics } from '../types';
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

    // Listen for custom event triggered when demo dataset is reseeded or recovery action runs
    const handleDatasetSeeded = () => {
      fetchMetrics();
    };
    window.addEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
    return () => {
      window.removeEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
    };
  }, [fetchMetrics]);

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
        description="Click 'Generate Demo Dataset' above to populate 500 realistic payment records and recovery cases."
        actionLabel="Load Demo Data"
        onAction={fetchMetrics}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              DAY 2 ACTIVE
            </span>
            <span className="text-xs text-slate-400">AI Diagnosis · Safety Policies · Bounded Execution</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Revenue Recovery Cockpit
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            PostgreSQL metrics across <span className="text-teal-400 font-semibold">{metrics.totalPayments}</span> payment transactions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{metrics.successfulPayments} Succeeded</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-rose-400">
            <AlertOctagon className="w-4 h-4" />
            <span>{metrics.recoveryCases} at Risk</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>{metrics.successfulRecoveries} Recovered</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Day 2 Focus) */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          Recovery Impact & Financial Health
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Revenue At Risk */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900/70 to-slate-900/70 border border-rose-900/40 hover:border-rose-700/50 transition shadow-sm">
            <div className="flex items-center justify-between text-rose-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue at Risk</span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-200 tracking-tight">
              {formatINR(metrics.revenueAtRisk)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              Failed + Abandoned + Sub Failed
            </div>
          </div>

          {/* Revenue Recovered */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900/70 to-slate-900/70 border border-emerald-800/40 hover:border-emerald-700/50 transition shadow-sm">
            <div className="flex items-center justify-between text-emerald-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue Recovered</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-200 tracking-tight">
              {formatINR(metrics.revenueRecovered)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Verified safe recovered funds
            </div>
          </div>

          {/* Recovery Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-300 tracking-tight">
              {metrics.recoveryRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Recovered / Revenue at Risk
            </div>
          </div>

          {/* Successful Recoveries */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Successful Actions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.successfulRecoveries}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Out of {metrics.recoveryAttempts} recovery attempts
            </div>
          </div>

          {/* Escalated Cases */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Escalated to Human</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-300 tracking-tight">
              {metrics.escalatedCases}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              High risk or unresolvable
            </div>
          </div>

          {/* Blocked by Policy */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Blocked by Policy</span>
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-300 tracking-tight">
              {metrics.blockedActions}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Safety guardrails enforced
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Volume Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Total Volume</span>
          <div className="text-lg font-semibold text-slate-100">{metrics.totalPayments}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Base Success Rate</span>
          <div className="text-lg font-semibold text-emerald-400">{metrics.successRate}%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">Recovery Cases</span>
          <div className="text-lg font-semibold text-amber-400">{metrics.recoveryCases}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium">High Risk Cases</span>
          <div className="text-lg font-semibold text-rose-400">{metrics.highRiskCases}</div>
        </div>
      </div>

      {/* Day 2 Visual Analytics: Recovery Performance & Breakdown */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
          Day 2: AI Recovery Dynamics & Policy Enforcement
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Recovery Performance (At Risk vs Recovered) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                At Risk vs Recovered
              </h3>
              <span className="text-xs text-slate-400">Values in ₹</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.recoveryPerformance || [
                    { metric: 'Revenue at Risk', amount: metrics.revenueAtRiskNumeric, fill: '#f43f5e' },
                    { metric: 'Revenue Recovered', amount: metrics.revenueRecoveredNumeric, fill: '#10b981' },
                  ]}
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
                    {(metrics.recoveryPerformance || []).map((entry, idx) => (
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

          {/* Chart 2: Recovery Actions Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Actions Executed
              </h3>
              <span className="text-xs text-slate-400">By Action Type</span>
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

          {/* Chart 3: Recovery Outcomes Breakdown (Donut) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-400" />
                Recovery Outcomes
              </h3>
              <span className="text-xs text-slate-400">Audit Status</span>
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
      </div>

      {/* Day 1 Visual Analytics: Status & Failure Reason Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Status Breakdown (Donut) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-teal-400" />
              Payment Status Distribution
            </h3>
            <span className="text-xs text-slate-400">Total: 500</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {metrics.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} payments`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-slate-800 text-[11px]">
            {metrics.statusBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1 rounded bg-slate-950/40">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue at Risk by Failure Reason */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Revenue at Risk by Failure Reason
            </h3>
            <span className="text-xs text-slate-400">Values in ₹</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.failureReasonBreakdown}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="reason"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatINR(value), 'Revenue at Risk']}
                  labelFormatter={(label) => `Reason: ${label}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar
                  dataKey="revenueAtRiskNumeric"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-3 border-t border-slate-800">
            <span>Declines and Timeout errors drive the highest loss</span>
            <Link to="/recovery-cases" className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium">
              View Recovery Cases <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Recovery Cases Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Recent Recovery Cases
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recovery cases awaiting AI recommendation, policy checks, or execution
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
    </div>
  );
};

