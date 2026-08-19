import { Request, Response } from 'express';
import {
  getHackathonSettings,
  updateHackathonSettings,
} from '../services/settingsService';

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getHackathonSettings();
    return res.json({
      success: true,
      message: 'Settings retrieved',
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await updateHackathonSettings(req.body);
    return res.json({
      success: true,
      message: 'Settings updated',
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};
