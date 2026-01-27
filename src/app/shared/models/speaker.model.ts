// src/app/core/models/speaker.model.ts
export interface Speaker {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string; // Link para foto no Cloud Storage
  organizationId: string; // A qual núcleo pertence, para reutilização
}
