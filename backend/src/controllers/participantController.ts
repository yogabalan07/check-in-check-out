import { Request, Response } from 'express';
import { ParticipantService } from '../services/participantService';
import { parse } from 'csv-parse/sync';

const participantService = new ParticipantService();

export const createParticipant = async (req: Request, res: Response) => {
  try {
    const participant = await participantService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Participant created',
      data: participant,
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

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query;

    const result = await participantService.getAll({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.json({
      success: true,
      message: 'Participants retrieved',
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

export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const participant = await participantService.getById(req.params.id);
    return res.json({
      success: true,
      message: 'Participant retrieved',
      data: participant,
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

export const updateParticipant = async (req: Request, res: Response) => {
  try {
    const participant = await participantService.update(req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Participant updated',
      data: participant,
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

export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    await participantService.delete(req.params.id);
    return res.json({
      success: true,
      message: 'Participant deleted',
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

export const importParticipants = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        errorCode: 'NO_FILE',
      });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result = await participantService.importBulk(records);

    return res.json({
      success: true,
      message: 'Import completed',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error importing file',
      errorCode: 'IMPORT_ERROR',
    });
  }
};
