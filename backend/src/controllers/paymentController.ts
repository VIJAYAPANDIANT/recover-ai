import { Request, Response, NextFunction } from 'express';
import { PaymentStatus, RiskLevel, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { seedDemoDataset } from '../services/seedService.js';

export async function seedPayments(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await seedDemoDataset();
    res.status(200).json({
      success: true,
      message: result.message,
      payments: result.payments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const { status, riskLevel, search } = req.query;

    const where: Prisma.PaymentWhereInput = {};

    // Filter by payment status
    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus;
    }

    // Filter by risk level
    if (riskLevel && Object.values(RiskLevel).includes(riskLevel as RiskLevel)) {
      where.recoveryCase = {
        riskLevel: riskLevel as RiskLevel,
      };
    }

    // Search by payment ID, customer name, or customer email
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { paymentId: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          recoveryCase: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = (req.params.id as string) || '';

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { paymentId: id }],
      },
      include: {
        customer: true,
        recoveryCase: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          message: `Payment not found with identifier: ${id}`,
          statusCode: 404,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFailedPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      status: {
        in: [
          PaymentStatus.FAILED,
          PaymentStatus.ABANDONED,
          PaymentStatus.SUBSCRIPTION_FAILED,
        ],
      },
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          recoveryCase: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}
