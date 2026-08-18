import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class HallService {
  async create(name: string, location?: string) {
    const existing = await prisma.hall.findUnique({ where: { name } });
    if (existing) {
      throw new AppError('Hall already exists', 409, 'DUPLICATE_HALL');
    }
    return prisma.hall.create({
      data: { name, location: location || null },
    });
  }

  async getAll() {
    return prisma.hall.findMany({ orderBy: { name: 'asc' } });
  }

  async getById(id: string) {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) {
      throw new AppError('Hall not found', 404, 'HALL_NOT_FOUND');
    }
    return hall;
  }

  async update(id: string, name: string, location?: string) {
    const existing = await prisma.hall.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Hall not found', 404, 'HALL_NOT_FOUND');
    }

    if (name !== existing.name) {
      const duplicate = await prisma.hall.findUnique({ where: { name } });
      if (duplicate) {
        throw new AppError('Hall name already exists', 409, 'DUPLICATE_HALL');
      }
    }

    return prisma.hall.update({
      where: { id },
      data: { name, location: location || null },
    });
  }

  async delete(id: string) {
    const existing = await prisma.hall.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Hall not found', 404, 'HALL_NOT_FOUND');
    }
    return prisma.hall.delete({ where: { id } });
  }
}
