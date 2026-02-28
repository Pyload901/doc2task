import { Role, DocumentType, DocumentStatus, TaskPlatform, TaskStatus } from '@prisma/client';

export type { Role, DocumentType, DocumentStatus, TaskPlatform, TaskStatus };

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: DocumentType;
  status: DocumentStatus;
  result: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  documentId: string;
  userId: string;
  externalId: string | null;
  platform: TaskPlatform;
  status: TaskStatus;
  result: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  provider: string;
  createdAt: Date;
}

export interface McpConfig {
  id: string;
  userId: string;
  platform: string;
  envVars: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ExtendedJWT {
  id: string;
  role: Role;
}
