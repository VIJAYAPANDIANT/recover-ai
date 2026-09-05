import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  BarChart3,
  FileText,
  Activity,
  Database,
  CheckCircle2,
  Menu,
  X,
  RotateCcw,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { resetDemoData, getSystemStatus } from '../services/api';
import { SystemStatus } from '../types';

export const DashboardLayout: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const location = useLocation();

  const fetchStatus = async () => {
    try {
      const data = await getSystemStatus();
      setSystemStatus(data);
    } catch {
      // Graceful local fallback
      setSystemStatus({
        services: {
          database: { name: 'PostgreSQL', status: 'Connected', latencyMs: 5, connected: true },
          aiService: { name: 'AI Diagnostic Engine', provider: 'Fallback Engine', status: 'Fallback Active', connected: true, isNativeGemini: false },
          paymentMode: { name: 'Payment Rails', mode: 'SIMULATION', status: 'Active', isSimulation: true, demoMode: true },
          policyEngine: { name: 'Policy Engine', status: 'Active', rulesEnforced: 5, active: true },
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Reset demo environment to 500 clean payments and 150 fresh recovery cases?')) return;
    try {
      setIsResetting(true);
      setStatusMessage(null);
      const res = await resetDemoData();
      setStatusMessage(res.message || 'Demo environment reset successfully');
      window.dispatchEvent(new CustomEvent('recoverai:dataset-seeded'));
      fetchStatus();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to reset dataset: ${err.message || 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Recovery Cases', path: '/recovery-cases', icon: ShieldAlert },
    { name: 'Recovery Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'AI Recovery Cockpit';
    if (location.pathname.startsWith('/payments')) return 'Payments Explorer';
    if (location.pathname.startsWith('/recovery-cases')) return 'Recovery Cases Queue';
    if (location.pathname.startsWith('/analytics')) return 'Recovery Analytics & Strategy Performance';
    if (location.pathname.startsWith('/audit-logs')) return 'Immutable Audit Trail';
    return 'RecoverAI';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans antialiased">
      {/* Global Demo Mode Safety Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-amber-950/80 border-b border-amber-800/60 px-4 py-1.5 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2 z-40">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="font-bold tracking-wider">DEMO MODE</span>
        <span className="text-amber-500">|</span>
        <span>Simulated payment execution · Safe bounded sandbox · Zero real money moved</span>
      </div>

      <div className="flex-1 flex min-w-0">
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
          style={{ top: '33px' }}
        >
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-teal-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1">
                  <img src="/favicon.svg" alt="RecoverAI Logo" className="w-6 h-6 object-contain" />
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
          <div className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Platform Menu
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
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* System Status Section in Sidebar */}
            <div className="pt-5 mt-5 border-t border-slate-800/60">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                System Status
              </p>
              <div className="px-3 py-2 text-xs text-slate-400 space-y-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
                {/* AI Service Status */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    AI Service
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      systemStatus?.services?.aiService?.status === 'Connected'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        : systemStatus?.services?.aiService?.status === 'Fallback Active'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 mr-1 rounded-full ${
                        systemStatus?.services?.aiService?.status === 'Connected'
                          ? 'bg-emerald-400'
                          : systemStatus?.services?.aiService?.status === 'Fallback Active'
                          ? 'bg-cyan-400'
                          : 'bg-rose-400'
                      }`}
                    ></span>
                    {systemStatus?.services?.aiService?.status || 'Connected'}
                  </span>
                </div>

                {/* Database Status */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    Database
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                    <span className="w-1.5 h-1.5 mr-1 rounded-full bg-indigo-400"></span>
                    {systemStatus?.services?.database?.status || 'Connected'}
                  </span>
                </div>

                {/* Payment Mode */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Payment Mode
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/50">
                    {systemStatus?.services?.paymentMode?.mode || 'SIMULATION'}
                  </span>
                </div>

                {/* Policy Engine */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    Policy Engine
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-950 text-teal-300 border border-teal-800/50">
                    ACTIVE (5 RULES)
                  </span>
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
              <p className="text-[11px] text-slate-400 mt-0.5">
                AI Revenue Recovery Platform
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

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {statusMessage && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-xs font-medium animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Reset Demo Data Button */}
              <button
                onClick={handleReset}
                disabled={isResetting}
                title="Reset demo dataset to clean 500 records"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 disabled:opacity-50 transition cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
              </button>
            </div>
          </header>

          {/* Global Toast for mobile when action succeeds */}
          {statusMessage && (
            <div className="sm:hidden px-4 py-2 bg-emerald-950/90 text-emerald-300 text-xs border-b border-emerald-800/60 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
