// src/app/core/models/schedule-item.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  speakerIds: string[]; // <-- Array de IDs dos palestrantes
}
