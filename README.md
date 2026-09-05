# RecoverAI

**AI Revenue Recovery Platform**  
*Built for the Razorpay AI Buildathon (AI Revenue Recovery Track)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-blue.svg)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-orange.svg)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)

---

## Problem

Modern digital merchants face massive invisible revenue loss from failed transactions, abandoned checkouts, recurring mandate failures, and expired payment methods:
- **High Involuntary Churn**: Legitimate customers churn due to temporary bank downtimes, network timeouts, or insufficient funds.
- **Dumb Retries Cause Harm**: Inflexible automated retry cron jobs repeatedly charge failing cards, triggering bank fraud velocity flags and customer annoyance.
- **Lack of Intelligent Interventions**: Merchants lack root-cause awareness to offer the right remedy (e.g., smart retry vs. WhatsApp payment link vs. alternate UPI intent).
- **Compliance & Privacy Risks**: Careless customer messaging without opt-out verification damages brand trust and violates regulatory guidelines.

---

## Solution

**RecoverAI** transforms passive payment failure logging into an **intelligent, safety-governed revenue recovery engine**:
1. **Detects Revenue At Risk**: Analyzes payment telemetry in real time, assigning dynamic risk scores (1–100) and risk tiers (LOW, MEDIUM, HIGH).
2. **AI Diagnosis & Recommendation**: Leverages Google Gemini 2.5 to diagnose the underlying failure reason and recommend bounded interventions with confidence and recovery probability scores.
3. **Deterministic Policy Safety Engine**: Guarantees merchant balance safety, enforces retry limits, prevents unauthorized re-charges, and respects customer contact privacy.
4. **Bounded Recovery Execution**: Executes approved workflows through pluggable payment executors (safe simulation or isolated Razorpay Test sandbox).
5. **Exact Financial Measurement**: Quantifies exact revenue recovered, attempted, and not recovered with Decimal.js precision.

---

## Architecture

RecoverAI strictly enforces separation of concerns:

`	ext
Payment Data (UPI, Card, NetBanking, Wallet)
     ?
Risk Detection (Scores 1–100, Tiering)
     ?
AI Diagnosis (Gemini 2.5 / Deterministic Fallback)
     ?
AI Recommendation (Action, Confidence, Probability)
     ?
Policy Engine (5 Deterministic Safety Guardrails)
     ?
Recovery Executor (Pluggable: Simulation / Razorpay Test)
     ?
Outcome (SUCCESS, FAILED, ESCALATED, BLOCKED)
     ?
Audit Trail (Immutable PostgreSQL Ledger)
`

`	ext
+-------------------------+       +-------------------------+       +-------------------------+
¦       AI Engine         ¦       ¦      Policy Engine      ¦       ¦    Payment Executor     ¦
¦  (Gemini / Structured)  ¦ ---?  ¦    (Safety & Bounds)    ¦ ---?  ¦ (Pluggable Abstraction)¦
¦                         ¦       ¦                         ¦       ¦                         ¦
¦ Diagnoses failure cause ¦       ¦ Validates 5 safety rules¦       ¦ Safe execution modes:   ¦
¦ Recommends next action  ¦       ¦ Prevents duplicate/risk ¦       ¦ - SimulatedPaymentExec  ¦
¦ Computes probabilities  ¦       ¦ Overrides or escalates  ¦       ¦ - RazorpayTestExecutor  ¦
+-------------------------+       +-------------------------+       ¦                         ¦
                                                                    ¦ Actions:                ¦
                                                                    ¦ - RETRY_PAYMENT         ¦
                                                                    ¦ - SEND_RECOVERY_MESSAGE ¦
                                                                    ¦ - OFFER_ALTERNATE_PAY   ¦
                                                                    ¦ - HUMAN_ESCALATION      ¦
                                                                    +-------------------------+
                                                                                 ¦
                                                                                 ?
                                                                    +-------------------------+
                                                                    ¦       Audit Trail       ¦
                                                                    ¦ (Immutable Postgres Log)¦
                                                                    +-------------------------+
`

---

## Key Features

- **Revenue-at-Risk Detection**: Identifies failing transactions across Card, UPI, NetBanking, and Wallets; computes risk scores based on failure reason, retries, and transaction amounts.
- **AI Failure Diagnosis**: Generates human-readable, root-cause explanations of why transactions failed.
- **AI Recovery Recommendations**: Suggests targeted next actions (RETRY_PAYMENT, SEND_RECOVERY_MESSAGE, OFFER_ALTERNATE_PAYMENT, HUMAN_ESCALATION, NO_ACTION).
- **Policy-Based Safety**: Evaluates 5 deterministic rules before any recovery action can execute.
- **Bounded Recovery Execution**: Simulates SMS/WhatsApp recovery links, UPI deep links, gateway retries, and ops escalation without real-world side effects.
- **Batch Recovery Engine (POST /api/recovery/run-batch)**: Processes up to $ eligible cases in an automated pipeline with live aggregates.
- **Recovery Analytics**: Dissects strategy performance, failure reason recoverability, and risk tier exposure.
- **Audit Trail**: Every diagnosis, policy check, retry, and outcome is permanently written to an immutable PostgreSQL log.
- **Idempotency**: Prevents double-charging or duplicate recovery executions (rejects with HTTP 409 ALREADY_PROCESSED).
- **Graceful Failure & Stopping Rules**: Enforces max failure counts ($\ge 2$ failures $\to$ AUTOMATIC_RECOVERY_STOPPED $\to$ HUMAN_ESCALATION).
- **Human Escalation**: High-value transactions or persistent declines are safely routed to finance ops queues.
- **Razorpay Test-Mode Architecture**: Safe sandbox adapter with 
otes.is_simulated: true for zero real-money exposure.

---

## Safety

> **THE GOLDEN RULE OF RECOVERAI**:  
> **AI recommends. Policy Engine decides. Executor executes only approved bounded actions. AI NEVER directly charges money.**

1. **AI Never Directly Charges Money**: The LLM only returns structured advisory JSON (diagnosis, ecommendedAction, confidence). It has no API keys, credentials, or execution permissions to execute payments.
2. **Deterministic Policy Precedence**: Even if AI recommends RETRY_PAYMENT, the Policy Engine overrides and blocks if retry limits are exceeded or payment amount exceeds ?50,000.
3. **Zero Real-Money Risk**: Default execution is 100% offline simulation. When Razorpay Test Mode is active, all operations run against test credentials with 
otes.is_simulated = "true".

---

## Metrics

RecoverAI measures financial impact using exact Decimal.js precision:
- **Revenue At Risk**: Total value of transactions in FAILED, ABANDONED, or SUBSCRIPTION_FAILED status.
- **Revenue Attempted**: Monetary sum of transactions where recovery interventions were triggered.
- **Revenue Recovered**: Monetary sum of payments that transitioned to SUCCESS via verified recovery actions.
- **Revenue Not Recovered**: Unrecovered balances remaining after policy blocks, failures, or escalations.
- **Recovery Rate**: Net recovery efficiency:  
  \text{Recovery Rate} = \left(\frac{\text{Revenue Recovered}}{\text{Revenue At Risk}}\right) \times 100
- **Operational Counts**: Real-time counters for Recovery Attempts, Successful Recoveries, Failed Recoveries, Blocked Policy Actions, and Escalated Cases.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Tooling & Build**: Vite
- **Styling**: Tailwind CSS (FinTech Dark SaaS theme)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v7
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js (v20+) with TypeScript
- **Framework**: Express 4.21
- **AI Diagnostics**: Google Gemini 2.5 (@google/genai) with Deterministic Rule Fallback Engine
- **ORM & Database**: Prisma 6.4 with PostgreSQL 16/18
- **Financial Calculations**: Decimal.js
- **Testing**: Node.js Native Test Runner (	sx --test)

### Payment Execution
- **Pluggable Payment Executor Abstraction**:
  - SimulatedPaymentExecutor: Fast deterministic simulation (default)
  - RazorpayTestExecutor: Sandbox test mode

### Deployment
- **Frontend**: Vercel (rontend/vercel.json SPA rewrite rules)
- **Backend**: Render (ackend/render.yaml web service spec with health check /api/health)
- **Database**: PostgreSQL (Docker Compose locally, managed DB in production)

---

## Local Setup

### 1. Clone Repository & Install Dependencies
`ash
git clone https://github.com/VIJAYAPANDIANT/recover-ai.git
cd recover-ai
npm run install:all
`

### 2. Configure Environment Variables
Copy the provided .env.example templates:
`ash
# In backend directory
cp backend/.env.example backend/.env

# In frontend directory
cp frontend/.env.example frontend/.env
`

### 3. Initialize Database & Seed
Ensure PostgreSQL is running, then generate Prisma client and seed the 500-payment dataset:
`ash
cd backend
npx prisma db push
npm run seed
cd ..
`

### 4. Run Automated Test Suite
`ash
npm test
`
*Executes all 30 tests covering Policy Engine, Payment Executor, Idempotency, AI Circuit Breaker, Batch Pipeline, and Demo Reset.*

### 5. Build for Production
`ash
npm run build
`

### 6. Start Development Servers
`ash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend App (http://localhost:5173)
npm run dev:frontend
`

---

## Environment Variables

### Backend (ackend/.env)
`env
DATABASE_URL=postgresql://recoverai:recoverai@localhost:5433/recoverai?schema=public
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
PAYMENT_EXECUTION_MODE=SIMULATION
RAZORPAY_ENV=test
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RECOVERY_FAILURE_MODE=false
AI_FAILURE_MODE=false
`

### Frontend (rontend/.env)
`env
VITE_API_URL=http://localhost:5000/api
`

---

## Demo Flow

`	ext
Reset Demo
    ?
Open Failed Payment
    ?
AI Analyze
    ?
Evaluate Policy
    ?
Execute Recovery
    ?
Verify Result
    ?
Run Batch
    ?
View Metrics
    ?
View Audit Trail
`

### Walkthrough Steps for Evaluators
1. **Reset Demo**: Click **"Reset Demo Data"** in the sidebar or send POST /api/demo/reset. Restores 500 clean payments (350 Success, 80 Failed, 40 Abandoned, 30 Subscription Failed).
2. **Open Failed Payment**: Navigate to **Payments** (/payments), filter by FAILED, and open a failed transaction.
3. **AI Analyze**: Click **"Run AI Diagnosis"**. Observe the root cause diagnosis, recommended intervention, confidence, and recovery probability.
4. **Evaluate Policy**: Observe the policy badge confirming approval or human escalation diversion.
5. **Execute Recovery**: Click **"Execute Recovery Action"**. The bounded executor simulates gateway retry or WhatsApp resume link.
6. **Verify Result**: Watch the case status update to RECOVERED and the payment amount reflect in Revenue Recovered.
7. **Run Batch Recovery**: On the Dashboard, click **"Run Recovery Batch"** to process multiple cases automatically.
8. **View Metrics & Analytics**: Navigate to **Recovery Analytics** (/analytics) to inspect Strategy Performance, Failure Reason Recoverability, and Risk Distribution.
9. **View Audit Trail**: Navigate to **Audit Logs** (/audit-logs) to verify the chronological, immutable ledger of all events.

---

## Verification & Tests

`ash
$ npm test

? Day 3 - Financial & Execution Safety Verification (7 tests)
? Day 4 - Final Submission & Production Hardening Test Suite (13 tests)
? Policy Engine Unit Tests (7 tests)
? AI Service Fallback & Escalation Tests (3 tests)

Total: 30 passed, 0 failed (100% pass rate)
`

---

## License

ISC License © 2026 RecoverAI Team. Built for the Razorpay AI Buildathon.
