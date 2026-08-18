import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { config } from '../config';

export const generateQR = async (req: Request, res: Response) => {
  try {
    const { type, hall } = req.query;

    if (!type || (type !== 'check-in' && type !== 'check-out')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR type. Use check-in or check-out',
        errorCode: 'INVALID_QR_TYPE',
      });
    }

    let url = type === 'check-in'
      ? `${config.frontendUrl}/check-in`
      : `${config.frontendUrl}/check-out`;

    if (hall) {
      url += `?hall=${encodeURIComponent(hall as string)}`;
    }

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return res.json({
      success: true,
      message: 'QR code generated',
      data: {
        type,
        url,
        qr: qrDataUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      errorCode: 'QR_ERROR',
    });
  }
};
