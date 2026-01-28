// src/app/shared/models/task.model.ts
import { Timestamp } from '@angular/fire/firestore';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high'; // <-- Adicionado

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority; // <-- Adicionado
  dueDate: Timestamp;     // <-- Adicionado
  commissionId: string;
  organizationId: string; // <-- IMPORTANTE: Para a segurança por núcleo
  assignedTo?: string | null;
  createdBy: string;
  createdAt: Timestamp;
}
