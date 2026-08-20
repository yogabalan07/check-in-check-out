import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { isLateCheckIn, isEarlyCheckOut, normalizeRegisterNumber } from '../utils';
import { getHackathonSettings } from './settingsService';

export class AttendanceService {
  async checkIn(registerNumber: string, hall?: string, ip?: string, userAgent?: string) {
    const normalizedRegNum = normalizeRegisterNumber(registerNumber);

    const participant = await prisma.participant.findUnique({
      where: { registerNumber: normalizedRegNum },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    const now = new Date();
    const settings = await getHackathonSettings();

    // Use transaction to prevent duplicate check-ins
    const attendance = await prisma.$transaction(async (tx) => {
      // Check for existing active check-in
      const existingAttendance = await tx.attendance.findFirst({
        where: {
          participantId: participant.id,
          status: 'CHECKED_IN',
        },
      });

      if (existingAttendance) {
        throw new AppError(
          'Participant already checked in',
          409,
          'ALREADY_CHECKED_IN'
        );
      }

      const late = isLateCheckIn(now, settings.startTime, settings.timezone);

      const newAttendance = await tx.attendance.create({
        data: {
          participantId: participant.id,
          checkInDate: now,
          checkInTime: now,
          status: 'CHECKED_IN',
          checkInHall: hall || null,
          isLate: late,
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

      return newAttendance;
    });

    return {
      participant: {
        name: participant.name,
        registerNumber: participant.registerNumber,
      },
      attendance: {
        checkInTime: attendance.checkInTime,
        checkInHall: attendance.checkInHall,
        isLate: attendance.isLate,
        status: attendance.status,
      },
    };
  }

  async checkOut(registerNumber: string, hall?: string, ip?: string, userAgent?: string) {
    const normalizedRegNum = normalizeRegisterNumber(registerNumber);

    const participant = await prisma.participant.findUnique({
      where: { registerNumber: normalizedRegNum },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    const now = new Date();
    const settings = await getHackathonSettings();

    const attendance = await prisma.$transaction(async (tx) => {
      const existingAttendance = await tx.attendance.findFirst({
        where: {
          participantId: participant.id,
          status: 'CHECKED_IN',
        },
      });

      if (!existingAttendance) {
        throw new AppError(
          'Participant has not checked in',
          409,
          'NOT_CHECKED_IN'
        );
      }

      const early = isEarlyCheckOut(now, settings.endTime, settings.timezone);

      const updatedAttendance = await tx.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOutDate: now,
          checkOutTime: now,
          status: 'CHECKED_OUT',
          checkOutHall: hall || null,
          isEarlyCheckout: early,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CHECK_OUT',
          registerNumber: normalizedRegNum,
          timestamp: now,
          ipAddress: ip || null,
          userAgent: userAgent || null,
        },
      });

      return updatedAttendance;
    });

    return {
      participant: {
        name: participant.name,
        registerNumber: participant.registerNumber,
      },
      attendance: {
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInHall: attendance.checkInHall,
        checkOutHall: attendance.checkOutHall,
        isLate: attendance.isLate,
        isEarlyCheckout: attendance.isEarlyCheckout,
        status: attendance.status,
      },
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
        include: { participant: true },
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
