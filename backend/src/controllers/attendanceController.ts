import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService';

const attendanceService = new AttendanceService();

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { registerNumber, hall } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await attendanceService.checkIn(registerNumber, hall, ip, userAgent);

    return res.status(201).json({
      success: true,
      message: 'Check-In Successful',
      data: result,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { registerNumber, hall } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await attendanceService.checkOut(registerNumber, hall, ip, userAgent);

    return res.json({
      success: true,
      message: 'Check-Out Successful',
      data: result,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const getAttendances = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      status,
      date,
      hall,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await attendanceService.getAttendances({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      status: status as string,
      date: date as string,
      hall: hall as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.json({
      success: true,
      message: 'Attendances retrieved',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await attendanceService.getAttendanceById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found',
        errorCode: 'ATTENDANCE_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      message: 'Attendance retrieved',
      data: attendance,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};
