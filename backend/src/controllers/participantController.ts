import { Request, Response } from 'express';
import { ParticipantService } from '../services/participantService';
import { parse } from 'csv-parse/sync';

const participantService = new ParticipantService();

// Canonical aliases for each expected participant field. Keys/aliases are
// compared case-insensitively and ignoring spaces, underscores, dashes, dots.
const HEADER_ALIASES: Record<string, string[]> = {
  registerNumber: ['registernumber', 'registerno', 'regno', 'rollnumber', 'rollno', 'id'],
  name: ['name', 'fullname', 'studentname', 'participantname'],
  email: ['email', 'emailaddress', 'mail'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact'],
  department: ['department', 'dept', 'branch'],
  year: ['year', 'yearofstudy', 'batch', 'semester'],
  teamName: ['teamname', 'team', 'teamnamefield'],
  hallName: ['hallname', 'hall', 'venue'],
};

const REQUIRED_HEADERS = ['registerNumber', 'name'];
const REQUIRED_HEADER_LABELS: Record<string, string> = {
  registerNumber: 'Register Number',
  name: 'Name',
};

function canonicalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_\-./]+/g, '');
}

function normalizeHeader(header: string): string {
  const key = canonicalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key)) return field;
  }
  return header;
}

function normalizeRecord(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [rawKey, value] of Object.entries(record)) {
    out[normalizeHeader(rawKey)] = value;
  }
  return out;
}

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

export const exportParticipants = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const participants = await participantService.getAllForExport(search as string);
    const csv = participantService.exportCSV(participants);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=participants.csv'
    );
    return res.send(csv);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error exporting participants',
      errorCode: 'EXPORT_ERROR',
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

    const csvContent = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    const normalizedRecords = records.map(normalizeRecord);

    const headerFields = normalizedRecords.length > 0
      ? new Set(Object.keys(normalizedRecords[0]).map(normalizeHeader))
      : new Set<string>();

    const missingRequired = REQUIRED_HEADERS.filter((field) => !headerFields.has(field));
    if (missingRequired.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV is missing required column: ${missingRequired
          .map((field) => REQUIRED_HEADER_LABELS[field])
          .join(', ')}`,
        errorCode: 'INVALID_CSV_HEADERS',
      });
    }

    const result = await participantService.importBulk(normalizedRecords);

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
