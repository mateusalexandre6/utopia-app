// src/app/core/services/forum.service.ts

import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc, deleteDoc, Timestamp, writeBatch, runTransaction, setDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ForumTopicScope, ForumTopicStatus } from '../models/forum-topic.model';
import { VoteChoice } from '../models/forum-vote.model';

// Interfaces para os dados dos formulários
interface TopicFormData {
  title: string;
  content: string;
  scope: ForumTopicScope;
  organizationId?: string | null;
}

interface PostFormData {
  topicId: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  /**
   * Cria um novo tópico no fórum.
   */
  async createTopic(formData: TopicFormData) {
    const user = this.authService.currentUser();
    console.log("user: ", user)
    if (!user || !user.email) throw new Error("Usuário não autenticado ou sem nome de exibição.");

    const topicsCollection = collection(this.firestore, 'forumTopics');
    const newTopic = {
      ...formData,
      organizationId: formData.scope === 'organization' ? formData.organizationId : null,
      status: 'open' as ForumTopicStatus, // Status inicial padrão
      createdByUid: user.uid,
      createdByDisplayName: user.email, // Denormalizado
      createdAt: Timestamp.now(),
      yesVotes: 0, // Contadores inicializados (serão atualizados pelo cálculo no cliente)
      noVotes: 0,
      abstainVotes: 0,
    };
    return addDoc(topicsCollection, newTopic);
  }

  /**
   * Adiciona uma nova resposta (post) a um tópico existente.
   */
  async addPost(formData: PostFormData) {
    const user = this.authService.currentUser();
    if (!user || !user.email) throw new Error("Usuário não autenticado ou sem nome de exibição.");

    const postsCollection = collection(this.firestore, 'forumPosts');
    const newPost = {
      ...formData,
      createdByUid: user.uid,
      createdByDisplayName: user.email, // Denormalizado
      createdAt: Timestamp.now(),
    };
    // Poderia adicionar lógica aqui para atualizar 'lastReplyAt' no tópico pai,
    // mas isso exigiria uma transação ou Cloud Function para segurança total.
    return addDoc(postsCollection, newPost);
  }

  /**
   * Registra ou atualiza o voto de um usuário em um tópico.
   * Usa o UID do usuário como ID do documento na subcoleção de votos.
   */
  async voteOnTopic(topicId: string, choice: VoteChoice) {
    const user = this.authService.currentUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const voteDocRef = doc(this.firestore, `forumTopics/${topicId}/votes/${user.uid}`);

    const voteData = {
      choice: choice,
      votedAt: Timestamp.now(),
    };

    // **CORREÇÃO: Use setDoc em vez de updateDoc**
    // setDoc com merge:true cria o documento se não existir, ou atualiza se existir.
    return setDoc(voteDocRef, voteData, { merge: true });
  }

  // Métodos para editar/deletar tópicos e posts podem ser adicionados aqui
  // seguindo um padrão similar, sempre verificando as permissões via regras.
}
