import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { eventType, search } = req.query;

    const where: Prisma.AuditLogWhereInput = {};

    if (eventType && typeof eventType === 'string' && eventType !== 'ALL') {
      where.eventType = eventType;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { message: { contains: q, mode: 'insensitive' } },
        { payment: { paymentId: { contains: q, mode: 'insensitive' } } },
        { recoveryCase: { caseId: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
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
          recoveryCase: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: logs,
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
