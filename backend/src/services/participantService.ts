import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeRegisterNumber } from '../utils';
import { stringify } from 'csv-stringify/sync';

export class ParticipantService {
  async create(data: {
    registerNumber: string;
    name: string;
    email?: string;
    phone?: string;
    department?: string;
    year?: string;
    teamName?: string;
    hallName?: string;
  }) {
    const normalizedRegNum = normalizeRegisterNumber(data.registerNumber);

    const existing = await prisma.participant.findUnique({
      where: { registerNumber: normalizedRegNum },
    });

    if (existing) {
      throw new AppError(
        'Participant with this register number already exists',
        409,
        'DUPLICATE_PARTICIPANT'
      );
    }

    return prisma.participant.create({
      data: {
        ...data,
        registerNumber: normalizedRegNum,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department || null,
        year: data.year || null,
        teamName: data.teamName || null,
        hallName: data.hallName || null,
      },
    });
  }

  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { registerNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { teamName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.participant.count({ where }),
    ]);

    return {
      data: participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { attendances: true },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    return participant;
  }

  async getAllForExport(search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { registerNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { teamName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.participant.findMany({
      where,
      orderBy: { registerNumber: 'asc' },
    });
  }

  exportCSV(participants: Array<Record<string, any>>) {
    const rows = participants.map((p) => ({
      'Register Number': p.registerNumber,
      Name: p.name,
      Email: p.email || '',
      Phone: p.phone || '',
      Department: p.department || '',
      Year: p.year || '',
      'Team Name': p.teamName || '',
      Hall: p.hallName || '',
    }));
    return stringify(rows, { header: true });
  }

  async update(id: string, data: Record<string, any>) {
    const existing = await prisma.participant.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    if (data.registerNumber && data.registerNumber !== existing.registerNumber) {
      const duplicate = await prisma.participant.findUnique({
        where: { registerNumber: normalizeRegisterNumber(data.registerNumber) },
      });
      if (duplicate) {
        throw new AppError(
          'Register number already exists',
          409,
          'DUPLICATE_REGISTER_NUMBER'
        );
      }
    }

    const updateData: any = { ...data };
    if (updateData.registerNumber) {
      updateData.registerNumber = normalizeRegisterNumber(updateData.registerNumber);
    }

    // Clean empty strings to null
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
    }

    return prisma.participant.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const existing = await prisma.participant.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    await prisma.attendance.deleteMany({ where: { participantId: id } });
    return prisma.participant.delete({ where: { id } });
  }

  async importBulk(participants: Array<{
    registerNumber: string;
    name: string;
    email?: string;
    phone?: string;
    department?: string;
    year?: string;
    teamName?: string;
    hallName?: string;
  }>) {
    const results = {
      total: participants.length,
      imported: 0,
      failed: 0,
      errors: [] as Array<{ row: number; registerNumber: string; reason: string }>,
    };

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      try {
        const normalizedRegNum = normalizeRegisterNumber(p.registerNumber);

        if (!normalizedRegNum || !p.name) {
          results.errors.push({
            row: i + 1,
            registerNumber: p.registerNumber,
            reason: 'Missing required fields (registerNumber, name)',
          });
          results.failed++;
          continue;
        }

        const existing = await prisma.participant.findUnique({
          where: { registerNumber: normalizedRegNum },
        });

        if (existing) {
          results.errors.push({
            row: i + 1,
            registerNumber: normalizedRegNum,
            reason: 'Register number already exists',
          });
          results.failed++;
          continue;
        }

        await prisma.participant.create({
          data: {
            registerNumber: normalizedRegNum,
            name: p.name,
            email: p.email || null,
            phone: p.phone || null,
            department: p.department || null,
            year: p.year || null,
            teamName: p.teamName || null,
            hallName: p.hallName || null,
          },
        });

        results.imported++;
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          registerNumber: p.registerNumber,
          reason: error.message || 'Unknown error',
        });
        results.failed++;
      }
    }

    return results;
  }
}
