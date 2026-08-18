import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

const dashboardService = new DashboardService();

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    return res.json({
      success: true,
      message: 'Stats retrieved',
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const getRecent = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recent = await dashboardService.getRecent(limit);
    return res.json({
      success: true,
      message: 'Recent attendance retrieved',
      data: recent,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};
