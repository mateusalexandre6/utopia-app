// src/app/core/models/forum-post.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface ForumPost {
  id: string;
  topicId: string; // Referência ao tópico pai
  content: string;
  createdByUid: string;
  createdByDisplayName: string; // Denormalizado
  createdAt: Timestamp;
  // Campos opcionais: editedAt, reactions[]
}
