import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
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
import { RiskBadge, RecoveryStatusBadge } from '../components/common/Badge';
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

    // Listen for custom event triggered when demo dataset is reseeded
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
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Revenue Recovery Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time PostgreSQL metrics computed across <span className="text-teal-400 font-semibold">{metrics.totalPayments}</span> payment transactions.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
          <Clock className="w-4 h-4 text-teal-400" />
          <span>Status: 350 Succeeded, 150 At Risk</span>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Payments */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.totalPayments.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            All processed transactions
          </div>
        </div>

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

        {/* Failed Payments */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed Payments</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.failedPayments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.abandonedPayments} abandoned · {metrics.subscriptionFailedPayments} sub failed
          </div>
        </div>

        {/* Recovery Cases */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recovery Cases</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.recoveryCases}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Generated for non-success
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk Cases</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 tracking-tight">
            {metrics.highRiskCases}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.mediumRiskCases} Medium · {metrics.lowRiskCases} Low
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 tracking-tight">
            {metrics.successRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.successfulPayments} / {metrics.totalPayments} completed
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Payment Status Breakdown (Donut) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-teal-400" />
              Payment Status Distribution
            </h3>
            <span className="text-xs text-slate-400">Total: 500</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
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

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            {metrics.statusBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-950/40">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Revenue at Risk by Failure Reason */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Revenue at Risk by Failure Reason
            </h3>
            <span className="text-xs text-slate-400">Values in ₹</span>
          </div>

          <div className="h-64 w-full">
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

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800">
            <span>Primary driver: Card Declined & Timeout Errors</span>
            <Link to="/payments?status=FAILED" className="text-teal-400 hover:text-teal-300 flex items-center gap-1">
              View Failed Payments <ArrowUpRight className="w-3.5 h-3.5" />
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
              Latest generated recovery cases pending analysis and intervention
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
                <th className="py-3 px-6">Case ID</th>
                <th className="py-3 px-6">Payment ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Risk Assessment</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Created</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.recentCases.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3.5 px-6 font-mono text-xs font-semibold text-teal-300">
                    <Link to={`/recovery-cases/${c.id}`} className="hover:underline">
                      {c.caseId}
                    </Link>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                    <Link to={`/payments/${c.payment?.id}`} className="hover:underline hover:text-white">
                      {c.payment?.paymentId || 'N/A'}
                    </Link>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="font-medium text-slate-200">{c.payment?.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-400">{c.payment?.customer?.email}</div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-100">
                    {formatINR(c.estimatedRecoverableAmount)}
                  </td>
                  <td className="py-3.5 px-6">
                    <RiskBadge level={c.riskLevel} score={c.riskScore} />
                  </td>
                  <td className="py-3.5 px-6">
                    <RecoveryStatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      to={`/recovery-cases/${c.id}`}
                      className="inline-flex items-center text-xs font-semibold text-teal-400 hover:text-teal-300 group-hover:translate-x-0.5 transition-transform"
                    >
                      Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
