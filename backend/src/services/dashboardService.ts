import prisma from '../config/prisma';

export class DashboardService {
  async getStats() {
    const [
      totalParticipants,
      checkedIn,
      checkedOut,
      currentlyInside,
      lateCheckIns,
      earlyCheckOuts,
    ] = await Promise.all([
      prisma.participant.count(),
      prisma.participant.count({ where: { attendances: { some: {} } } }),
      prisma.participant.count({
        where: { attendances: { some: { status: 'CHECKED_OUT' } } },
      }),
      prisma.participant.count({
        where: { attendances: { some: { status: 'CHECKED_IN' } } },
      }),
      prisma.attendance.count({ where: { isLate: true } }),
      prisma.attendance.count({ where: { isEarlyCheckout: true } }),
    ]);

    return {
      totalParticipants,
      checkedIn,
      checkedOut,
      currentlyInside,
      absent: totalParticipants - checkedIn,
      lateCheckIns,
      earlyCheckOuts,
    };
  }

  async getRecent(limit: number = 10) {
    const recent = await prisma.attendance.findMany({
      include: { participant: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return recent;
  }
}
