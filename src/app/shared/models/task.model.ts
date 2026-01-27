// src/app/core/models/task.model.ts
import { Timestamp } from '@angular/fire/firestore';

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  commissionId: string; // A qual comissão a tarefa pertence
  createdBy: string;
  createdAt: Timestamp;
  assignedTo?: string | null;
}
