export type Status = 'READY' | 'SENDING' | 'SENT' | 'OPENED' | 'BLOCKED' | 'DROPPED' | 'FAILED';

export interface Email {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  status: Status;
  lastError: string | null;
  sentAt: Date | null;
  openedAt: Date | null;
  openCount: number;
  ipAddress: string | null;
  userAgent: string | null;
  geoLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
  events?: EmailEvent[];
}

export interface EmailEvent {
  id: string;
  emailId: string;
  event: string;
  status: Status;
  ipAddress: string | null;
  userAgent: string | null;
  geoLocation: string | null;
  errorReason: string | null;
  timestamp: Date;
  createdAt: Date;
}

export interface Template {
  id: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailFormData {
  email: string;
  name?: string;
  country?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
}

export interface TemplateFormData {
  subject: string;
  body: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

