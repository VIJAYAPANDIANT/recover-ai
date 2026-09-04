import { Request, Response, NextFunction } from 'express';
import { RecoveryStatus, RiskLevel, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';

export async function getRecoveryCases(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const { status, riskLevel, search } = req.query;

    const where: Prisma.RecoveryCaseWhereInput = {};

    if (status && Object.values(RecoveryStatus).includes(status as RecoveryStatus)) {
      where.status = status as RecoveryStatus;
    }

    if (riskLevel && Object.values(RiskLevel).includes(riskLevel as RiskLevel)) {
      where.riskLevel = riskLevel as RiskLevel;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { caseId: { contains: q, mode: 'insensitive' } },
        { payment: { paymentId: { contains: q, mode: 'insensitive' } } },
        { payment: { customer: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [total, cases] = await Promise.all([
      prisma.recoveryCase.count({ where }),
      prisma.recoveryCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            include: {
              customer: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: cases,
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

export async function getRecoveryCaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = (req.params.id as string) || '';

    const recoveryCase = await prisma.recoveryCase.findFirst({
      where: {
        OR: [{ id }, { caseId: id }],
      },
      include: {
        payment: {
          include: {
            customer: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!recoveryCase) {
      res.status(404).json({
        success: false,
        error: {
          message: `Recovery Case not found with identifier: ${id}`,
          statusCode: 404,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: recoveryCase,
    });
  } catch (error) {
    next(error);
  }
}
