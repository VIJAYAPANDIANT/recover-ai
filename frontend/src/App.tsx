import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { PaymentDetailPage } from './pages/PaymentDetailPage';
import { RecoveryCasesPage } from './pages/RecoveryCasesPage';
import { RecoveryCaseDetailPage } from './pages/RecoveryCaseDetailPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payments/:id" element={<PaymentDetailPage />} />
          <Route path="recovery-cases" element={<RecoveryCasesPage />} />
          <Route path="recovery-cases/:id" element={<RecoveryCaseDetailPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
