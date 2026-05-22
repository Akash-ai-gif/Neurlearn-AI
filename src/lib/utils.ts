import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function getSkillStatusColor(status: string): string {
  switch (status) {
    case 'mastered': return '#00F5A0';
    case 'learning': return '#FFB800';
    case 'available': return '#00D1FF';
    case 'locked': return '#374151';
    default: return '#374151';
  }
}

export function getSkillStatusLabel(status: string): string {
  switch (status) {
    case 'mastered': return '🟢 Mastered';
    case 'learning': return '🟡 Learning';
    case 'available': return '🔵 Available';
    case 'locked': return '🔒 Locked';
    default: return '⚪ Unknown';
  }
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NL-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3) code += '-';
  }
  return code;
}
