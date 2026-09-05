# RecoverAI — Complete Website & Platform Description

[![Buildathon Track](https://img.shields.io/badge/Track_3-AI_Revenue_Recovery-teal.svg)](https://github.com/VIJAYAPANDIANT/recover-ai)
[![Demo Video](https://img.shields.io/badge/Demo_Video-Google_Drive-4285F4.svg?logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1DzaO9_hG-BcXaiBdanthtBBoEKnrEtpD/view?usp=sharing)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

> **Demo Video Link:** [https://drive.google.com/file/d/1DzaO9_hG-BcXaiBdanthtBBoEKnrEtpD/view?usp=sharing](https://drive.google.com/file/d/1DzaO9_hG-BcXaiBdanthtBBoEKnrEtpD/view?usp=sharing)  
> **Repository:** [https://github.com/VIJAYAPANDIANT/recover-ai](https://github.com/VIJAYAPANDIANT/recover-ai)  
> **Core Tagline:** **AI recommends. Policy decides. Executor acts.**

---

## 🚀 What is RecoverAI?

**RecoverAI** is an AI-powered Revenue Recovery Platform built for digital businesses and online merchants.

Its purpose is to help businesses automatically detect revenue at risk due to failed payments, understand the technical and business root causes using AI, apply strict safety policies, execute bounded recovery actions, and measure the revenue actually recovered.

### Simple Real-Life Example:
Imagine an online business processing **10,000 transactions per day**.

Suppose:
- **500 payments fail**
- Average failed transaction = **₹2,000**
- Total **Revenue At Risk = ₹10,00,000 per day**

The business needs to decide:
1. *Why did each payment fail?*
2. *Should it be retried?*
3. *When should it be retried?*
4. *Should the customer receive a message (SMS / WhatsApp)?*
5. *Should another payment method be offered (UPI vs Card)?*
6. *Should a human handle it?*
7. *Is the transaction too risky for automatic recovery?*

Doing this manually is impossible at scale. Blindly retrying every payment is reckless. **RecoverAI solves this problem.**

---

## 🎯 Real-World Problem

Businesses lose massive revenue because of:
- **Card Payment Failures** (3DS authentication timeout, issuer network drop)
- **Insufficient Funds** (Soft declines that can be retried at clearing windows)
- **Bank & Gateway Errors** (Temporary downtime on specific banking switches)
- **Payment Timeouts** (Network latency during peak hours)
- **Failed Subscriptions & Mandates** (Expired cards or recurring mandate failures)
- **Checkout Abandonment** (Customer drop-off during checkout flow)

When thousands of transactions fail:
- **Manually checking every payment is impossible.**
- **Blindly retrying every payment triggers bank fraud velocity flags and annoys customers.**

RecoverAI replaces blind retries with **intelligent, safety-governed, autonomous recovery**.

---

## 🌐 How the Website Works

RecoverAI creates an autonomous, closed-loop workflow:

```text
Payment Data (UPI, Card, NetBanking)
     ↓
Revenue At Risk Detection (Scores 1 - 100)
     ↓
Risk Score & Priority Tiering
     ↓
AI Analysis (Google Gemini 2.5)
     ↓
Recovery Recommendation
     ↓
Policy Engine (5 Deterministic Rules)
     ↓
 ┌────────┼─────────┐
 ↓        ↓         ↓
Approve  Block    Escalate
 ↓
Recovery Executor (Bounded Action)
     ↓
Recovery Result (SUCCESS / FAILED)
     ↓
Revenue Recovered (Exact Decimal Sum)
     ↓
Immutable Audit Trail (PostgreSQL Ledger)
```

---

## 💻 Detailed Module-by-Module Walkthrough

### 1️⃣ Executive Dashboard
The **Dashboard** gives the business a real-time command center over its payment health:
- **Revenue At Risk**: Total value of transactions in failed, abandoned, or mandate-failed status.
- **Revenue Attempted**: Monetary sum where recovery interventions have been initiated.
- **Revenue Recovered**: Exact monetary value of payments successfully collected.
- **Recovery Rate**: Net recovery efficiency percentage.
- **Counts**: Real-time tallies for Successful Recoveries, Failed Recoveries, Blocked Actions, and Escalated Cases.
- **Live Visualizations**:
  - Recovery Funnel progression
  - Actions Executed by Strategy (Bar Chart)
  - Recovery Outcomes breakdown (Pie Chart)
  - Revenue by Failure Reason & Risk Distribution

### 2️⃣ Payments Telemetry Explorer
The **Payments** page displays the full transaction log:
- Inspect amounts, payment methods, customer profiles, and failure reasons (`CARD_DECLINED`, `INSUFFICIENT_FUNDS`, `BANK_ERROR`, `TIMEOUT`, `MANDATE_FAILURE`).
- Every failing payment automatically links to its dedicated **Recovery Case**.

### 3️⃣ Recovery Case
For every non-successful transaction, RecoverAI generates a **Recovery Case** containing:
- Payment amount & currency
- Failure reason & retry count
- Payment rail (UPI, Card, NetBanking)
- Dynamic **Risk Score (1–100)** & Tier (`LOW`, `MEDIUM`, `HIGH`)

### 4️⃣ 🤖 AI Analysis Layer
Powered by **Google Gemini 2.5 Flash**, the AI analyzes the complete telemetry context and returns:
- **Diagnosis**: Plain-English explanation of why the payment failed.
- **Recommended Action**: `RETRY_PAYMENT`, `SEND_RECOVERY_MESSAGE`, `OFFER_ALTERNATE_PAYMENT`, `HUMAN_ESCALATION`, or `NO_ACTION`.
- **Confidence Score**: Model certainty (0.0 to 1.0).
- **Expected Recovery Probability**: Estimated chance of successful collection.

### 5️⃣ 🔐 Deterministic Policy Engine
**AI does NOT directly execute payments.** Every recommendation is intercepted by our Policy Engine, which evaluates 5 non-negotiable rules:
- **Rule 1 (Max Retries Cap)**: If `retryCount >= 3`, `RETRY_PAYMENT` is **BLOCKED** and diverted to `HUMAN_ESCALATION` to prevent fraud flags.
- **Rule 2 (High-Value Merchant Guard)**: If `amount > ₹50,000`, automated recovery is **BLOCKED** and routed to a VIP concierge desk.
- **Rule 3 (Customer Privacy)**: If `customerOptedOut == true`, customer messaging is **BLOCKED**, falling back to alternate payment rails.
- **Rule 4 (Double-Charge Prevention)**: If `status == 'SUCCESS'`, all actions are blocked (`NO_ACTION`).
- **Rule 5 (Unknown Failure Investigation)**: If `failureReason == 'UNKNOWN'`, retries are blocked and escalated for ops investigation.

> **⭐ The Core Rule: "AI recommends. Policy decides. Executor acts."**

### 6️⃣ Recovery Executor
Only after the Policy Engine grants approval can the Recovery Executor act:
- **Smart Retries**: Re-attempts the gateway at optimal clearing windows.
- **WhatsApp Checkout Links**: Dispatches pre-filled, secure payment links directly to customer chat.
- **Alternate Rails**: Prompts switching from congested UPI rails to NetBanking or Cards.
- **Safe Sandboxing**: Runs in safe simulation mode with optional Razorpay Test Mode integration.

### 7️⃣ 💰 Measured Revenue Recovered
When an action succeeds, the payment transitions and the dashboard updates in real time:
- Increments **Revenue Recovered** with exact cent-by-cent `Decimal.js` precision.
- Proves actual financial ROI rather than theoretical AI predictions.

### 8️⃣ 🚫 Safe Failure Handling & Stopping Rules
If an automated recovery attempt fails:
- Tracks consecutive failure counts.
- **Stopping Rule**: When $\ge 2$ failures occur, automatic retries halt immediately, an `AUTOMATIC_RECOVERY_STOPPED` log is written, and the case escalates to a human operator.

### 9️⃣ ⚡ AI Failure & Circuit Breaker
If the external Gemini API is unreachable or experiences rate limits:
- An internal **Circuit Breaker** activates instantly.
- The platform engages an **intelligent rule-based fallback**, generating structured diagnostic vectors with zero system downtime.

### 🔟 🧾 Immutable Audit Trail
Every single event is permanently logged to PostgreSQL:
```text
CASE_CREATED → AI_DIAGNOSIS_COMPLETED → POLICY_EVALUATED → ACTION_APPROVED → RECOVERY_STARTED → RECOVERY_SUCCEEDED
```
Guarantees full regulatory, financial, and compliance transparency.

### 1️⃣1️⃣ 🔄 Batch Recovery Automation
Instead of handling cases one-by-one, merchants can run an automated batch:
- Processes **10, 25, 50, or 100 cases** simultaneously.
- Runs AI diagnosis, policy checks, and executions in parallel with live progress bars and aggregated financial totals.

### 1️⃣2️⃣ 📊 Recovery Analytics
Comprehensive strategic insights:
- **Failure Reason Recoverability**: Which errors convert highest?
- **Risk Analysis**: Exposure across Low, Medium, and High tiers.
- **Strategy Performance Matrix**: Quantifies ROI across WhatsApp Links vs. Smart Retries vs. Alternate Gateways.

---

## 🏢 Real-World Example: Subscription SaaS Company

Imagine a SaaS company with 50,000 monthly subscribers:

| Without RecoverAI | With RecoverAI |
| :--- | :--- |
| Recurring card debit fails silently | RecoverAI flags the mandate failure in real time |
| Blind retry cron job runs every 24 hours | AI identifies card expiry vs. bank clearing downtime |
| After 3 fails, customer account is cancelled (churn) | Policy blocks blind retries; triggers WhatsApp payment link |
| Customer is annoyed and merchant loses LTV | Customer updates payment method in 1 click; revenue saved |
| Zero compliance or operational visibility | Complete audit trail recorded from failure to recovery |

---

## 👥 Who Can Use RecoverAI?

- 🛒 **E-commerce Platforms**: Recover abandoned carts & checkout gateway drops.
- 💳 **FinTech & Lending**: Collect failed loan EMI debits & mandate retries.
- 📱 **SaaS & Cloud Software**: Eliminate involuntary churn from expired credit cards.
- 🎬 **Streaming & Media**: Safeguard recurring monthly subscriber revenues.
- ✈️ **Travel & Ticketing**: Prevent booking drops during peak bank server traffic.
- 🎓 **EdTech Platforms**: Automate tuition fee and course installment recovery.

---

## 🔗 Quick Links
- **Demo Video**: [Watch Official 5-Min Video Pitch](https://drive.google.com/file/d/1DzaO9_hG-BcXaiBdanthtBBoEKnrEtpD/view?usp=sharing)
- **GitHub Repository**: [https://github.com/VIJAYAPANDIANT/recover-ai](https://github.com/VIJAYAPANDIANT/recover-ai)
- **Demo Script**: See [DEMO_VIDEO.md](DEMO_VIDEO.md)
