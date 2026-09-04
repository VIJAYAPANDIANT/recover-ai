import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  FileText,
  Activity,
  Database,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { seedDemoData } from '../services/api';

export const DashboardLayout: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedSuccessMessage(null);
      const res = await seedDemoData();
      setSeedSuccessMessage(`${res.payments} payments generated successfully`);
      // Dispatch a custom event so active pages know to re-fetch their data
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
      setTimeout(() => {
        setSeedSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      alert(`Failed to seed dataset: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Recovery Cases', path: '/recovery-cases', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'Recovery Dashboard';
    if (location.pathname.startsWith('/payments')) return 'Payments Explorer';
    if (location.pathname.startsWith('/recovery-cases')) return 'Recovery Cases';
    if (location.pathname.startsWith('/audit-logs')) return 'Audit Timeline';
    return 'RecoverAI';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans antialiased">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Recover<span className="text-teal-400">AI</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                AI Revenue Recovery Platform
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-6 mt-6 border-t border-slate-800/60">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              System
            </p>
            <div className="px-3 py-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  API Status
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-950 text-teal-400 border border-teal-800/40">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  PostgreSQL
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Dataset Target</span>
                <span>500 records</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Razorpay AI Buildathon</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Phase: Day 1 Foundation MVP
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          {/* Header Action: Generate Demo Dataset Button */}
          <div className="flex items-center space-x-4">
            {seedSuccessMessage && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{seedSuccessMessage}</span>
              </div>
            )}
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Database className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Generating...' : 'Generate Demo Dataset'}</span>
            </button>
          </div>
        </header>

        {/* Global Toast for mobile when seeding */}
        {seedSuccessMessage && (
          <div className="sm:hidden px-4 py-2 bg-emerald-950/90 text-emerald-300 text-xs border-b border-emerald-800/60 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{seedSuccessMessage}</span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
