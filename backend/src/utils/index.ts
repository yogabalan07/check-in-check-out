import { config } from '../config';

export function getCurrentServerTime(): Date {
  return new Date();
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTimeInTimezoneMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return hours * 60 + minutes;
}

export function isLateCheckIn(
  checkInTime: Date,
  startTime: string = config.hackathonStartTime,
  timezone: string = config.timezone
): boolean {
  const checkInMinutes = getTimeInTimezoneMinutes(checkInTime, timezone);
  const startMinutes = parseTimeToMinutes(startTime);
  return checkInMinutes > startMinutes;
}

export function isEarlyCheckOut(
  checkOutTime: Date,
  endTime: string = config.hackathonEndTime,
  timezone: string = config.timezone
): boolean {
  const checkOutMinutes = getTimeInTimezoneMinutes(checkOutTime, timezone);
  const endMinutes = parseTimeToMinutes(endTime);
  return checkOutMinutes < endMinutes;
}

export function formatToIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: config.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: config.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function normalizeRegisterNumber(regNum: string): string {
  return regNum.trim().toUpperCase();
}
