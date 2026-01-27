// src/app/core/models/activity.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  commissionId: string; // <-- ALTERADO DE organizationId
  createdBy: string;
}
