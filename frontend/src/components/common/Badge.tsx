import React from 'react';
import { PaymentStatus, RiskLevel, RecoveryStatus, RecoveryActionType, RecoveryActionStatus } from '../../types';

interface ActionStatusBadgeProps {
  status: RecoveryActionStatus;
}

export const RecoveryActionStatusBadge: React.FC<ActionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
          SUCCESS
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-700/50">
          FAILED
        </span>
      );
    case 'ESCALATED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950 text-orange-300 border border-orange-700/50">
          ESCALATED
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-700/50">
          {status}
        </span>
      );
  }
};

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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-950/80 text-orange-300 border border-orange-700/60 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-400"></span>
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

interface RecoveryActionBadgeProps {
  action: RecoveryActionType;
}

export const RecoveryActionBadge: React.FC<RecoveryActionBadgeProps> = ({ action }) => {
  switch (action) {
    case 'RETRY_PAYMENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
          RETRY PAYMENT
        </span>
      );
    case 'SEND_RECOVERY_MESSAGE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-950 text-teal-300 border border-teal-800/50">
          SEND MESSAGE
        </span>
      );
    case 'OFFER_ALTERNATE_PAYMENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/50">
          ALT PAYMENT
        </span>
      );
    case 'HUMAN_ESCALATION':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-950 text-orange-300 border border-orange-800/50">
          HUMAN ESCALATION
        </span>
      );
    case 'NO_ACTION':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">
          NO ACTION
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
          {action}
        </span>
      );
  }
};
