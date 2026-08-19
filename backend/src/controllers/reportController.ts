import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

const reportService = new ReportService();

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { type, date, hall, format, department, year } = req.query;

    if (type === 'absent') {
      const absent = await reportService.getAbsentParticipants({
        department: department as string,
        year: year as string,
      });

      if (format === 'csv') {
        const csv = reportService.generateCSV(absent, 'absent');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=absent-report.csv');
        return res.send(csv);
      }

      if (format === 'excel') {
        const buffer = reportService.generateExcel(absent, 'absent');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=absent-report.xlsx');
        return res.send(buffer);
      }

      return res.json({
        success: true,
        message: 'Absent report retrieved',
        data: absent,
      });
    }

    const data = await reportService.getAttendanceReport({
      type: type as string,
      date: date as string,
      hall: hall as string,
      department: department as string,
      year: year as string,
    });

    if (format === 'csv') {
      const csv = reportService.generateCSV(data, type as string);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      const buffer = reportService.generateExcel(data, type as string);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
      return res.send(buffer);
    }

    return res.json({
      success: true,
      message: 'Report retrieved',
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const getCurrentlyInside = async (_req: Request, res: Response) => {
  try {
    const data = await reportService.getCurrentlyInside();
    return res.json({
      success: true,
      message: 'Currently inside retrieved',
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};
