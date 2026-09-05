import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  getStrategyPerformance,
  getFailureReasonAnalysis,
  getRiskAnalysis,
} from '../services/api';
import {
  StrategyPerformanceItem,
  FailureReasonAnalysisItem,
  RiskAnalysisItem,
} from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { formatINR } from './DashboardPage';

export const RecoveryAnalyticsPage: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyPerformanceItem[]>([]);
  const [failureReasons, setFailureReasons] = useState<FailureReasonAnalysisItem[]>([]);
  const [riskItems, setRiskItems] = useState<RiskAnalysisItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [stratData, failData, riskData] = await Promise.all([
        getStrategyPerformance(),
        getFailureReasonAnalysis(),
        getRiskAnalysis(),
      ]);
      setStrategies(stratData);
      setFailureReasons(failData);
      setRiskItems(riskData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load recovery analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const handleDatasetSeeded = () => fetchAnalytics();
    window.addEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
    return () => window.removeEventListener('recoverai:dataset-seeded', handleDatasetSeeded);
  }, [fetchAnalytics]);

  if (loading && strategies.length === 0) {
    return <LoadingSpinner size="lg" label="Aggregating strategy and failure recovery analytics..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchAnalytics} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              REVENUE RECOVERY INTELLIGENCE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Recovery Analytics & Strategy Performance
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Understand which recovery actions yield the highest ROI and which payment failure types are most recoverable.
          </p>
        </div>
      </div>

      {/* Section 1: Risk Level Matrix */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Risk Distribution & Recovery Matrix
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskItems.map((item) => (
            <div
              key={item.riskLevel}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.riskLevel} RISK
                </span>
                <span className="text-xs text-slate-500">{item.cases} cases</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">At Risk:</span>
                  <span className="font-semibold text-slate-200">{formatINR(item.revenueAtRisk)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recovered:</span>
                  <span className="font-semibold text-emerald-400">{formatINR(item.revenueRecovered)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Recovery Rate:</span>
                  <span className="text-sm font-bold text-teal-300">{item.recoveryRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Strategy Performance */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Recovery Strategy Performance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Efficiency metrics across automated and manual recovery channels
            </p>
          </div>
        </div>

        {/* Strategy Bar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategies} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="strategyLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  name === 'amountRecovered' ? formatINR(val) : val,
                  name === 'amountRecovered' ? 'Recovered (₹)' : 'Attempts',
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Bar dataKey="attempts" name="attempts" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="successes" name="successes" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Recovery Strategy</th>
                <th className="py-3 px-4 text-right">Attempts</th>
                <th className="py-3 px-4 text-right">Successes</th>
                <th className="py-3 px-4 text-right">Failures</th>
                <th className="py-3 px-4 text-right">Amount Attempted</th>
                <th className="py-3 px-4 text-right">Amount Recovered</th>
                <th className="py-3 px-4 text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {strategies.map((strat) => (
                <tr key={strat.strategy} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {strat.strategyLabel}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">
                    {strat.attempts}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono font-semibold">
                    {strat.successes}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-400 font-mono">
                    {strat.failures}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-semibold">
                    {formatINR(strat.amountAttempted)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-300 font-semibold">
                    {formatINR(strat.amountRecovered)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-teal-300">
                    {strat.successRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Failure Reason Recoverability Analysis */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-6">
        <div className="border-b border-slate-800/80 pb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            Failure Reason Recoverability Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify which specific payment failure codes provide the greatest revenue recovery opportunity
          </p>
        </div>

        {/* Failure Reason Recovery Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failureReasons} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="reason" stroke="#64748b" fontSize={10} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  formatINR(val),
                  name === 'revenueAtRisk' ? 'Revenue At Risk' : 'Revenue Recovered',
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Bar dataKey="revenueAtRisk" name="revenueAtRisk" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenueRecovered" name="revenueRecovered" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Reason Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4 text-right">Case Count</th>
                <th className="py-3 px-4 text-right">Revenue At Risk</th>
                <th className="py-3 px-4 text-right">Revenue Recovered</th>
                <th className="py-3 px-4 text-right">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {failureReasons.map((item) => (
                <tr key={item.rawReason} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {item.reason}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">
                    {item.cases}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-300 font-semibold">
                    {formatINR(item.revenueAtRisk)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-300 font-semibold">
                    {formatINR(item.revenueRecovered)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-teal-300">
                    {item.recoveryRate}%
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
