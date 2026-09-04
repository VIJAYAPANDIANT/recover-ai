import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getPayments } from '../services/api';
import { Payment } from '../types';
import { PaymentStatusBadge, RiskBadge } from '../components/common/Badge';
import { SkeletonTable } from '../components/common/SkeletonTable';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from './DashboardPage';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 15;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');
  const [riskFilter, setRiskFilter] = useState<string>(searchParams.get('riskLevel') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (searchQuery.trim() !== '') params.search = searchQuery.trim();

      const res = await getPayments(params);
      setPayments(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, riskFilter, searchQuery]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Handle URL sync
  useEffect(() => {
    const params: any = {};
    if (page > 1) params.page = page.toString();
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
    if (searchQuery.trim() !== '') params.search = searchQuery.trim();
    setSearchParams(params, { replace: true });
  }, [page, statusFilter, riskFilter, searchQuery, setSearchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPaymentData();
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setRiskFilter('ALL');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Payment ID (PAY-...), customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-slate-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="SUCCESS" className="bg-slate-900">Success</option>
              <option value="FAILED" className="bg-slate-900">Failed</option>
              <option value="ABANDONED" className="bg-slate-900">Abandoned</option>
              <option value="SUBSCRIPTION_FAILED" className="bg-slate-900">Subscription Failed</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <label className="text-slate-400">Risk:</label>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Risk Levels</option>
              <option value="HIGH" className="bg-slate-900">High Risk</option>
              <option value="MEDIUM" className="bg-slate-900">Medium Risk</option>
              <option value="LOW" className="bg-slate-900">Low Risk</option>
            </select>
          </div>

          {(statusFilter !== 'ALL' || riskFilter !== 'ALL' || searchQuery !== '') && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchPaymentData} />}

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={10} cols={8} />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="No payments matched the active filters or search criteria."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Payment ID</th>
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Failure Reason</th>
                    <th className="py-3.5 px-6">Retry Count</th>
                    <th className="py-3.5 px-6">Risk Assessment</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/payments/${p.id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-6 font-mono text-xs font-semibold text-teal-300 group-hover:underline">
                        {p.paymentId}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-200">{p.customer?.name || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{p.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-100">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-6">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-300 font-mono">
                        {p.failureReason === 'NONE' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="text-rose-300">{p.failureReason.replace(/_/g, ' ')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-slate-300">
                        {p.retryCount} {p.retryCount === 1 ? 'retry' : 'retries'}
                      </td>
                      <td className="py-3.5 px-6">
                        {p.recoveryCase ? (
                          <RiskBadge level={p.recoveryCase.riskLevel} score={p.recoveryCase.riskScore} />
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="text-slate-400 group-hover:text-teal-400 transition-colors inline-flex items-center">
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <span className="font-semibold text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(page * limit, totalCount)}
                </span>{' '}
                of <span className="font-semibold text-slate-200">{totalCount}</span> payments
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </button>
                <span className="px-2 font-medium text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
