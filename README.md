# RecoverAI — AI Revenue Recovery Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-blue.svg)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-orange.svg)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)

> **Day 1 + Day 2 Complete Build** for the **Razorpay AI Buildathon**.  
> An autonomous revenue recovery platform that detects revenue at risk, diagnoses payment failure root causes using AI, enforces strict safety policies, and executes bounded simulated recoveries with end-to-end audit logging.

---

## 1. Core Architecture Philosophy

RecoverAI strictly enforces separation of concerns:

```text
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│       AI Engine         │       │      Policy Engine      │       │     Recovery Executor   │
│  (Gemini / Structured)  │ ───►  │    (Safety & Bounds)    │ ───►  │   (Bounded Simulation)  │
│                         │       │                         │       │                         │
│ Diagnoses failure cause │       │ Validates 5 safety rules│       │ Executes safe actions:  │
│ Recommends next action  │       │ Prevents duplicate/risk │       │ - RETRY_PAYMENT         │
│ Computes probabilities  │       │ Overrides or escalates  │       │ - SEND_RECOVERY_MESSAGE │
└─────────────────────────┘       └─────────────────────────┘       │ - OFFER_ALTERNATE_PAY   │
                                                                    │ - HUMAN_ESCALATION      │
                                                                    └────────────┬────────────┘
                                                                                 │
                                                                                 ▼
                                                                    ┌─────────────────────────┐
                                                                    │       Audit Trail       │
                                                                    │ (Immutable Postgres Log)│
                                                                    └─────────────────────────┘
```

> **CRITICAL SAFETY GUARANTEE**: The AI model **NEVER** charges real money, executes financial actions directly, or communicates unsupervised. All actions are validated against deterministic business policies and executed within safe simulated bounds.

---

## 2. Day 2 Capabilities

### 1. AI Diagnosis & Recommendation Engine (`aiService.ts`)
* **Structured Output Schema**: Leverages Google Gemini 2.5 (`@google/genai`) with guaranteed JSON output:
  * `diagnosis`: Human-readable root-cause explanation of the failure.
  * `recommendedAction`: One of `RETRY_PAYMENT`, `SEND_RECOVERY_MESSAGE`, `OFFER_ALTERNATE_PAYMENT`, `HUMAN_ESCALATION`, `NO_ACTION`.
  * `reason`: Justification for the selected action.
  * `confidence`: Float between 0.0 and 1.0.
  * `expectedRecoveryProbability`: Estimated chance of recovery.
* **Production-Grade Fallback**: If Gemini API key is not configured or network fails, a deterministic rules-based diagnosis engine seamlessly produces structured recommendations based on failure reason and risk score.

### 2. Policy & Safety Engine (`policyEngine.ts`)
Before any action can execute, it must pass 5 mandatory deterministic policy rules:
1. **Rule 1 (Retry Count Limit)**: If `retryCount >= 3`, block `RETRY_PAYMENT` and fallback to `HUMAN_ESCALATION`.
2. **Rule 2 (High-Value Safeguard)**: If amount $> ₹50,000$, block automated `RETRY_PAYMENT` to prevent merchant balance exposure. Fallback to `HUMAN_ESCALATION`.
3. **Rule 3 (Customer Opt-Out)**: If customer has `contactOptOut: true`, block `SEND_RECOVERY_MESSAGE` to respect privacy. Fallback to `OFFER_ALTERNATE_PAYMENT`.
4. **Rule 4 (Successful Payment)**: If payment is already `SUCCESS`, return `allowed: false` with `NO_ACTION`.
5. **Rule 5 (Unknown Failure Reason)**: If failure reason is `UNKNOWN`, block automated `RETRY_PAYMENT` and require `HUMAN_ESCALATION`.

### 3. Bounded Recovery Execution Engine (`recoveryExecutor.ts`)
* Supported actions:
  * `SEND_RECOVERY_MESSAGE`: Simulates WhatsApp/SMS communication with generated payment recovery link.
  * `OFFER_ALTERNATE_PAYMENT`: Generates simulated UPI Deep Link / NetBanking fallback options.
  * `RETRY_PAYMENT`: Simulates a safe re-attempt through Razorpay gateway rails.
  * `HUMAN_ESCALATION`: Flags high-risk cases for finance ops review.
* **Failure Simulation Mode**: For live demo purposes, operators can toggle `simulateFailure: true` to demonstrate policy stopping rules and repeated-failure escalation.
* **Audit Trail**: Every execution records execution latency, metadata, attempt counts, and immutable audit logs.

### 4. Real-Time Financial Recovery Metrics (`metricsService.ts`)
* **Revenue Recovered**: Exact sum of recovered revenue calculated using `Decimal.js`.
* **Recovery Rate**: $\frac{\text{Revenue Recovered}}{\text{Revenue at Risk}} \times 100$.
* **Interactive Charts**:
  * Recovery Performance (At Risk vs. Recovered in ₹).
  * Recovery Actions Breakdown (Distribution of interventions).
  * Recovery Outcomes (Successful, Failed, Blocked, Escalated).

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

### Recovery & AI Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/analyze/:caseId` | Run AI diagnosis & generate structured recommendation |
| `POST` | `/api/recovery/cases/:caseId/evaluate` | Evaluate proposed action against the 5 policy rules |
| `POST` | `/api/recovery/cases/:caseId/execute` | Execute bounded action with optional failure simulation |
| `GET` | `/api/dashboard/metrics` | Real-time recovery metrics and chart aggregates |
| `GET` | `/api/recovery/cases` | Paginated recovery cases with AI & action telemetry |
| `GET` | `/api/recovery/cases/:id` | Full recovery case details with timeline and actions |
| `GET` | `/api/payments` | Paginated payments explorer |
| `GET` | `/api/audit-logs` | Chronological audit logs with filter support |
| `POST` | `/api/payments/seed` | Reset & seed 500 payments and 150 recovery cases |

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
# Optional: GEMINI_API_KEY (graceful fallback active if not provided)
GEMINI_API_KEY="your_api_key_here"
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
*Executes 10 automated unit tests covering all 5 policy rules, AI fallback, and recovery workflow.*

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
