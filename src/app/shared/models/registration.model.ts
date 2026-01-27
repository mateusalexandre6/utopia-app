// src/app/core/models/registration.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Registration {
  id: string;
  courseId: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: Timestamp;
}
