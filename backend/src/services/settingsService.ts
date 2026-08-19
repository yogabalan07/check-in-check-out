import prisma from '../config/prisma';
import { config } from '../config';

export interface HackathonSettings {
  hackathonName: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

let cache: Record<string, string> | null = null;

export async function getHackathonSettings(): Promise<HackathonSettings> {
  if (!cache) {
    const rows = await prisma.setting.findMany();
    cache = Object.fromEntries(rows.map((r) => [r.key, r.value || '']));
  }

  return {
    hackathonName: cache['hackathonName'] || 'Hackathon 2026',
    startTime: cache['startTime'] || config.hackathonStartTime,
    endTime: cache['endTime'] || config.hackathonEndTime,
    timezone: cache['timezone'] || config.timezone,
  };
}

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function updateHackathonSettings(
  input: Partial<HackathonSettings>
): Promise<HackathonSettings> {
  const entries = Object.entries(input).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      ['hackathonName', 'startTime', 'endTime', 'timezone'].includes(key)
  );

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  invalidateSettingsCache();
  return getHackathonSettings();
}
