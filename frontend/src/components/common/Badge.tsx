import React from 'react';
import { PaymentStatus, RiskLevel, RecoveryStatus } from '../../types';

interface StatusBadgeProps {
  status: PaymentStatus;
}

export const PaymentStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
          SUCCESS
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/50">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-400"></span>
          FAILED
        </span>
      );
    case 'ABANDONED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/50">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
          ABANDONED
        </span>
      );
    case 'SUBSCRIPTION_FAILED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-400 border border-purple-800/50">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-purple-400"></span>
          SUBSCRIPTION FAILED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
          {status}
        </span>
      );
  }
};

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score }) => {
  switch (level) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          HIGH {score !== undefined && `(${score})`}
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          MEDIUM {score !== undefined && `(${score})`}
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          LOW {score !== undefined && `(${score})`}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {level}
        </span>
      );
  }
};

interface RecoveryStatusBadgeProps {
  status: RecoveryStatus;
}

export const RecoveryStatusBadge: React.FC<RecoveryStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'NEW':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
          NEW
        </span>
      );
    case 'ANALYZED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-950/70 text-blue-300 border border-blue-800/50">
          ANALYZED
        </span>
      );
    case 'ACTION_REQUIRED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-950/70 text-yellow-300 border border-yellow-800/50">
          ACTION REQUIRED
        </span>
      );
    case 'RECOVERED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
          RECOVERED
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-rose-950/70 text-rose-300 border border-rose-800/50">
          FAILED
        </span>
      );
    case 'ESCALATED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-orange-950/70 text-orange-300 border border-orange-800/50">
          ESCALATED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
};
