# RecoverAI — AI Revenue Recovery Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-blue.svg)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-orange.svg)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)

> **Day 1 + Day 2 + Day 3 Complete Build** for the **Razorpay AI Buildathon** (AI Revenue Recovery Track).  
> An autonomous revenue recovery platform that detects revenue at risk, diagnoses payment failure root causes using AI, enforces strict safety policies, executes bounded recoveries via pluggable payment executors, and measures financial recovery outcomes in real-time.

---

## 1. Core Architecture Philosophy

RecoverAI strictly enforces separation of concerns:

```text
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│       AI Engine         │       │      Policy Engine      │       │    Payment Executor     │
│  (Gemini / Structured)  │ ───►  │    (Safety & Bounds)    │ ───►  │ (Pluggable Abstraction)│
│                         │       │                         │       │                         │
│ Diagnoses failure cause │       │ Validates 5 safety rules│       │ Safe execution modes:   │
│ Recommends next action  │       │ Prevents duplicate/risk │       │ - SimulatedPaymentExec  │
│ Computes probabilities  │       │ Overrides or escalates  │       │ - RazorpayTestExecutor  │
└─────────────────────────┘       └─────────────────────────┘       │                         │
                                                                    │ Actions:                │
                                                                    │ - RETRY_PAYMENT         │
                                                                    │ - SEND_RECOVERY_MESSAGE │
                                                                    │ - OFFER_ALTERNATE_PAY   │
                                                                    │ - HUMAN_ESCALATION      │
                                                                    └────────────┬────────────┘
                                                                                 │
                                                                                 ▼
                                                                    ┌─────────────────────────┐
                                                                    │       Audit Trail       │
                                                                    │ (Immutable Postgres Log)│
                                                                    └─────────────────────────┘
```

> **CRITICAL SAFETY GUARANTEE**: RecoverAI **NEVER** charges real money, executes financial transactions directly, or communicates unsupervised. All actions are executed either in safe simulation mode or against Razorpay's isolated test sandbox with `notes.is_simulated = "true"`.

---

## 2. Core Capabilities

### Day 1: Ingestion, Detection & Foundation
* 500 realistic synthetic payments across UPI, Cards, NetBanking, and Wallets.
* 150 auto-detected recovery cases with calculated risk scores (1-100) and risk tiers (`LOW`, `MEDIUM`, `HIGH`).
* Complete PostgreSQL schema with Prisma ORM and full audit logging.

### Day 2: AI Diagnosis + Safety Policy Engine + Bounded Execution
* **AI Diagnosis Engine**: Google Gemini 2.5 with structured output schema and deterministic fallback.
* **Safety & Business Policy Engine**: 5 deterministic rules protecting customer trust and preventing repeated declines.
* **Bounded Execution Engine**: Simulates SMS/WhatsApp messages, UPI deep-links, gateway retries, and escalations.

### Day 3: Measurement + Razorpay Test Integration + Reliability + Production Dashboard
* **Real Batch Recovery Runner (`POST /api/recovery/run-batch`)**:
  * Processes up to $N$ eligible recovery cases in a single automated pipeline.
  * Dynamically executes: AI diagnosis $\to$ Policy validation $\to$ Bounded execution $\to$ Audit logging $\to$ Real-time financial metrics.
  * Zero hardcoding: all aggregates are dynamically calculated and committed to PostgreSQL.
* **Pluggable Payment Executor Abstraction (`paymentExecutor.ts`)**:
  * `PaymentExecutor` interface standardizes `retryPayment()`, `sendRecoveryMessage()`, and `offerAlternatePayment()`.
  * `SimulatedPaymentExecutor`: Fully bounded, zero external side-effects, fast deterministic simulation.
  * `RazorpayTestExecutor`: Safe test sandbox integration creating test payment links with `notes.is_simulated: true`.
* **Precision Financial Measurement (`Decimal.js`)**:
  * Real-time metrics: Revenue At Risk, Revenue Attempted, Revenue Recovered, Not Recovered, and Net Recovery Rate.
  * Dynamic analytics: Strategy Performance, Failure Reason Recoverability, and Risk Tier Distribution.
* **Reliability, Idempotency & Circuit Breakers**:
  * Idempotency protection prevents duplicate charges on already recovered cases (returns HTTP 409).
  * Automated stopping rules escalate repeated failures ($\ge 2$ consecutive failures $\to$ `HUMAN_ESCALATION`).
  * AI failure circuit breaker (`AI_SERVICE_ERROR`) gracefully records audit events and diverts cases safely.
* **Global System Health & Demo Reset**:
  * `GET /api/system/status`: Real-time health monitoring of PostgreSQL, AI Service, Payment Mode, and Policy Rules.
  * `POST /api/demo/reset`: One-click demo restoration returning dataset to pristine 500 payments & 150 cases.

---

## 3. Tech Stack

### Frontend
* **Framework**: React 18 with TypeScript
* **Tooling**: Vite
* **Styling**: Tailwind CSS (Dark SaaS theme)
* **Icons**: Lucide React
* **Charts**: Recharts
* **Routing**: React Router v7
* **HTTP Client**: Axios

### Backend
* **Runtime**: Node.js (v20+) with TypeScript
* **Framework**: Express
* **AI Provider**: Google Gemini 2.5 (`@google/genai`) with structured JSON schema
* **Database ORM**: Prisma ORM
* **Database**: PostgreSQL (v16/18)
* **Financial Calculations**: Decimal.js & PostgreSQL Decimal types
* **Testing**: Node.js Native Test Runner (`tsx --test`)

---

## 4. Database Schema (Prisma)

```prisma
model AIAnalysis {
  id                          String             @id @default(uuid())
  recoveryCaseId              String             @map("recovery_case_id")
  diagnosis                   String             @db.Text
  recommendedAction           RecoveryActionType @map("recommended_action")
  reason                      String             @db.Text
  confidence                  Float
  expectedRecoveryProbability Float              @map("expected_recovery_probability")
  provider                    String             @default("gemini-2.5-flash")
  model                       String             @default("gemini-2.5-flash")
  createdAt                   DateTime           @default(now()) @map("created_at")

  recoveryCase                RecoveryCase       @relation(fields: [recoveryCaseId], references: [id], onDelete: Cascade)
}

model RecoveryAction {
  id             String               @id @default(uuid())
  recoveryCaseId String               @map("recovery_case_id")
  actionType     RecoveryActionType   @map("action_type")
  status         RecoveryActionStatus @default(PENDING)
  reason         String?              @db.Text
  attemptNumber  Int                  @default(1) @map("attempt_number")
  amount         Decimal?             @db.Decimal(12, 2)
  executedAt     DateTime?            @map("executed_at")
  metadata       Json?
  createdAt      DateTime             @default(now()) @map("created_at")

  recoveryCase   RecoveryCase         @relation(fields: [recoveryCaseId], references: [id], onDelete: Cascade)
}
```

---

## 5. API Reference

### Recovery, AI & Measurement Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/recovery/run-batch` | **Run real batch recovery experiment** (bounded AI + policy + execution) |
| `GET` | `/api/dashboard/metrics` | Real-time recovery metrics and financial aggregates |
| `GET` | `/api/dashboard/strategy-performance` | Success rate & recovered ₹ per recovery strategy |
| `GET` | `/api/dashboard/failure-analysis` | Recoverability rate breakdown per failure reason |
| `GET` | `/api/dashboard/risk-analysis` | Risk score distribution & financial exposure |
| `GET` | `/api/dashboard/recovery-performance` | Timeline comparison of revenue at risk vs. recovered |
| `GET` | `/api/system/status` | Real-time status of DB, AI engine, payment rails & policies |
| `POST` | `/api/demo/reset` | **One-click demo reset** to clean 500 payments & 150 cases |
| `POST` | `/api/ai/analyze/:caseId` | Run AI diagnosis & generate structured recommendation |
| `POST` | `/api/recovery/cases/:caseId/evaluate` | Evaluate proposed action against the 5 policy rules |
| `POST` | `/api/recovery/cases/:caseId/execute` | Execute bounded action with optional failure simulation |
| `GET` | `/api/recovery/cases` | Paginated recovery cases with AI & action telemetry |
| `GET` | `/api/recovery/cases/:id` | Full recovery case details with timeline and actions |
| `GET` | `/api/payments` | Paginated payments explorer |
| `GET` | `/api/audit-logs` | Chronological audit logs with filter support |

---

## 6. Local Setup & Running

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
In `backend/.env`:
```env
DATABASE_URL="postgresql://recoverai:recoverai@localhost:5433/recoverai?schema=public"
PORT=5000
FRONTEND_URL="http://localhost:5173"
PAYMENT_EXECUTOR_MODE="SIMULATION" # or RAZORPAY_TEST
# Optional: GEMINI_API_KEY (graceful fallback active if not provided)
GEMINI_API_KEY="your_api_key_here"
# Optional for RAZORPAY_TEST mode:
# RAZORPAY_KEY_ID="rzp_test_..."
# RAZORPAY_KEY_SECRET="..."
```

### 3. Run Migrations & Seed Database
```bash
cd backend
npx prisma db push
npm run seed
```

### 4. Run Automated Test Suite
```bash
# Run from repository root
npm test
```
*Executes 17 automated unit and integration tests covering all 5 policy rules, payment executor abstractions, AI fallback, Decimal financial measurement, and recovery workflows.*

### 5. Build for Production
```bash
# Compile backend and frontend
npm run build
```

### 6. Start Development Servers
* **Backend**: `npm run dev:backend` (runs on `http://localhost:5000`)
* **Frontend**: `npm run dev:frontend` (runs on `http://localhost:5173`)

---

## 7. Demo Scenarios & How to Test

### Scenario 1: AI Diagnosis & Message Recovery
1. Navigate to **Recovery Cases** (`/recovery-cases`).
2. Select a case with `CARD_DECLINED` and `retryCount: 0`.
3. Click **"Run AI Diagnosis"**. Observe diagnosis, recommended action (`SEND_RECOVERY_MESSAGE`), and confidence.
4. Observe Policy Check badge: **"Policy Approved"**.
5. Click **"Execute Recovery Action"**. Confirm execution modal.
6. Observe simulated WhatsApp message dispatch and recovery status updated to `RECOVERED`.

### Scenario 2: Policy Engine Block (Retry Limit Exceeded)
1. Select a case where `retryCount >= 3`.
2. Run AI diagnosis.
3. Observe Policy Engine response: **Blocked by Rule 1** (Maximum retry attempts exceeded).
4. Automated retry is prohibited; policy safely diverts to **HUMAN_ESCALATION**.

### Scenario 3: High-Value Payment Safeguard
1. Select a payment with amount $> ₹50,000$ (e.g. ₹99,999).
2. Attempt or evaluate `RETRY_PAYMENT`.
3. Policy Engine triggers **Rule 2**: Blocks automated retry and flags for manual finance approval.

### Scenario 4: Simulated Failure & Stopping Rules
1. In the Case Detail page, toggle **"Simulate Failure Scenario"**.
2. Click **"Execute Recovery Action"**.
3. Observe action status recorded as `FAILED`, attempt count incremented, and case status transitioned to `ESCALATED` upon reaching failure threshold.

---

## License

ISC License © 2026 RecoverAI Team. Built for the Razorpay AI Buildathon.
