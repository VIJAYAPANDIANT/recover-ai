# RecoverAI - AI Revenue Recovery Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-EA4335.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-brightgreen.svg)]()

> **Razorpay AI Buildathon Submission**  
> **Track**: AI Revenue Recovery  
> **Repository**: [https://github.com/VIJAYAPANDIANT/recover-ai](https://github.com/VIJAYAPANDIANT/recover-ai)  
> **Product Title**: RecoverAI | Autonomous Bounded Revenue Recovery Engine  

---

## Executive Summary

Digital commerce loses between **3% and 9% of total gross merchandise value (GMV)** to silent, unrecovered payment failures:
- **Involuntary Customer Churn**: Card expiry, UPI network timeouts, and transient bank server outages prematurely terminate high-LTV customer accounts.
- **Dumb Retry Storms**: Inflexible scheduled cron jobs blindly re-attempt failed cards, triggering bank fraud velocity locks and high interchange fee penalties.
- **Fragmented Context**: Merchants cannot differentiate between a recoverable technical glitch (e.g. temporary UPI switch downtime) and an unrecoverable hard decline (e.g. stolen card or closed account).
- **Compliance Blindspots**: Naive customer re-engagement scripts risk breaching customer contact preferences and privacy policies without an immutable audit trail.

**RecoverAI** replaces dumb retry scripts with an **autonomous, safety-governed AI revenue recovery engine**. It detects revenue at risk in real time, diagnoses root causes using Google Gemini, evaluates bounded interventions through a deterministic 5-rule safety engine, safely executes approved workflows, and measures recovered revenue with exact decimal precision.

---

## The Golden Rule of RecoverAI

```
+----------------------------------------------------------------------------------+
|                            THE RECOVERAI SAFETY DOCTRINE                         |
|                                                                                  |
|   1. AI Recommends.                                                              |
|   2. Deterministic Policy Engine Decides.                                        |
|   3. Bounded Executor Executes ONLY approved, non-destructive actions.           |
|   4. AI NEVER directly charges money, holds card credentials, or bypasses rules. |
+----------------------------------------------------------------------------------+
```

---

## Table of Contents

- [Core Value Proposition](#core-value-proposition)
- [System Architecture](#system-architecture)
- [Deterministic Policy Engine (5 Safety Rules)](#deterministic-policy-engine-5-safety-rules)
- [Featured Hackathon Demo Scenarios](#featured-hackathon-demo-scenarios)
- [Key Capabilities](#key-capabilities)
- [Mathematical Precision & Financial Metrics](#mathematical-precision--financial-metrics)
- [Interactive Dashboard & Analytics](#interactive-dashboard--analytics)
- [Comprehensive REST API Reference](#comprehensive-rest-api-reference)
- [Database & Seed Dataset Composition](#database--seed-dataset-composition)
- [Automated Testing & Hardening](#automated-testing--hardening)
- [Local Setup & Development](#local-setup--development)
- [Docker Setup](#docker-setup)
- [Cloud Deployment Guide](#cloud-deployment-guide)
- [Project Directory Structure](#project-directory-structure)
- [License & Authors](#license--authors)

---

## Core Value Proposition

| Traditional Recovery Approach | RecoverAI Intelligent Autonomous Engine |
| :--- | :--- |
| Blind retry loops scheduled every 24 hours | Dynamic telemetry analysis determining optimal channel & timing |
| High merchant fees & bank velocity blocks | Deterministic policy guards preventing duplicate charges or runaway retries |
| Generic "payment failed" emails ignored by users | Personalized omni-channel recovery (SMS, WhatsApp deep-links, UPI intent) |
| Hard-coded heuristics requiring developer updates | LLM-driven root cause diagnosis continuously adapted to gateway error codes |
| Opaque outcomes with zero compliance visibility | Immutable, tamper-evident PostgreSQL audit trail for every action |
| Approximate rounding in spreadsheet reporting | High-precision Decimal.js financial tracking with exact reconciliation |

---

## System Architecture

RecoverAI is engineered with strict separation between intelligence, governance, execution, and persistence:

```mermaid
flowchart TD
    subgraph INGESTION["1. Telemetry & Ingestion"]
        A[Payment Failed / Abandoned / Mandate Failed] --> B[Telemetry Ingestion Engine]
        B --> C[Risk Scoring Engine: 1 - 100 & Tiering]
    end

    subgraph INTELLIGENCE["2. AI Diagnostic Layer"]
        C --> D[Google Gemini 2.5 Flash / Groq LLM]
        D -->|Failure Analysis| E[Structured Diagnostic Vector]
        D -.->|API Outage / Timeout| F[Deterministic Fallback & Circuit Breaker]
        F --> E
    end

    subgraph GOVERNANCE["3. Deterministic Policy Engine"]
        E --> G{Policy Evaluation: 5 Deterministic Guardrails}
        G -->|Rule 1: Retries >= 3| H1[Block & Divert to Human Ops]
        G -->|Rule 2: Amount > ₹50,000| H2[Block & Route to VIP Escalation]
        G -->|Rule 3: User Opted Out| H3[Block Message & Fallback to Alternate Pay]
        G -->|Rule 4: Already Succeeded| H4[Strict No-Op]
        G -->|Rule 5: Unknown Error Code| H5[Block & Escalate for Investigation]
        G -->|All Rules Satisfied| I[Action Approved]
    end

    subgraph EXECUTION["4. Bounded Recovery Execution"]
        I --> J{Pluggable Execution Mode}
        J -->|Simulation Mode| K1[Deterministic Sandbox Executor]
        J -->|Razorpay Test Mode| K2[Razorpay Test API Adapter: is_simulated=true]
        K1 --> L{Execution Result}
        K2 --> L
        L -->|Success| M[Mark RECOVERED + Financial Increment]
        L -->|Failure Count >= 2| N[Stopping Rule: AUTOMATIC_RECOVERY_STOPPED]
    end

    subgraph LEDGER["5. Financial Ledger & Analytics"]
        M --> O[(PostgreSQL Immutable Ledger)]
        N --> O
        H1 --> O
        H2 --> O
        O --> P[Real-time Analytics Dashboard]
    end
```

---

## Deterministic Policy Engine (5 Safety Rules)

The Policy Engine serves as the non-negotiable gatekeeper between AI recommendations and execution. Even if an LLM hallucinates an aggressive retry, the Policy Engine strictly enforces:

| Rule ID | Rule Name | Trigger Condition | Intercepted Action | Safety Action / Resolution |
| :---: | :--- | :--- | :--- | :--- |
| **RULE 1** | **Max Retry Cap** | `retryCount >= 3` | `RETRY_PAYMENT` | **Blocked**: Diverts to `HUMAN_ESCALATION` to prevent card issuer fraud flags. |
| **RULE 2** | **High-Value Merchant Guard** | `amount > ₹50,000` | Automated Retries | **Blocked**: Diverts to `HUMAN_ESCALATION` for personalized VIP concierge recovery. |
| **RULE 3** | **Customer Privacy Opt-Out** | `customerOptedOut == true` | `SEND_RECOVERY_MESSAGE` | **Blocked**: Prevents messaging; falls back to `OFFER_ALTERNATE_PAYMENT` or portal notice. |
| **RULE 4** | **Double-Charge Protection** | `payment.status == 'SUCCESS'` | Any recovery action | **Blocked**: Enforces `NO_ACTION` to guarantee zero double-charging. |
| **RULE 5** | **Unknown Failure Investigation** | `failureReason == 'UNKNOWN'` | `RETRY_PAYMENT` | **Blocked**: Diverts to `HUMAN_ESCALATION` to prevent blind retries on unknown errors. |

---

## Featured Hackathon Demo Scenarios

RecoverAI seeds a deterministic dataset with **5 featured presentation cases** (`CASE-1001` through `CASE-1005`) accessible directly from the interactive top banner in the **Recovery Cases** view:

| Case ID | Scenario Name | Details & Telemetry | Expected End-to-End Flow | Result |
| :---: | :--- | :--- | :--- | :---: |
| **`CASE-1001`** | **High-Probability Recovery** | ₹2,999 · UPI · 0 retries · Transient timeout | AI recommends WhatsApp link $\to$ Policy evaluates **ALLOWED** $\to$ Executor recovers 100% | **RECOVERED** (₹2,999) |
| **`CASE-1002`** | **Retry Limit Enforcement** | ₹1,499 · Card · 3 prior retries · Repeated decline | AI recommends retry $\to$ Policy Rule 1 detects $\ge 3$ retries $\to$ **BLOCKED** | **ESCALATED** |
| **`CASE-1003`** | **High-Value Merchant Guard** | ₹75,000 · NetBanking · Exceeds ₹50,000 cap | AI recommends retry $\to$ Policy Rule 2 detects cap violation $\to$ **BLOCKED** | **ESCALATED** (VIP) |
| **`CASE-1004`** | **Stopping Rules on Failure** | ₹5,999 · UPI · Consecutive execution failures | Executor detects 2nd failure $\to$ triggers `AUTOMATIC_RECOVERY_STOPPED` | **STOPPED & ESCALATED** |
| **`CASE-1005`** | **AI Outage Circuit Breaker** | ₹12,500 · Mandate failure · AI service outage | Circuit breaker engages $\to$ Structured fallback activates with zero downtime | **SAFE ESCALATION** |

---

## Key Capabilities

### 1. Telemetry-Driven Failure Intelligence
- Analyzes granular payment telemetry: gateway response codes, card brand/BIN, issuer bank, authentication challenge failures (3D-Secure), and network latency.
- Dynamically assigns **Risk Scores (1–100)** and categorizes transactions into **LOW, MEDIUM, or HIGH risk**.

### 2. Multi-Channel Bounded Interventions
- **Smart Retries**: Calculates optimal retry windows to coincide with bank processing clearing cycles.
- **WhatsApp Checkout Links**: Instant, branded pre-filled checkout sessions delivered straight to customer messaging.
- **Alternate Gateway Routing**: Directs users to switch from congested UPI rails to NetBanking or Cards.
- **Human Escalation**: Seamless handoff to finance support teams for high-ticket or complex B2B invoices.

### 3. Batch Recovery Engine (`POST /api/recovery/run-batch`)
- Processes batches of **10, 25, 50, or 100 eligible cases** in an automated, concurrent-safe pipeline.
- Enforces global stopping rules: halts execution if error rates exceed safety thresholds.
- Generates real-time financial summaries: Revenue Recovered, Revenue Attempted, Successful vs. Blocked counts.

### 4. Enterprise Idempotency & Concurrency Guards
- Every recovery request requires an idempotent key or case reference.
- Duplicate execution requests on already recovered transactions are rejected with **HTTP 409 Conflict** and code `ALREADY_PROCESSED`.

### 5. AI Circuit Breaker & Graceful Degradation
- If Google Gemini API is unreachable, times out, or encounters rate limits, RecoverAI triggers an internal circuit breaker.
- The system automatically engages a **deterministic, rule-based diagnostic fallback** to ensure 100% platform availability.

---

## Mathematical Precision & Financial Metrics

Financial calculations avoid floating-point inaccuracies by computing all sums using **Decimal.js**:

$$\text{Revenue At Risk} = \sum \text{Amount}_{\text{status} \in \{\text{FAILED, ABANDONED, SUBSCRIPTION\_FAILED}\}}$$

$$\text{Revenue Attempted} = \sum \text{Amount}_{\text{recovery action initiated}}$$

$$\text{Revenue Recovered} = \sum \text{Amount}_{\text{case status} = \text{RECOVERED}}$$

$$\text{Revenue Not Recovered} = \text{Revenue At Risk} - \text{Revenue Recovered}$$

$$\text{Net Recovery Rate (\%)} = \left( \frac{\text{Revenue Recovered}}{\text{Revenue At Risk}} \right) \times 100$$

---

## Interactive Dashboard & Analytics

The RecoverAI user interface includes:
- **Executive Metric Cards**: Real-time display of Revenue at Risk, Revenue Recovered, Net Recovery Rate, and Active Interventions.
- **Interactive Recovery Performance Chart**: Visualizes recovery trends, success rates, and attempted volumes over time.
- **Revenue by Failure Reason Breakdown**: Highlights top financial loss categories (e.g., Insufficient Funds, Technical Glitches, Network Timeouts, Mandate Failures).
- **Risk Level Distribution Chart**: Breakdown of exposure across LOW, MEDIUM, and HIGH risk categories.
- **Strategy Performance Matrix**: Quantifies ROI and conversion rates across WhatsApp Links, Smart Retries, and Alternate Gateways.
- **Conversion Funnel Visualization**: End-to-end telemetry from Payment Failure $\to$ Risk Evaluated $\to$ AI Diagnosed $\to$ Policy Approved $\to$ Action Executed $\to$ Revenue Recovered.
- **Interactive Modals**: One-click **"Run Recovery Batch"** and **"Reset Demo Environment"** controls directly accessible on the dashboard.

---

## Comprehensive REST API Reference

| Method | Endpoint | Description | Request / Query | Response Model |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Liveness probe & system uptime | None | `{ status: "ok", timestamp }` |
| `GET` | `/api/system/status` | Detailed subsystem health & policy config | None | `{ database, aiEngine, executionMode, policies }` |
| `GET` | `/api/dashboard/metrics` | Aggregated high-precision financial KPIs | None | `{ revenueAtRisk, revenueRecovered, recoveryRate, ... }` |
| `GET` | `/api/payments` | Paginated payments with filtering | `?page=1&limit=20&status=FAILED` | `{ payments: [], pagination: {} }` |
| `GET` | `/api/payments/:id` | Individual payment record & telemetry | `:id` (UUID or paymentId) | `Payment` object with full relation tree |
| `GET` | `/api/recovery-cases` | List recovery cases by risk & status | `?status=IN_PROGRESS&riskLevel=HIGH` | `{ cases: [], pagination: {} }` |
| `GET` | `/api/recovery-cases/:id` | Detailed recovery case overview | `:id` (UUID or caseId) | `RecoveryCase` with payment & audit history |
| `POST` | `/api/ai/analyze/:id` | Trigger on-demand AI root cause diagnosis | None | `{ rootCause, recommendedAction, confidence, ... }` |
| `POST` | `/api/recovery/cases/:id/evaluate` | Run Policy Engine checks against 5 rules | None | `{ allowed: boolean, ruleTriggered, fallbackAction }` |
| `POST` | `/api/recovery/cases/:id/execute` | Execute bounded recovery action | `{ action?: string }` | `{ status, executionResult, recoveredAmount }` |
| `POST` | `/api/recovery/run-batch` | Run automated batch recovery pipeline | `{ limit: 25, simulateFailure?: boolean }` | `{ processed, successful, failed, revenueRecovered }` |
| `POST` | `/api/demo/reset` | Reset dataset to clean 500-record state | None | `{ message, count: 500, cases: 150 }` |
| `GET` | `/api/audit-logs` | Paginated immutable audit trail | `?page=1&limit=50&caseId=...` | `{ logs: [], pagination: {} }` |

---

## Database & Seed Dataset Composition

RecoverAI includes a seed engine generating a **deterministic 500-payment dataset**:

```
Total Records: 500 Transactions
├── 350 Successful Payments (Baseline Control Group)
├── 80 Failed Payments (Card declines, insufficient funds, network timeouts)
├── 40 Abandoned Checkouts (User drop-off, OTP expired, UPI intent cancelled)
└── 30 Subscription Mandate Failures (Recurring debit failures, card expired)

Recovery Cases: 150 Generated Cases
├── Includes 5 Featured Presentation Cases (CASE-1001 through CASE-1005)
└── Realistic Indian Payment Amounts (₹499, ₹999, ₹1,499, ₹2,999, ₹5,999, ₹12,500, ₹25,000, ₹75,000)
```

---

## Automated Testing & Hardening

RecoverAI includes an automated test suite executed via the native Node.js test runner:

```bash
$ npm test

> recover-ai@1.0.0 test
> npm --prefix backend run test

> recover-ai-backend@1.0.0 test
> tsx --test tests/**/*.test.ts

▶ Day 3 - Financial & Execution Safety Verification
  ✔ Policy: retryCount >= 3 blocks RETRY_PAYMENT and diverts to HUMAN_ESCALATION
  ✔ Policy: High value (> ₹50,000) blocks automated RETRY_PAYMENT
  ✔ Policy: SUCCESS payment blocks action with NO_ACTION
  ✔ Policy: UNKNOWN failure reason requires HUMAN_ESCALATION
  ✔ AI Service: Graceful failure handling and emergency circuit breaker
  ✔ Payment Executor: Safe simulated failure handling
  ✔ Measurement: Accurate Decimal financial formulas and recovery rate
✔ Day 3 - Financial & Execution Safety Verification (192.7ms)

▶ Day 4 - Final Submission & Production Hardening Test Suite
  ▶ Policy Engine Rules
    ✔ Rule 1: retryCount >= 3 blocks RETRY_PAYMENT and diverts to HUMAN_ESCALATION
    ✔ Rule 2: amount > 50000 blocks automated RETRY_PAYMENT and escalates
    ✔ Rule 3: contact opt-out blocks SEND_RECOVERY_MESSAGE and falls back to alternate payment
    ✔ Rule 4: SUCCESS payment blocks action with NO_ACTION
    ✔ Rule 5: UNKNOWN failure reason blocks RETRY_PAYMENT and requires HUMAN_ESCALATION
  ✔ Policy Engine Rules (24.9ms)
  ▶ AI Diagnostic Service
    ✔ AI Fallback generates structured diagnosis and valid probabilities
    ✔ AI Provider Outage triggers Circuit Breaker and safe Human Escalation
  ✔ AI Diagnostic Service (2.4ms)
  ▶ Recovery Executor & Payment Simulation
    ✔ SimulatedPaymentExecutor executes successful recovery with positive amount
    ✔ SimulatedPaymentExecutor failure simulation records FAILED with zero amount
    ✔ Blocked policy action is strictly prevented from executing
  ✔ Recovery Executor & Payment Simulation (189.7ms)
  ▶ Idempotency & Duplicate Execution Protection
    ✔ Duplicate recovery attempt on an already recovered case returns already executed message
  ✔ Idempotency & Duplicate Execution Protection (431.2ms)
  ▶ Batch Recovery Pipeline
    ✔ Batch runner executes bounded limit and calculates dynamic financial aggregates
  ✔ Batch Recovery Pipeline (655.2ms)
  ▶ Demo Dataset Reset
    ✔ Demo reset restores exact 500 payment dataset breakdown and 150 cases
  ✔ Demo Dataset Reset (1857.5ms)
✔ Day 4 - Final Submission & Production Hardening Test Suite (3164.2ms)

✔ Policy Engine - Rule 1: Retry limit (retryCount >= 3) blocks RETRY_PAYMENT
✔ Policy Engine - Rule 2: High-value payment (> ₹50,000) blocks automated RETRY_PAYMENT
✔ Policy Engine - Rule 3: Customer opt-out blocks SEND_RECOVERY_MESSAGE
✔ Policy Engine - Rule 4: Successful payment returns NO_ACTION
✔ Policy Engine - Rule 5: Unknown failure reason blocks RETRY_PAYMENT and requires HUMAN_ESCALATION
✔ Policy Engine - Allows legitimate action within policy bounds
✔ Policy Engine - Allows customer recovery message when not opted out
✔ AI Service - Rule fallback generates structured diagnosis and recommendation
✔ AI Service - Safe escalation when retries >= 3
✔ AI Service - Recommends alternate payment for mandate failure

ℹ tests 30
ℹ suites 8
ℹ pass 30
ℹ fail 0
```

---

## Local Setup & Development

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v16 or v18 running locally or via Docker

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/VIJAYAPANDIANT/recover-ai.git
cd recover-ai
npm run install:all
```

### 2. Configure Environment Variables
Copy the template files:
```bash
# Root environment template
cp .env.example .env

# Backend environment configuration
cp backend/.env.example backend/.env

# Frontend environment configuration
cp frontend/.env.example frontend/.env
```

### 3. Initialize Database Schema & Seed Data
```bash
cd backend
npx prisma db push
npm run seed
cd ..
```

### 4. Run Test Suite
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

### 6. Start Development Servers
```bash
# Start Backend API (runs on http://localhost:5000)
npm run dev:backend

# In a separate terminal, start Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

---

## Docker Setup

Run the complete multi-service stack with a single command:

```bash
docker-compose up -d
```

This launches:
- **PostgreSQL Database** on port `5432`
- **RecoverAI Express Backend** on port `5000`
- **RecoverAI React Frontend** on port `80` (or `5173`)

---

## Cloud Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Connect your repository to **Vercel**.
3. Set the Root Directory to `frontend`.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-backend-service.onrender.com/api
   ```
6. Deploy. The [`frontend/vercel.json`](frontend/vercel.json) file handles all SPA client-side routing automatically.

### Backend Deployment (Render)
1. In Render, select **New Web Service** and connect the repository.
2. Select Root Directory: `backend`.
3. Set Environment to `Node`.
4. Set Build Command: `npm install && npm run build && npx prisma generate`.
5. Set Start Command: `npm start`.
6. Add Environment Variables:
   ```env
   DATABASE_URL=postgresql://user:password@hostname:5432/recoverai?sslmode=require
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key
   PAYMENT_EXECUTION_MODE=SIMULATION
   ```
7. Deploy. Health check is configured at `/api/health`.

---

## Project Directory Structure

```
recover-ai/
├── LICENSE                             # MIT Open-Source License
├── README.md                           # Comprehensive Architectural & Developer Guide
├── package.json                        # Root workspace scripts (build, test, dev, seed)
├── docker-compose.yml                  # Full-stack containerized deployment specification
├── .env.example                        # Root environment configuration template
│
├── backend/                            # Node.js + Express + TypeScript Backend
│   ├── render.yaml                     # Render Web Service deployment configuration
│   ├── .env.example                    # Backend environment template
│   ├── package.json                    # Backend dependencies & test scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── prisma/
│   │   ├── schema.prisma               # Prisma relational schema (Payment, Case, AuditLog, Policy)
│   │   └── seed.ts                     # Database seeding entrypoint
│   ├── src/
│   │   ├── app.ts                      # Express application setup, security middleware & dynamic CORS
│   │   ├── server.ts                   # Server entrypoint & graceful shutdown handlers
│   │   ├── routes/                     # REST API route handlers
│   │   │   ├── dashboardRoutes.ts      # Dashboard financial metrics
│   │   │   ├── paymentRoutes.ts        # Payment telemetry & pagination
│   │   │   ├── recoveryRoutes.ts       # Recovery case inspection, evaluation & batch runner
│   │   │   ├── aiRoutes.ts             # On-demand AI diagnosis routes
│   │   │   ├── auditRoutes.ts          # Immutable audit trail queries
│   │   │   ├── demoRoutes.ts           # Demo environment reset endpoint
│   │   │   └── systemRoutes.ts         # Subsystem status & policy listing
│   │   ├── controllers/                # Business logic controllers
│   │   ├── services/                   # Core platform services
│   │   │   ├── aiService.ts            # Gemini LLM integration & circuit breaker
│   │   │   ├── policyEngine.ts         # 5 Deterministic Safety Guardrails
│   │   │   ├── paymentExecutor.ts      # Pluggable execution abstraction (Simulated & Razorpay)
│   │   │   ├── batchRecoveryService.ts # Batch processing runner & stopping rules
│   │   │   └── seedService.ts          # 500-payment generator & featured demo cases
│   │   └── types/                      # TypeScript domain models & interfaces
│   └── tests/                          # 30 Unit & Integration tests across 8 suites
│
└── frontend/                           # React 18 + Vite + Tailwind CSS Frontend
    ├── vercel.json                     # Vercel SPA routing rewrite configuration
    ├── .env.example                    # Frontend environment template
    ├── package.json                    # Frontend dependencies (React, Recharts, Lucide)
    ├── vite.config.ts                  # Vite build & proxy settings
    ├── tailwind.config.js              # Custom dark FinTech UI theme design tokens
    └── src/
        ├── App.tsx                     # Top-level routing & layout shell
        ├── api/                        # Axios HTTP client & typed service calls
        ├── components/                 # Reusable FinTech UI components
        │   ├── Navbar.tsx              # Top navigation bar
        │   ├── Sidebar.tsx             # Main navigation & quick links
        │   ├── StatCard.tsx            # KPI metric cards with change indicators
        │   ├── RiskBadge.tsx           # Visual risk tier indicator (LOW, MEDIUM, HIGH)
        │   └── RecoveryStatusBadge.tsx # Case status badges
        └── pages/                      # Application views
            ├── DashboardPage.tsx       # Executive financial KPI dashboard & charts
            ├── PaymentsPage.tsx        # Telemetry explorer & payment filtering
            ├── PaymentDetailPage.tsx   # Individual transaction inspection
            ├── RecoveryCasesPage.tsx   # Recovery cases list & featured demo scenarios
            ├── RecoveryCaseDetailPage.tsx # Interactive AI diagnosis & policy execution view
            ├── RecoveryAnalyticsPage.tsx  # Multi-view recovery performance charts
            └── AuditLogsPage.tsx       # Immutable compliance audit log ledger
```

---

## License & Authors

- **License**: Released under the [MIT License](LICENSE).
- **Author**: Vijaya Pandian T ([@VIJAYAPANDIANT](https://github.com/VIJAYAPANDIANT))
- **Hackathon**: Developed for the **Razorpay AI Buildathon  -  AI Revenue Recovery Track (2026)**.
