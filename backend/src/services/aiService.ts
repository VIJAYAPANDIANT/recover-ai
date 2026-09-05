import { RecoveryActionType } from '@prisma/client';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

export interface AIAnalysisInput {
  amount: number;
  currency: string;
  status: string;
  failureReason: string;
  retryCount: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  previousAttemptsCount: number;
  riskScore: number;
  riskLevel: string;
  contactOptOut?: boolean;
}

export interface AIAnalysisResult {
  diagnosis: string;
  recommendedAction: RecoveryActionType;
  reason: string;
  confidence: number;
  expectedRecoveryProbability: number;
  provider: string;
  model: string;
  isFallback?: boolean;
}

const ALLOWED_ACTIONS: RecoveryActionType[] = [
  RecoveryActionType.RETRY_PAYMENT,
  RecoveryActionType.SEND_RECOVERY_MESSAGE,
  RecoveryActionType.OFFER_ALTERNATE_PAYMENT,
  RecoveryActionType.HUMAN_ESCALATION,
  RecoveryActionType.NO_ACTION,
];

const AIResponseSchema = z.object({
  diagnosis: z.string().min(5),
  recommendedAction: z.enum([
    'RETRY_PAYMENT',
    'SEND_RECOVERY_MESSAGE',
    'OFFER_ALTERNATE_PAYMENT',
    'HUMAN_ESCALATION',
    'NO_ACTION',
  ]),
  reason: z.string().min(5),
  confidence: z.number().min(0).max(1),
  expectedRecoveryProbability: z.number().min(0).max(1),
});

/**
 * Intelligent Rule-Based Fallback Engine
 * Provides deterministic, structured diagnosis and recommendations when
 * the AI provider is unavailable, unconfigured, or returns invalid telemetry.
 */
export function getFallbackAnalysis(input: AIAnalysisInput, reasonNotice?: string): AIAnalysisResult {
  let diagnosis = `Payment failed because the customer's payment method could not complete the transaction.`;
  let recommendedAction: RecoveryActionType = RecoveryActionType.HUMAN_ESCALATION;
  let reason = reasonNotice || `Deterministic recovery rule applied due to unconfigured or offline AI service.`;
  let confidence = 0.88;
  let expectedRecoveryProbability = 0.55;

  if (input.status === 'SUCCESS') {
    return {
      diagnosis: 'Transaction was already completed successfully.',
      recommendedAction: RecoveryActionType.NO_ACTION,
      reason: 'No recovery intervention needed for successful payment.',
      confidence: 1.0,
      expectedRecoveryProbability: 1.0,
      provider: 'rule-engine',
      model: 'deterministic-v1',
      isFallback: true,
    };
  }

  if (input.retryCount >= 3) {
    diagnosis = `Maximum automated retry attempts (${input.retryCount}) reached without authorization.`;
    recommendedAction = RecoveryActionType.HUMAN_ESCALATION;
    reason = `Customer has exhausted automated retries; escalation required to prevent repetitive declines.`;
    confidence = 0.95;
    expectedRecoveryProbability = 0.35;
  } else if (input.failureReason === 'UNKNOWN') {
    diagnosis = `Telemetry returned an unknown or unmapped failure code from the payment network.`;
    recommendedAction = RecoveryActionType.HUMAN_ESCALATION;
    reason = `Unknown failure reason requires manual investigation before attempting further actions.`;
    confidence = 0.90;
    expectedRecoveryProbability = 0.40;
  } else if (input.failureReason === 'INSUFFICIENT_FUNDS') {
    diagnosis = `Transaction failed due to insufficient funds in customer's account or wallet at execution time.`;
    recommendedAction = input.contactOptOut ? RecoveryActionType.OFFER_ALTERNATE_PAYMENT : RecoveryActionType.SEND_RECOVERY_MESSAGE;
    reason = `Notifying the customer allows them to fund their account or switch to a secondary balance.`;
    confidence = 0.91;
    expectedRecoveryProbability = 0.64;
  } else if (input.failureReason === 'CARD_DECLINED') {
    diagnosis = `The customer's issuing bank declined the card authorization, likely due to risk filters or daily limit caps.`;
    recommendedAction = input.contactOptOut ? RecoveryActionType.OFFER_ALTERNATE_PAYMENT : RecoveryActionType.SEND_RECOVERY_MESSAGE;
    reason = `Low-risk customer intervention with no retry limit reached.`;
    confidence = 0.92;
    expectedRecoveryProbability = 0.68;
  } else if (input.failureReason === 'TIMEOUT' || input.failureReason === 'NETWORK_ERROR') {
    diagnosis = `Transient network timeout occurred between the payment gateway and the bank authorization switch.`;
    recommendedAction = RecoveryActionType.RETRY_PAYMENT;
    reason = `Transient infrastructure error with high likelihood of recovery on subsequent retry.`;
    confidence = 0.89;
    expectedRecoveryProbability = 0.76;
  } else if (input.failureReason === 'MANDATE_FAILURE') {
    diagnosis = `Automated mandate execution failed. The underlying authorization may be inactive or expired.`;
    recommendedAction = RecoveryActionType.OFFER_ALTERNATE_PAYMENT;
    reason = `Mandate renewal or alternate one-time payment option recommended.`;
    confidence = 0.86;
    expectedRecoveryProbability = 0.58;
  } else if (input.failureReason === 'BANK_ERROR') {
    diagnosis = `Acquiring or issuing bank reported an internal server or core-banking system disruption.`;
    recommendedAction = RecoveryActionType.RETRY_PAYMENT;
    reason = `Temporary core-banking downtime typically clears within standard retry cooldown windows.`;
    confidence = 0.87;
    expectedRecoveryProbability = 0.70;
  }

  return {
    diagnosis,
    recommendedAction,
    reason,
    confidence,
    expectedRecoveryProbability,
    provider: 'rule-engine',
    model: 'deterministic-v1',
    isFallback: true,
  };
}

/**
 * Diagnoses payment failure and recommends recovery action using AI (Gemini)
 * with robust validation and fallback.
 */
export async function analyzePaymentRecovery(input: AIAnalysisInput): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const provider = process.env.AI_PROVIDER || 'gemini';

  // If no Gemini API key configured, use the safe rule-based fallback
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return getFallbackAnalysis(
      input,
      'AI service initialized in rule-based fallback mode (GEMINI_API_KEY not set).'
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const prompt = `You are the AI diagnostic and revenue recovery engine of RecoverAI for the Razorpay payment platform.
Analyze the following failed transaction telemetry and recommend an optimal revenue recovery action.

Input Telemetry:
- Amount: ${input.currency} ${input.amount}
- Status: ${input.status}
- Failure Reason: ${input.failureReason}
- Retry Count: ${input.retryCount}
- Payment Method: ${input.paymentMethod}
- Customer Name: ${input.customerName}
- Previous Recovery Attempts: ${input.previousAttemptsCount}
- Calculated Risk Score: ${input.riskScore}/100 (${input.riskLevel})
- Contact Opt-Out: ${input.contactOptOut ? 'YES' : 'NO'}

Rules:
1. "recommendedAction" MUST be strictly one of:
   - "RETRY_PAYMENT": If the error appears transient (network, temporary bank error) and retries are under 3.
   - "SEND_RECOVERY_MESSAGE": If customer intervention is beneficial (e.g. card declined, insufficient funds) and contact is allowed.
   - "OFFER_ALTERNATE_PAYMENT": If current method cannot succeed (mandate failure, expired card, customer opted out of messages).
   - "HUMAN_ESCALATION": If failure reason is UNKNOWN, retries >= 3, or high-value anomaly.
   - "NO_ACTION": If payment is already SUCCESS.
2. Return ONLY a valid JSON object matching this schema:
{
  "diagnosis": "Clear explanation of why the payment failed",
  "recommendedAction": "RETRY_PAYMENT" | "SEND_RECOVERY_MESSAGE" | "OFFER_ALTERNATE_PAYMENT" | "HUMAN_ESCALATION" | "NO_ACTION",
  "reason": "Clear justification for the recommended action",
  "confidence": number between 0.0 and 1.0,
  "expectedRecoveryProbability": number between 0.0 and 1.0
}
Do not output markdown code blocks or any extraneous text. Return raw JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Remove any possible markdown fences if returned
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    const validated = AIResponseSchema.parse(parsed);

    // Ensure action is strictly in allowed actions
    const recommendedAction = validated.recommendedAction as RecoveryActionType;
    if (!ALLOWED_ACTIONS.includes(recommendedAction)) {
      throw new Error(`AI suggested unrecognized action: ${validated.recommendedAction}`);
    }

    return {
      diagnosis: validated.diagnosis,
      recommendedAction,
      reason: validated.reason,
      confidence: Number(validated.confidence.toFixed(2)),
      expectedRecoveryProbability: Number(validated.expectedRecoveryProbability.toFixed(2)),
      provider,
      model,
      isFallback: false,
    };
  } catch (err: any) {
    console.warn(`[AIService] Gemini inference error: ${err.message}. Gracefully falling back to rule engine.`);
    return getFallbackAnalysis(
      input,
      `AI service encountered an issue (${err.message || 'inference failure'}); automatic safe fallback applied.`
    );
  }
}
