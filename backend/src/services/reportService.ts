import prisma from '../config/prisma';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

export class ReportService {
  async getAttendanceReport(filters: {
    type?: string;
    date?: string;
    hall?: string;
    department?: string;
    year?: string;
  }) {
    const where: any = {};

    if (filters.type === 'currently-inside') {
      where.status = 'CHECKED_IN';
    } else if (filters.type === 'checked-out') {
      where.status = 'CHECKED_OUT';
    } else if (filters.type === 'absent') {
      // Find participants with no attendance record
      const participantsWithAttendance = await prisma.attendance.findMany({
        select: { participantId: true },
        distinct: ['participantId'],
      });
      const participantIds = participantsWithAttendance.map((a) => a.participantId);
      where.participantId = { notIn: participantIds.length > 0 ? participantIds : ['__none__'] };
    } else if (filters.type === 'late') {
      where.isLate = true;
    } else if (filters.type === 'early-checkout') {
      where.isEarlyCheckout = true;
    }

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.checkInDate = { gte: start, lte: end };
    }

    if (filters.hall) {
      where.OR = [
        { checkInHall: filters.hall },
        { checkOutHall: filters.hall },
      ];
    }

    const participantFilter: any = {};
    if (filters.department) {
      participantFilter.department = filters.department;
    }
    if (filters.year) {
      participantFilter.year = filters.year;
    }
    if (Object.keys(participantFilter).length > 0) {
      where.participant = participantFilter;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { participant: true },
      orderBy: { createdAt: 'desc' },
    });

    return attendances;
  }

  async getAbsentParticipants(filters?: { department?: string; year?: string }) {
    const participantsWithAttendance = await prisma.attendance.findMany({
      select: { participantId: true },
      distinct: ['participantId'],
    });

    const participantIds = participantsWithAttendance.map((a) => a.participantId);

    const where: any = {
      id: participantIds.length > 0 ? { notIn: participantIds } : undefined,
    };
    if (filters?.department) {
      where.department = filters.department;
    }
    if (filters?.year) {
      where.year = filters.year;
    }

    const absentParticipants = await prisma.participant.findMany({
      where,
      orderBy: { registerNumber: 'asc' },
    });

    return absentParticipants;
  }

  async getCurrentlyInside() {
    return prisma.attendance.findMany({
      where: { status: 'CHECKED_IN' },
      include: { participant: true },
      orderBy: { checkInTime: 'desc' },
    });
  }

  generateCSV(data: any[], type: string) {
    if (type === 'absent') {
      const rows = data.map((p: any) => ({
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

    const rows = data.map((a: any) => ({
      'Register Number': a.participant?.registerNumber || '',
      Name: a.participant?.name || '',
      Department: a.participant?.department || '',
      Year: a.participant?.year || '',
      Team: a.participant?.teamName || '',
      Hall: a.checkInHall || '',
      'Check-In Date': a.checkInDate ? new Date(a.checkInDate).toLocaleDateString('en-IN') : '',
      'Check-In Time': a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('en-IN') : '',
      'Check-Out Date': a.checkOutDate ? new Date(a.checkOutDate).toLocaleDateString('en-IN') : '',
      'Check-Out Time': a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN') : '',
      Status: a.status,
      Late: a.isLate ? 'Yes' : 'No',
      'Early Checkout': a.isEarlyCheckout ? 'Yes' : 'No',
    }));

    return stringify(rows, { header: true });
  }

  generateExcel(data: any[], type: string) {
    if (type === 'absent') {
      const rows = data.map((p: any) => ({
        'Register Number': p.registerNumber,
        Name: p.name,
        Email: p.email || '',
        Phone: p.phone || '',
        Department: p.department || '',
        Year: p.year || '',
        'Team Name': p.teamName || '',
        Hall: p.hallName || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Absent');
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    const rows = data.map((a: any) => ({
      'Register Number': a.participant?.registerNumber || '',
      Name: a.participant?.name || '',
      Department: a.participant?.department || '',
      Year: a.participant?.year || '',
      Team: a.participant?.teamName || '',
      Hall: a.checkInHall || '',
      'Check-In Date': a.checkInDate ? new Date(a.checkInDate).toLocaleDateString('en-IN') : '',
      'Check-In Time': a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('en-IN') : '',
      'Check-Out Date': a.checkOutDate ? new Date(a.checkOutDate).toLocaleDateString('en-IN') : '',
      'Check-Out Time': a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN') : '',
      Status: a.status,
      Late: a.isLate ? 'Yes' : 'No',
      'Early Checkout': a.isEarlyCheckout ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
