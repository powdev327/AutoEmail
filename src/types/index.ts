export type Status = 'READY' | 'SENDING' | 'SENT' | 'FAILED';

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
  createdAt: Date;
  updatedAt: Date;
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

