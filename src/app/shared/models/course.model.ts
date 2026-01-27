import { Timestamp } from '@angular/fire/firestore';

export type CourseLocationType = 'physical' | 'virtual' | 'tbd';

export type ObjectiveIcon = 'light-bulb' | 'academic-cap' | 'users' | 'sparkles' | 'chat-bubble' | 'chart-bar';

export interface LearningObjective {
  icon: ObjectiveIcon; // <-- CAMPO ADICIONADO
  title: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  commissionId: string;
  isPublic: boolean;
  slug: string;
  locationType: CourseLocationType;
  address?: string | null;
  virtualLink?: string | null;
  learningObjectives?: LearningObjective[];
  registrationCount?: number;
  createdAt: Timestamp;
}
