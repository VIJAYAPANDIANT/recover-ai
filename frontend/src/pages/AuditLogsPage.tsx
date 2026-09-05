import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code,
} from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { AuditLog } from '../types';
import { SkeletonTable } from '../components/common/SkeletonTable';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 20;

  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAuditLogs({
        page,
        limit,
        eventType: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
        search: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
      });
      setLogs(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, eventTypeFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleMetadata = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchLogs();
          }}
          className="relative flex-1"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit message, Payment ID, or Case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
        </form>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <label className="text-slate-400">Event Type:</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Events</option>
              <option value="AI_ANALYSIS_CREATED" className="bg-slate-900">AI Analysis Created</option>
              <option value="POLICY_EVALUATED" className="bg-slate-900">Policy Evaluated</option>
              <option value="ACTION_APPROVED" className="bg-slate-900">Action Approved</option>
              <option value="ACTION_BLOCKED" className="bg-slate-900">Action Blocked</option>
              <option value="RECOVERY_STARTED" className="bg-slate-900">Recovery Started</option>
              <option value="RECOVERY_SUCCESS" className="bg-slate-900">Recovery Success</option>
              <option value="RECOVERY_FAILED" className="bg-slate-900">Recovery Failed</option>
              <option value="MESSAGE_SENT" className="bg-slate-900">Message Sent</option>
              <option value="ALTERNATE_PAYMENT_OFFERED" className="bg-slate-900">Alt Payment Offered</option>
              <option value="HUMAN_ESCALATION" className="bg-slate-900">Human Escalation</option>
              <option value="CASE_CREATED" className="bg-slate-900">Case Created</option>
              <option value="DATASET_INITIALIZED" className="bg-slate-900">Dataset Initialized</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchLogs} />}

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={10} cols={5} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description="No audit events matched your search criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Event Type</th>
                    <th className="py-3.5 px-6">Payment</th>
                    <th className="py-3.5 px-6">Recovery Case</th>
                    <th className="py-3.5 px-6">Audit Message</th>
                    <th className="py-3.5 px-6 text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-950/80 text-teal-300 border border-teal-800/50">
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                          {log.payment ? (
                            <Link
                              to={`/payments/${log.payment.id}`}
                              className="text-teal-400 hover:underline inline-flex items-center gap-1"
                            >
                              {log.payment.paymentId}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                          {log.recoveryCase ? (
                            <Link
                              to={`/recovery-cases/${log.recoveryCase.id}`}
                              className="text-amber-400 hover:underline inline-flex items-center gap-1"
                            >
                              {log.recoveryCase.caseId}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-200">
                          {log.message}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {log.metadata ? (
                            <button
                              onClick={() => toggleMetadata(log.id)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
                            >
                              <Code className="w-3 h-3" />
                              <span>{expandedLogId === log.id ? 'Hide' : 'JSON'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Metadata Row */}
                      {expandedLogId === log.id && log.metadata && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={6} className="px-6 py-3 border-b border-slate-800">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs text-teal-300 overflow-x-auto">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                of <span className="font-semibold text-slate-200">{totalCount}</span> log entries
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
