import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isLateCheckIn, isEarlyCheckOut, normalizeRegisterNumber } from '../utils';
import { getHackathonSettings } from './settingsService';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

export class AttendanceService {
  async checkIn(registerNumber: string, hall?: string, ip?: string, userAgent?: string) {
    const normalizedRegNum = normalizeRegisterNumber(registerNumber);

    // Single indexed lookup; only the fields used in the response are fetched.
    const participant = await prisma.participant.findUnique({
      where: { registerNumber: normalizedRegNum },
      select: { id: true, name: true, registerNumber: true },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    const now = new Date();
    const settings = await getHackathonSettings();
    const late = isLateCheckIn(now, settings.startTime, settings.timezone);

    try {
      // The partial unique index Attendance_participantId_checkedIn_key
      // (participantId WHERE status = 'CHECKED_IN') makes the database the
      // final guard: if two concurrent requests race for the same participant,
      // exactly one create succeeds and the other fails with P2002 -> 409.
      const attendance = await prisma.$transaction(async (tx) => {
        const created = await tx.attendance.create({
          data: {
            participantId: participant.id,
            checkInDate: now,
            checkInTime: now,
            status: 'CHECKED_IN',
            checkInHall: hall || null,
            isLate: late,
          },
          select: {
            checkInTime: true,
            checkInHall: true,
            isLate: true,
            status: true,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'CHECK_IN',
            registerNumber: normalizedRegNum,
            timestamp: now,
            ipAddress: ip || null,
            userAgent: userAgent || null,
          },
        });

        return created;
      });

      return {
        participant: {
          name: participant.name,
          registerNumber: participant.registerNumber,
        },
        attendance,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(
          'Participant already checked in',
          409,
          'ALREADY_CHECKED_IN'
        );
      }
      throw error;
    }
  }

  async checkOut(registerNumber: string, hall?: string, ip?: string, userAgent?: string) {
    const normalizedRegNum = normalizeRegisterNumber(registerNumber);

    const participant = await prisma.participant.findUnique({
      where: { registerNumber: normalizedRegNum },
      select: { id: true, name: true, registerNumber: true },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    const now = new Date();
    const settings = await getHackathonSettings();
    const early = isEarlyCheckOut(now, settings.endTime, settings.timezone);

    const attendance = await prisma.$transaction(async (tx) => {
      const existing = await tx.attendance.findFirst({
        where: {
          participantId: participant.id,
          status: 'CHECKED_IN',
        },
        select: {
          id: true,
          checkInTime: true,
          checkInHall: true,
          isLate: true,
        },
      });

      if (!existing) {
        throw new AppError(
          'Participant has not checked in',
          409,
          'NOT_CHECKED_IN'
        );
      }

      // Atomic claim: the WHERE clause re-checks status at write time, so two
      // concurrent check-outs cannot both succeed. The loser observes
      // count === 0 and gets 409 NOT_CHECKED_IN.
      const claimed = await tx.attendance.updateMany({
        where: {
          id: existing.id,
          status: 'CHECKED_IN',
        },
        data: {
          checkOutDate: now,
          checkOutTime: now,
          status: 'CHECKED_OUT',
          checkOutHall: hall || null,
          isEarlyCheckout: early,
        },
      });

      if (claimed.count === 0) {
        throw new AppError(
          'Participant has not checked in',
          409,
          'NOT_CHECKED_IN'
        );
      }

      await tx.auditLog.create({
        data: {
          action: 'CHECK_OUT',
          registerNumber: normalizedRegNum,
          timestamp: now,
          ipAddress: ip || null,
          userAgent: userAgent || null,
        },
      });

      return {
        checkInTime: existing.checkInTime,
        checkOutTime: now,
        checkInHall: existing.checkInHall,
        checkOutHall: hall || null,
        isLate: existing.isLate,
        isEarlyCheckout: early,
        status: 'CHECKED_OUT' as const,
      };
    });

    return {
      participant: {
        name: participant.name,
        registerNumber: participant.registerNumber,
      },
      attendance,
    };
  }

  async getAttendances(params: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    hall?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    late?: string;
    early?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      date,
      hall,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.checkInDate = { gte: start, lte: end };
    }

    if (hall) {
      where.OR = [
        { checkInHall: hall },
        { checkOutHall: hall },
      ];
    }

    if (search) {
      where.participant = {
        OR: [
          { registerNumber: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (params.late === 'true') {
      where.isLate = true;
    } else if (params.late === 'false') {
      where.isLate = false;
    }
    if (params.early === 'true') {
      where.isEarlyCheckout = true;
    } else if (params.early === 'false') {
      where.isEarlyCheckout = false;
    }

    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          status: true,
          checkInHall: true,
          checkOutHall: true,
          isLate: true,
          isEarlyCheckout: true,
          participant: {
            select: {
              registerNumber: true,
              name: true,
              department: true,
              year: true,
              teamName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data: attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttendanceById(id: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { participant: true },
    });
    return attendance;
  }
}
