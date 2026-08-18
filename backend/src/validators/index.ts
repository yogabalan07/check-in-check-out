import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const checkInSchema = z.object({
  registerNumber: z.string().trim().min(1, 'Register number is required'),
  hall: z.string().optional(),
});

export const checkOutSchema = z.object({
  registerNumber: z.string().trim().min(1, 'Register number is required'),
  hall: z.string().optional(),
});

export const participantSchema = z.object({
  registerNumber: z.string().min(1, 'Register number is required').trim(),
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  year: z.string().optional().or(z.literal('')),
  teamName: z.string().optional().or(z.literal('')),
  hallName: z.string().optional().or(z.literal('')),
});

export const participantUpdateSchema = z.object({
  registerNumber: z.string().min(1).trim().optional(),
  name: z.string().min(1).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  year: z.string().optional().or(z.literal('')),
  teamName: z.string().optional().or(z.literal('')),
  hallName: z.string().optional().or(z.literal('')),
});

export const hallSchema = z.object({
  name: z.string().min(1, 'Hall name is required').trim(),
  location: z.string().optional().or(z.literal('')),
});
