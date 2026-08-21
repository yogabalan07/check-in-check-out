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

    // Pass 1 (no DB access): normalize and validate every row.
    const valid: Array<{
      row: number;
      registerNumber: string;
      name: string;
      email: string | null;
      phone: string | null;
      department: string | null;
      year: string | null;
      teamName: string | null;
      hallName: string | null;
    }> = [];

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const normalizedRegNum = normalizeRegisterNumber(String(p.registerNumber ?? ''));
      const name = String(p.name ?? '').trim();

      if (!normalizedRegNum || !name) {
        results.errors.push({
          row: i + 1,
          registerNumber: normalizedRegNum || '-',
          reason: !normalizedRegNum ? 'Missing Register Number' : 'Missing Name',
        });
        results.failed++;
        continue;
      }

      valid.push({
        row: i + 1,
        registerNumber: normalizedRegNum,
        name,
        email: p.email || null,
        phone: p.phone || null,
        department: p.department || null,
        year: p.year || null,
        teamName: p.teamName || null,
        hallName: p.hallName || null,
      });
    }

    if (valid.length === 0) {
      return results;
    }

    // Pass 2: one indexed query for ALL existing register numbers instead of
    // one findUnique per row (N+1 eliminated).
    const existingRows = await prisma.participant.findMany({
      where: { registerNumber: { in: valid.map((v) => v.registerNumber) } },
      select: { registerNumber: true },
    });
    const existing = new Set(existingRows.map((r) => r.registerNumber));

    // Pass 3: drop DB duplicates and duplicates inside the file itself.
    const seen = new Set<string>();
    const toCreate: typeof valid = [];

    for (const v of valid) {
      if (existing.has(v.registerNumber)) {
        results.errors.push({
          row: v.row,
          registerNumber: v.registerNumber,
          reason: 'Register number already exists',
        });
        results.failed++;
        continue;
      }
      if (seen.has(v.registerNumber)) {
        results.errors.push({
          row: v.row,
          registerNumber: v.registerNumber,
          reason: 'Duplicate register number in file',
        });
        results.failed++;
        continue;
      }
      seen.add(v.registerNumber);
      toCreate.push(v);
    }

    if (toCreate.length === 0) {
      return results;
    }

    // Pass 4: single batch insert. skipDuplicates guards against a
    // concurrent import inserting the same register number mid-flight.
    const created = await prisma.participant.createMany({
      data: toCreate.map((v) => ({
        registerNumber: v.registerNumber,
        name: v.name,
        email: v.email,
        phone: v.phone,
        department: v.department,
        year: v.year,
        teamName: v.teamName,
        hallName: v.hallName,
      })),
      skipDuplicates: true,
    });

    results.imported = created.count;

    // Rows lost to a concurrent insert are reported as failures so the
    // counts always add up to total.
    if (created.count < toCreate.length) {
      for (const v of toCreate.slice(created.count)) {
        results.errors.push({
          row: v.row,
          registerNumber: v.registerNumber,
          reason: 'Register number already exists',
        });
        results.failed++;
      }
    }

    return results;
  }
}
