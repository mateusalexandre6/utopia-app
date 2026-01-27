// src/app/core/models/forum-topic.model.ts
import { Timestamp } from '@angular/fire/firestore';

export type ForumTopicScope = 'organization' | 'national'; // Visibilidade
export type ForumTopicStatus = 'open' | 'closed' | 'voting'; // Estado da discussão/votação

export interface ForumTopic {
  id: string;
  title: string;
  content: string; // Post inicial que descreve a proposta/discussão
  scope: ForumTopicScope;
  organizationId?: string | null; // ID do Núcleo se scope='organization'
  status: ForumTopicStatus;
  createdByUid: string;
  createdByDisplayName: string; // Denormalizado para performance
  createdAt: Timestamp;
  // Campos denormalizados para contagem de votos (atualizados via backend seguro)
  yesVotes?: number;
  noVotes?: number;
  abstainVotes?: number;
  // Outros campos úteis: tags[], lastReplyAt, replyCount
}
