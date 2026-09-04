import {
  PrismaClient,
  PaymentStatus,
  FailureReason,
  PaymentMethod,
} from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from '../utils/prisma.js';
import { calculateRiskScore } from './riskScoreService.js';

// Pre-defined realistic Indian price points
const REALISTIC_AMOUNTS = [
  '199.00',
  '499.00',
  '799.00',
  '999.00',
  '1499.00',
  '2499.00',
  '4999.00',
  '9999.00',
  '19999.00',
  '49999.00',
];

// 50 Realistic Customer Profiles
const CUSTOMER_PROFILES = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@techcorp.in', phone: '+91 98201 12345' },
  { name: 'Priya Iyer', email: 'priya.iyer@finflow.co', phone: '+91 98450 23456' },
  { name: 'Rohan Verma', email: 'rohan.verma@cloudscale.io', phone: '+91 99302 34567' },
  { name: 'Ananya Patel', email: 'ananya.p@innovate.org', phone: '+91 97123 45678' },
  { name: 'Vikram Malhotra', email: 'vikram.m@zenithmedia.in', phone: '+91 98110 56789' },
  { name: 'Sneha Kulkarni', email: 'sneha.k@retailhub.com', phone: '+91 98220 67890' },
  { name: 'Aditya Nair', email: 'aditya.nair@hyperdrive.dev', phone: '+91 94470 78901' },
  { name: 'Divya Reddy', email: 'divya.reddy@apexlogistics.in', phone: '+91 98490 89012' },
  { name: 'Kavita Sundaram', email: 'kavita.s@nexustech.co', phone: '+91 98840 90123' },
  { name: 'Rajesh Gupta', email: 'rajesh.gupta@tradewinds.in', phone: '+91 93120 01234' },
  { name: 'Meera Deshmukh', email: 'meera.d@solarsys.com', phone: '+91 98230 11223' },
  { name: 'Arjun Sen', email: 'arjun.sen@quantumlabs.ai', phone: '+91 98300 22334' },
  { name: 'Pooja Agarwal', email: 'pooja.a@bluehorizon.in', phone: '+91 94310 33445' },
  { name: 'Naveen Choudhury', email: 'naveen.c@fasttrack.co', phone: '+91 94350 44556' },
  { name: 'Tanvi Joshi', email: 'tanvi.joshi@vistacapital.in', phone: '+91 98260 55667' },
  { name: 'Siddharth Rao', email: 'siddharth.rao@urbansoft.com', phone: '+91 98480 66778' },
  { name: 'Bhavna Mehta', email: 'bhavna.m@coreinfra.org', phone: '+91 98790 77889' },
  { name: 'Karan Kapoor', email: 'karan.k@primepay.in', phone: '+91 98100 88990' },
  { name: 'Ritu Bhattacharya', email: 'ritu.b@eastwind.co.in', phone: '+91 98310 99001' },
  { name: 'Gaurav Singhal', email: 'gaurav.s@datalytics.io', phone: '+91 98180 10112' },
  { name: 'Swati Saxena', email: 'swati.s@omnistream.net', phone: '+91 94150 21223' },
  { name: 'Harsh Vardhan', email: 'harsh.v@capitalcrest.in', phone: '+91 98290 32334' },
  { name: 'Neha Pillai', email: 'neha.pillai@coastaltech.in', phone: '+91 98470 43445' },
  { name: 'Manish Tiwari', email: 'manish.t@upbeatmedia.com', phone: '+91 94250 54556' },
  { name: 'Simran Chadha', email: 'simran.c@globalventures.io', phone: '+91 98140 65667' },
  { name: 'Deepak Nambiar', email: 'deepak.n@induspay.co', phone: '+91 98460 76778' },
  { name: 'Ayesha Khan', email: 'ayesha.khan@horizonretail.in', phone: '+91 98400 87889' },
  { name: 'Prateek Jain', email: 'prateek.j@finmatrix.dev', phone: '+91 98270 98990' },
  { name: 'Shreya Ghosh', email: 'shreya.g@creativespace.in', phone: '+91 98320 09101' },
  { name: 'Varun Bhatia', email: 'varun.b@northstar.co.in', phone: '+91 98150 10212' },
  { name: 'Kunal Chauhan', email: 'kunal.c@metalogic.io', phone: '+91 98120 21323' },
  { name: 'Anjali Menon', email: 'anjali.m@synapse.ai', phone: '+91 94460 32434' },
  { name: 'Tarun Banerjee', email: 'tarun.b@pioneersoft.in', phone: '+91 98330 43545' },
  { name: 'Ishita Roy', email: 'ishita.roy@vectorpay.com', phone: '+91 98340 54656' },
  { name: 'Sunil Pandey', email: 'sunil.p@gridnetwork.in', phone: '+91 94500 65767' },
  { name: 'Payal Somani', email: 'payal.s@vertexlabs.co', phone: '+91 98280 76878' },
  { name: 'Abhishek Das', email: 'abhishek.das@oceanic.in', phone: '+91 98350 87989' },
  { name: 'Kriti Mathur', email: 'kriti.m@stratafin.org', phone: '+91 98291 98090' },
  { name: 'Nitin Kaushik', email: 'nitin.k@zenlogic.com', phone: '+91 98102 09102' },
  { name: 'Shruti Hegde', email: 'shruti.h@westerntech.in', phone: '+91 98452 10213' },
  { name: 'Alok Tripathi', email: 'alok.t@vanguard.co.in', phone: '+91 94152 21324' },
  { name: 'Radhika Murthy', email: 'radhika.m@cascade.io', phone: '+91 98802 32435' },
  { name: 'Gautam Chopra', email: 'gautam.c@beaconmedia.in', phone: '+91 98112 43546' },
  { name: 'Pallavi Rao', email: 'pallavi.rao@agileforce.net', phone: '+91 98492 54657' },
  { name: 'Hemant Soni', email: 'hemant.soni@crestflow.in', phone: '+91 98262 65768' },
  { name: 'Rupal Shah', email: 'rupal.shah@optima.co', phone: '+91 98242 76879' },
  { name: 'Tushar Deshpande', email: 'tushar.d@synergyfin.in', phone: '+91 98222 87980' },
  { name: 'Monika Chawla', email: 'monika.c@prismatek.io', phone: '+91 98142 98091' },
  { name: 'Sanjay Mishra', email: 'sanjay.m@sterlinggroup.in', phone: '+91 94512 09103' },
  { name: 'Gayatri Joshi', email: 'gayatri.j@elevatesaas.co', phone: '+91 98272 20214' },
];

const NON_SUCCESS_REASONS: FailureReason[] = [
  FailureReason.BANK_ERROR,
  FailureReason.INSUFFICIENT_FUNDS,
  FailureReason.CARD_DECLINED,
  FailureReason.NETWORK_ERROR,
  FailureReason.TIMEOUT,
  FailureReason.MANDATE_FAILURE,
  FailureReason.UNKNOWN,
];

const PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UPI,
  PaymentMethod.CARD,
  PaymentMethod.NET_BANKING,
  PaymentMethod.WALLET,
  PaymentMethod.EMI,
];

export async function seedDemoDataset(): Promise<{ message: string; payments: number }> {
  // Use transaction to ensure safe reset without orphaned data
  return await prisma.$transaction(async (tx) => {
    // 1. Clean existing records in correct foreign key order
    await tx.auditLog.deleteMany();
    await tx.recoveryCase.deleteMany();
    await tx.payment.deleteMany();
    await tx.customer.deleteMany();

    // 2. Create Customers
    const createdCustomers = [];
    for (let i = 0; i < CUSTOMER_PROFILES.length; i++) {
      const profile = CUSTOMER_PROFILES[i];
      const customer = await tx.customer.create({
        data: {
          customerId: `CUST-${(1001 + i).toString()}`,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        },
      });
      createdCustomers.push(customer);
    }

    // 3. Prepare exact 500 payment specifications:
    // - 350 SUCCESS
    // - 80 FAILED
    // - 40 ABANDONED
    // - 30 SUBSCRIPTION_FAILED
    interface PaymentSpec {
      status: PaymentStatus;
      failureReason: FailureReason;
      retryCount: number;
    }

    const paymentSpecs: PaymentSpec[] = [];

    // 350 SUCCESS
    for (let i = 0; i < 350; i++) {
      paymentSpecs.push({
        status: PaymentStatus.SUCCESS,
        failureReason: FailureReason.NONE,
        retryCount: i % 10 === 0 ? 1 : 0, // mostly 0, occasional 1 before success
      });
    }

    // 80 FAILED
    for (let i = 0; i < 80; i++) {
      paymentSpecs.push({
        status: PaymentStatus.FAILED,
        failureReason: NON_SUCCESS_REASONS[i % NON_SUCCESS_REASONS.length],
        retryCount: (i % 4), // 0 to 3
      });
    }

    // 40 ABANDONED
    for (let i = 0; i < 40; i++) {
      paymentSpecs.push({
        status: PaymentStatus.ABANDONED,
        failureReason: i % 2 === 0 ? FailureReason.TIMEOUT : FailureReason.UNKNOWN,
        retryCount: (i % 3), // 0 to 2
      });
    }

    // 30 SUBSCRIPTION_FAILED
    for (let i = 0; i < 30; i++) {
      paymentSpecs.push({
        status: PaymentStatus.SUBSCRIPTION_FAILED,
        failureReason: i % 3 === 0 ? FailureReason.MANDATE_FAILURE : (i % 2 === 0 ? FailureReason.INSUFFICIENT_FUNDS : FailureReason.CARD_DECLINED),
        retryCount: (i % 4), // 0 to 3
      });
    }

    // Deterministic pseudo-random shuffle (using a stable seed) to distribute statuses across customers
    let seed = 42;
    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    for (let i = paymentSpecs.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [paymentSpecs[i], paymentSpecs[j]] = [paymentSpecs[j], paymentSpecs[i]];
    }

    // Spread payments across the last 30 days
    const now = new Date();
    let recoveryCaseSequence = 1001;

    // 4. Create Payments, RecoveryCases & AuditLogs
    for (let i = 0; i < paymentSpecs.length; i++) {
      const spec = paymentSpecs[i];
      const customer = createdCustomers[i % createdCustomers.length];
      const amountStr = REALISTIC_AMOUNTS[Math.floor(pseudoRandom() * REALISTIC_AMOUNTS.length)];
      const amountDecimal = new Decimal(amountStr);
      const paymentMethod = PAYMENT_METHODS[i % PAYMENT_METHODS.length];
      const paymentId = `PAY-${(1001 + i).toString()}`;

      // Date spaced over past 30 days
      const daysAgo = (i % 30) + pseudoRandom();
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const payment = await tx.payment.create({
        data: {
          paymentId,
          customerId: customer.id,
          amount: amountDecimal,
          currency: 'INR',
          status: spec.status,
          failureReason: spec.failureReason,
          retryCount: spec.retryCount,
          paymentMethod,
          createdAt,
          updatedAt: createdAt,
        },
      });

      // For every payment that is NOT SUCCESS, generate RecoveryCase and AuditLog
      if (spec.status !== PaymentStatus.SUCCESS) {
        const risk = calculateRiskScore(spec.status, amountDecimal, spec.retryCount);
        const caseId = `CASE-${recoveryCaseSequence++}`;

        const recoveryCase = await tx.recoveryCase.create({
          data: {
            caseId,
            paymentId: payment.id,
            riskScore: risk.score,
            riskLevel: risk.level,
            status: 'NEW',
            estimatedRecoverableAmount: amountDecimal,
            createdAt,
            updatedAt: createdAt,
          },
        });

        // Audit Log for CASE_CREATED
        await tx.auditLog.create({
          data: {
            paymentId: payment.id,
            recoveryCaseId: recoveryCase.id,
            eventType: 'CASE_CREATED',
            message: `Recovery case created for failed payment ${paymentId}`,
            metadata: {
              riskScore: risk.score,
              riskLevel: risk.level,
              amount: amountDecimal.toNumber(),
              currency: 'INR',
              failureReason: spec.failureReason,
              paymentMethod,
              retryCount: spec.retryCount,
              customerId: customer.customerId,
              customerName: customer.name,
            },
            createdAt,
          },
        });
      }
    }

    // System-level Audit Log for dataset creation
    await tx.auditLog.create({
      data: {
        eventType: 'DATASET_INITIALIZED',
        message: 'Initialized demo dataset with exactly 500 payments and 150 recovery cases',
        metadata: {
          totalPayments: 500,
          successfulPayments: 350,
          failedPayments: 80,
          abandonedPayments: 40,
          subscriptionFailedPayments: 30,
          recoveryCasesCreated: 150,
        },
      },
    });

    return {
      message: 'Demo dataset generated successfully',
      payments: 500,
    };
  }, {
    timeout: 30000, // 30 seconds timeout for bulk insert
  });
}
