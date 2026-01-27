// src/app/core/models/forum-vote.model.ts
import { Timestamp } from '@angular/fire/firestore';

export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface ForumVote {
  // O ID será o UID do usuário para garantir um voto por pessoa
  // id: string; // (Opcional, pode usar o UID como ID do documento)
  choice: VoteChoice;
  votedAt: Timestamp;
}
