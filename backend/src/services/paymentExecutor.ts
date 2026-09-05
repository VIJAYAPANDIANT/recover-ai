import { RecoveryActionType, RecoveryActionStatus } from '@prisma/client';
import Razorpay from 'razorpay';

export interface ExecuteActionParams {
  actionType: RecoveryActionType;
  paymentId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  failureReason: string;
  attemptNumber: number;
  simulateFailure?: boolean;
}

export interface ExecutionResult {
  status: RecoveryActionStatus;
  reason: string;
  metadata: Record<string, any>;
  recoveredAmount: number; // Numeric amount recovered if SUCCESS, else 0
}

export interface PaymentExecutor {
  readonly mode: 'SIMULATION' | 'RAZORPAY_TEST';
  executeAction(params: ExecuteActionParams): Promise<ExecutionResult>;
}

/**
 * Safe Simulated Payment Executor (Default Mode)
 * Never touches real money. Provides deterministic, observable financial recovery simulations.
 */
export class SimulatedPaymentExecutor implements PaymentExecutor {
  readonly mode = 'SIMULATION' as const;

  async executeAction(params: ExecuteActionParams): Promise<ExecutionResult> {
    // Artificial micro-latency to mirror network gateway roundtrip
    await new Promise((resolve) => setTimeout(resolve, 80));

    const forceFail = params.simulateFailure === true || process.env.RECOVERY_FAILURE_MODE === 'true';

    switch (params.actionType) {
      case RecoveryActionType.RETRY_PAYMENT: {
        if (forceFail) {
          return {
            status: RecoveryActionStatus.FAILED,
            reason: 'Simulated issuing bank decline: retry authorization refused (ISO 8583 Code 51: Insufficient funds or velocity limit).',
            metadata: {
              executor: 'SimulatedPaymentExecutor',
              mode: 'SIMULATION',
              gateway: 'Razorpay Simulated Rails',
              simulatedDeclineCode: 'BANK_DECLINE_SIMULATED',
              timestamp: new Date().toISOString(),
            },
            recoveredAmount: 0,
          };
        }

        return {
          status: RecoveryActionStatus.SUCCESS,
          reason: 'Simulated payment retry authorized successfully via secondary gateway routing.',
          metadata: {
            executor: 'SimulatedPaymentExecutor',
            mode: 'SIMULATION',
            gateway: 'Razorpay Simulated Rails',
            routingOptimizer: 'SMART_ROUTER_V2',
            terminalId: 'sim_term_rzp_9941',
            authCode: 'AUTH_SIM_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            timestamp: new Date().toISOString(),
          },
          recoveredAmount: params.amount,
        };
      }

      case RecoveryActionType.SEND_RECOVERY_MESSAGE: {
        if (forceFail) {
          return {
            status: RecoveryActionStatus.FAILED,
            reason: 'Simulated messaging failure: SMS/WhatsApp delivery dropped due to customer carrier unreachable.',
            metadata: {
              executor: 'SimulatedPaymentExecutor',
              channel: 'WhatsApp / SMS Simulated',
              recipient: params.customerPhone || params.customerEmail,
              status: 'UNDELIVERED',
            },
            recoveredAmount: 0,
          };
        }

        const recoveryLink = `https://rzp.io/l/recover-${params.paymentId.toLowerCase()}`;
        return {
          status: RecoveryActionStatus.SUCCESS,
          reason: 'Recovery notification dispatched to customer with personalized Razorpay Checkout resume link.',
          metadata: {
            executor: 'SimulatedPaymentExecutor',
            channel: 'WhatsApp / SMS Simulated',
            recipient: params.customerPhone || params.customerEmail,
            recoveryLink,
            preview: `Hi ${params.customerName}, your payment of ₹${params.amount} for ${params.paymentId} was interrupted. Click to resume: ${recoveryLink}`,
            deliveredAt: new Date().toISOString(),
          },
          recoveredAmount: params.amount,
        };
      }

      case RecoveryActionType.OFFER_ALTERNATE_PAYMENT: {
        if (forceFail) {
          return {
            status: RecoveryActionStatus.FAILED,
            reason: 'Simulated alternate payment rejected: customer closed checkout without choosing alternative instrument.',
            metadata: {
              executor: 'SimulatedPaymentExecutor',
              alternateMethodsOffered: ['UPI_INTENT', 'NETBANKING', 'EMI'],
              status: 'DROPPED',
            },
            recoveredAmount: 0,
          };
        }

        return {
          status: RecoveryActionStatus.SUCCESS,
          reason: 'Customer successfully switched payment method to UPI Intent and verified authorization.',
          metadata: {
            executor: 'SimulatedPaymentExecutor',
            originalMethod: 'CARD_OR_MANDATE',
            resolvedMethod: 'UPI_INTENT',
            vpa: `${params.customerName.toLowerCase().replace(/\s+/g, '')}@okhdfcbank`,
            timestamp: new Date().toISOString(),
          },
          recoveredAmount: params.amount,
        };
      }

      case RecoveryActionType.HUMAN_ESCALATION: {
        return {
          status: RecoveryActionStatus.ESCALATED,
          reason: 'Payment escalated to merchant finance operations queue for manual phone outreach or mandate re-registration.',
          metadata: {
            executor: 'SimulatedPaymentExecutor',
            queue: 'HIGH_PRIORITY_ESCALATIONS',
            ticketId: `ESC-${params.paymentId}`,
            escalatedAt: new Date().toISOString(),
          },
          recoveredAmount: 0,
        };
      }

      case RecoveryActionType.NO_ACTION:
      default: {
        return {
          status: RecoveryActionStatus.PENDING,
          reason: 'No automated recovery intervention was required or approved.',
          metadata: {
            executor: 'SimulatedPaymentExecutor',
            policyDecision: 'NO_ACTION',
          },
          recoveredAmount: 0,
        };
      }
    }
  }
}

/**
 * Razorpay Test Mode Executor
 * Safely interacts with Razorpay Sandbox APIs (e.g. creating test Payment Links or Orders).
 * NEVER performs real money transactions. Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in test environment.
 */
export class RazorpayTestExecutor implements PaymentExecutor {
  readonly mode = 'RAZORPAY_TEST' as const;
  private rzp: any = null;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const env = process.env.RAZORPAY_ENV || 'test';

    // Strict guardrail: reject non-test environments
    if (keyId && keySecret && env.toLowerCase() === 'test') {
      try {
        this.rzp = new (Razorpay as any)({
          key_id: keyId,
          key_secret: keySecret,
        });
      } catch (e) {
        console.warn('[RazorpayTestExecutor] Failed to initialize Razorpay SDK in test mode:', e);
        this.rzp = null;
      }
    }
  }

  async executeAction(params: ExecuteActionParams): Promise<ExecutionResult> {
    // If Razorpay test credentials are not properly configured, fallback to simulation safely
    if (!this.rzp) {
      console.info('[RazorpayTestExecutor] Credentials not configured or non-test mode; falling back to SimulatedPaymentExecutor.');
      const fallback = new SimulatedPaymentExecutor();
      return fallback.executeAction(params);
    }

    try {
      if (params.actionType === RecoveryActionType.SEND_RECOVERY_MESSAGE || params.actionType === RecoveryActionType.OFFER_ALTERNATE_PAYMENT) {
        // Create test payment link in Razorpay Sandbox
        const amountPaise = Math.round(params.amount * 100);
        const linkResponse = await this.rzp.paymentLink.create({
          amount: amountPaise,
          currency: params.currency || 'INR',
          accept_partial: false,
          description: `RecoverAI Recovery for ${params.paymentId}`,
          customer: {
            name: params.customerName,
            email: params.customerEmail,
            contact: params.customerPhone || undefined,
          },
          notify: {
            sms: false, // Prevent real messaging in test mode
            email: false,
          },
          notes: {
            system: 'RecoverAI',
            environment: 'test',
            originalPaymentId: params.paymentId,
          },
        });

        return {
          status: RecoveryActionStatus.SUCCESS,
          reason: 'Razorpay Test Payment Link generated in sandbox mode.',
          metadata: {
            executor: 'RazorpayTestExecutor',
            mode: 'RAZORPAY_TEST',
            razorpayPaymentLinkId: linkResponse.id,
            shortUrl: linkResponse.short_url,
            sandboxVerified: true,
          },
          recoveredAmount: params.amount,
        };
      }

      // For RETRY or ESCALATION, execute bounded test logic
      const fallback = new SimulatedPaymentExecutor();
      const simResult = await fallback.executeAction(params);
      return {
        ...simResult,
        metadata: {
          ...simResult.metadata,
          executor: 'RazorpayTestExecutor',
          mode: 'RAZORPAY_TEST',
          razorpayConnected: true,
        },
      };
    } catch (err: any) {
      console.error('[RazorpayTestExecutor] Error in test sandbox execution:', err.message);
      return {
        status: RecoveryActionStatus.FAILED,
        reason: `Razorpay Sandbox error: ${err.message || 'API request failed'}`,
        metadata: {
          executor: 'RazorpayTestExecutor',
          mode: 'RAZORPAY_TEST',
          error: err.message,
        },
        recoveredAmount: 0,
      };
    }
  }
}

/**
 * Factory for obtaining the active PaymentExecutor
 */
export function getPaymentExecutor(): PaymentExecutor {
  const mode = (process.env.PAYMENT_EXECUTION_MODE || 'SIMULATION').toUpperCase();
  const hasKeys = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const isTest = (process.env.RAZORPAY_ENV || 'test').toLowerCase() === 'test';

  if (mode === 'RAZORPAY_TEST' && hasKeys && isTest) {
    return new RazorpayTestExecutor();
  }

  return new SimulatedPaymentExecutor();
}
