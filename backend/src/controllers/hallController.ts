import { Request, Response } from 'express';
import { HallService } from '../services/hallService';

const hallService = new HallService();

export const createHall = async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body;
    const hall = await hallService.create(name, location);
    return res.status(201).json({
      success: true,
      message: 'Hall created',
      data: hall,
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

export const getHalls = async (_req: Request, res: Response) => {
  try {
    const halls = await hallService.getAll();
    return res.json({
      success: true,
      message: 'Halls retrieved',
      data: halls,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

export const getHallById = async (req: Request, res: Response) => {
  try {
    const hall = await hallService.getById(req.params.id);
    return res.json({
      success: true,
      message: 'Hall retrieved',
      data: hall,
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

export const updateHall = async (req: Request, res: Response) => {
  try {
    const { name, location } = req.body;
    const hall = await hallService.update(req.params.id, name, location);
    return res.json({
      success: true,
      message: 'Hall updated',
      data: hall,
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

export const deleteHall = async (req: Request, res: Response) => {
  try {
    await hallService.delete(req.params.id);
    return res.json({
      success: true,
      message: 'Hall deleted',
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
