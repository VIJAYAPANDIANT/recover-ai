# RecoverAI — AI Revenue Recovery Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-blue.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)

> **Day 1 MVP** built for the **Razorpay AI Buildathon**.  
> A high-performance revenue recovery infrastructure designed to diagnose, quantify, and recover lost subscription and payment revenue.

---

## 1. Problem

Payment failures account for an estimated 2–5% of gross transaction volume across modern SaaS, direct-to-consumer (D2C), and subscription businesses. In high-volume environments such as Razorpay's merchant ecosystem, failed payments cause:

* **Involuntary Churn**: Legitimate customers lost due to temporary card declines, bank downtime, or expired mandate schedules.
* **Depleted Customer Lifetime Value (LTV)**: High acquisition costs wasted when billing failures go unaddressed.
* **Manual Recovery Overhead**: Finance teams relying on static retry rules or tedious manual spreadsheet reconciliation.
* **Lack of Visibility**: Blind spots in understanding exact "Revenue at Risk" across different payment failure modes.

---

## 2. Solution

**RecoverAI** is an autonomous revenue recovery engine. It monitors payment events in real time, deterministically evaluates recoverable risk, generates dedicated recovery cases, and logs every transition for auditing.

* **Deterministic Risk Scoring Engine**: Evaluates payment status, monetary value, and retry counts to prioritize high-value recovery opportunities.
* **Precise Monetary Accounting**: Utilizes PostgreSQL Decimal precision arithmetic to ensure zero floating-point discrepancies across financial aggregates.
* **Real-Time Recovery Dashboard**: Surfaces critical metrics—including Revenue at Risk, Recovery Cases, and Failure Distribution—directly computed from PostgreSQL.
* **Complete Audit Trails**: Captures structured event timelines for every recovery action.

---

## 3. Day 1 Features

* **Interactive React SaaS Dashboard**:
  * Real-time metric cards: *Total Volume*, *Revenue at Risk (INR)*, *Failed Payments*, *Recovery Cases*, *High Risk Cases*, and *Success Rate*.
  * Interactive Recharts visualizations:
    * **Payment Status Breakdown** (Donut chart: Success, Failed, Abandoned, Subscription Failed)
    * **Revenue at Risk by Failure Reason** (Bar chart grouped by failure category)
    * **Recovery Cases by Risk Level** (High, Medium, Low breakdown)
  * Recent Cases live table with risk badge indicators and direct inspection links.
* **Dataset Generator**:
  * Single-click **"Generate Demo Dataset"** button on the UI (and backend `POST /api/payments/seed`) generating exactly 500 realistic payment records across 50 realistic Indian customer profiles.
* **Payments Explorer (`/payments`)**:
  * Multi-dimensional filtering by Payment Status (`SUCCESS`, `FAILED`, `ABANDONED`, `SUBSCRIPTION_FAILED`) and Risk Level (`HIGH`, `MEDIUM`, `LOW`).
  * Live search by Payment ID, Customer Name, and Customer Email.
  * Server-side pagination with record counters.
* **Payment Details Page (`/payments/:id`)**:
  * Transaction breakdown, customer metadata, and deterministic risk score progress meter.
  * Associated recovery case linking and audit timeline.
  * Future AI Diagnostic placeholder (Day 2 roadmap).
* **Recovery Cases Hub (`/recovery-cases` & `/recovery-cases/:id`)**:
  * Dedicated queue for at-risk transactions requiring intervention.
  * Detailed case telemetry, estimated recoverable amount, and audit history.
* **Audit Logs Page (`/audit-logs`)**:
  * System-wide chronological event stream with expandable JSON metadata for full traceability.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RecoverAI Frontend                       │
│        React 18 + Vite + Tailwind CSS + Lucide + Recharts   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (Axios)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    RecoverAI Backend                        │
│             Node.js + Express + TypeScript                  │
│                                                             │
│  ┌───────────────────────┐      ┌────────────────────────┐  │
│  │   Risk Scoring Engine │      │ Metrics Calculation    │  │
│  └───────────────────────┘      └────────────────────────┘  │
│  ┌───────────────────────┐      ┌────────────────────────┐  │
│  │ 500-Record Seed Svc   │      │ Central Error Handling │  │
│  └───────────────────────┘      └────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM (v6.4)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│      Customers | Payments | RecoveryCases | AuditLogs       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

### Frontend
* **Framework**: React 18 with TypeScript
* **Tooling**: Vite
* **Styling**: Tailwind CSS with dark-mode SaaS aesthetics
* **Icons**: Lucide React
* **Charts**: Recharts
* **Routing**: React Router v7
* **HTTP Client**: Axios

### Backend
* **Runtime**: Node.js (v20+) with TypeScript
* **Framework**: Express
* **Database ORM**: Prisma ORM
* **Database**: PostgreSQL
* **Financial Calculations**: Decimal.js & PostgreSQL Decimal types
* **Utilities**: dotenv, cors, tsx

---

## 6. Project Structure

```text
recover-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/           # Badge, LoadingSpinner, SkeletonTable, EmptyState, ErrorBanner
│   │   ├── layouts/              # DashboardLayout with SaaS sidebar and navigation
│   │   ├── pages/                # Dashboard, Payments, PaymentDetail, RecoveryCases, CaseDetail, AuditLogs
│   │   ├── services/             # Axios API client
│   │   ├── types/                # TypeScript domain models
│   │   ├── App.tsx               # Route declarations
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Tailwind base & theme
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/          # paymentController, dashboardController, recoveryController, auditLogController
│   │   ├── middleware/           # errorHandler, notFoundHandler
│   │   ├── routes/               # Modular Express routers
│   │   ├── services/             # riskScoreService, seedService, metricsService
│   │   ├── utils/                # prisma client singleton
│   │   ├── app.ts                # Express application configuration
│   │   └── server.ts             # Server entry point with graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma         # Models: Customer, Payment, RecoveryCase, AuditLog
│   │   └── seed.ts               # Database seed runner
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docker-compose.yml            # PostgreSQL container definition
├── package.json                  # Root orchestration scripts
├── .gitignore
└── README.md
```

---

## 7. Local Setup

### Prerequisites
* Node.js (v18 or higher, v22+ recommended)
* npm (v9+)
* Docker & Docker Compose (or local PostgreSQL 16+)

### Step-by-Step Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   cd c:\Razorpay
   npm run install:all
   ```

2. **Start the PostgreSQL database**:
   * *Via Docker Compose*:
     ```bash
     docker compose up -d
     ```
   * *Or via local PostgreSQL*: Ensure PostgreSQL is listening and update `backend/.env`.

3. **Configure Environment Variables**:
   * Ensure `backend/.env` exists (copied from `backend/.env.example`).
   * Ensure `frontend/.env` exists (copied from `frontend/.env.example`).

4. **Initialize Database and Seed 500 Records**:
   ```bash
   cd backend
   npx prisma db push
   npm run seed
   ```

5. **Run the Application**:
   * **Terminal 1 (Backend)**:
     ```bash
     cd backend
     npm run dev
     ```
     Server runs on `http://localhost:5000`.
   * **Terminal 2 (Frontend)**:
     ```bash
     cd frontend
     npm run dev
     ```
     Dashboard runs on `http://localhost:5173`.

---

## 8. Environment Variables

### Backend (`backend/.env`)
```env
# PostgreSQL connection string
DATABASE_URL=postgresql://recoverai:recoverai@localhost:5432/recoverai?schema=public

# API server port
PORT=5000

# Allowed frontend origin for CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

---

## 9. Database Setup & Data Distribution

The Day 1 seed script generates exactly **500 synthetic payment records** with strict distribution:

| Status | Count | Failure Reason | Recovery Case Created? |
| :--- | :--- | :--- | :--- |
| **SUCCESS** | **350** | `NONE` | No |
| **FAILED** | **80** | Distributed (`BANK_ERROR`, `CARD_DECLINED`, `INSUFFICIENT_FUNDS`, etc.) | **Yes (80 cases)** |
| **ABANDONED** | **40** | `TIMEOUT`, `UNKNOWN` | **Yes (40 cases)** |
| **SUBSCRIPTION_FAILED** | **30** | `MANDATE_FAILURE`, `INSUFFICIENT_FUNDS`, etc. | **Yes (30 cases)** |
| **TOTAL** | **500** | — | **150 Recovery Cases** |

### Deterministic Risk Scoring Formula
$$\text{Score} = \text{Status Weight} + \text{Amount Weight} + \text{Retry Weight} \quad (\text{Capped at } 100)$$

* **Status Weight**: `FAILED (+40)`, `ABANDONED (+30)`, `SUBSCRIPTION_FAILED (+45)`, `SUCCESS (0)`.
* **Amount Weight**: $\ge ₹10,000 (+25)$, $\ge ₹5,000 (+15)$, $\ge ₹1,000 (+10)$, otherwise $(+5)$.
* **Retry Weight**: $\ge 3 \text{ retries } (+20)$, $2 \text{ retries } (+15)$, $1 \text{ retry } (+10)$, $0 \text{ retries } (+5)$.
* **Risk Levels**: `0–39: LOW`, `40–69: MEDIUM`, `70–100: HIGH`.

---

## 10. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & service readiness |
| `POST` | `/api/payments/seed` | Safe, idempotent generation/reset of 500 records |
| `GET` | `/api/dashboard/metrics` | Real-time aggregates computed from DB |
| `GET` | `/api/payments` | Paginated payments with search & filters |
| `GET` | `/api/payments/:id` | Payment details, customer profile & audit timeline |
| `GET` | `/api/payments/failed` | Filtered list of non-successful payments |
| `GET` | `/api/recovery/cases` | Paginated recovery cases queue |
| `GET` | `/api/recovery/cases/:id`| Recovery case telemetry & audit history |
| `GET` | `/api/audit-logs` | Chronological event logs with JSON metadata |

---

## 11. Screenshots Placeholder

| Dashboard Overview | Payments Explorer |
| :---: | :---: |
| *[Screenshot: Dashboard with KPI Cards & Charts]* | *[Screenshot: Filterable Payments Table]* |

| Payment Details & Risk Gauge | Recovery Case Telemetry |
| :---: | :---: |
| *[Screenshot: Risk Assessment & Audit Timeline]* | *[Screenshot: Recovery Case & AI Placeholder]* |

---

## 12. Future AI Features (Day 2 Roadmap)

Day 1 establishes the rock-solid data ingestion, deterministic scoring, and observability foundation. Day 2 introduces the autonomous AI recovery intelligence:

1. **AI Failure Diagnosis**:
   * Natural language analysis of bank response codes, ISO 8583 error strings, and gateway telemetry.
   * Merchant-friendly root-cause summaries explaining *why* the failure occurred.
2. **AI Recovery Recommendations**:
   * Dynamic prediction of optimal retry timing based on historical bank processing windows and customer behavior.
   * Personalized recovery action plans (e.g., instant UPI intent link via WhatsApp vs. automated card mandate retry).
3. **Policy Engine**:
   * Merchant-configurable rules specifying retry thresholds, maximum automated interventions, and escalation criteria.
4. **Bounded Recovery Execution**:
   * Safe, autonomous execution with strict financial boundaries (no runaway retries, duplicate charges, or excessive notifications).
5. **Audit-Driven Recovery Workflow**:
   * Every AI suggestion, decision threshold, and recovery trigger logged into the immutable `AuditLog` timeline.

---

## License

ISC License © 2026 RecoverAI Team. Built for the Razorpay AI Buildathon.
