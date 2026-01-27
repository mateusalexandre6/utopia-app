// src/app/features/forum/topic-detail/topic-detail.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, Observable, of } from 'rxjs';

import { Firestore, doc, collection, onSnapshot } from '@angular/fire/firestore'; // Import Firestore utilities
import { ForumVote, VoteChoice } from '../../../shared/models/forum-vote.model';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { ForumService } from '../../../shared/services/forum';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingSpinner],
  templateUrl: './topic-detail.html',
})
export class TopicDetailComponent {
  // --- Injeção de Serviços ---
  private route = inject(ActivatedRoute);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private forumService = inject(ForumService);
  private firestore = inject(Firestore); // Inject Firestore

  // --- Sinais ---
  topicId = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  currentUser = this.authService.currentUser;

  // Busca o Tópico específico
  topic = computed(() => {
    const id = this.topicId();
    if (!id) return null;
    return this.firestoreService.forumTopics().find(t => t.id === id);
  });

  // Busca os Posts relacionados a este Tópico
  posts = computed(() => {
    const id = this.topicId();
    if (!id) return [];
    return this.firestoreService.forumPosts().filter(p => p.topicId === id)
            .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()); // Ordena do mais antigo para o mais novo
  });

  // **Lógica de Votação**
  private votes = signal<ForumVote[]>([]); // Sinal para guardar os votos deste tópico
  myVote = computed(() => this.votes().find(v => (v as any).id === this.currentUser()?.uid)?.choice); // Encontra o voto do usuário atual

  // Contagem de votos (calculada no cliente)
  voteCounts = computed(() => {
    const counts = { yes: 0, no: 0, abstain: 0 };
    this.votes().forEach(vote => {
      counts[vote.choice]++;
    });
    return counts;
  });
  totalVotes = computed(() => this.votes().length);

  // --- Estado da UI ---
  isLoading = computed(() => !this.topic() && this.topicId() !== null);
  newPostContent = signal('');
  isPosting = signal(false);
  postError = signal<string | null>(null);

  constructor() {
    // Efeito para se inscrever aos votos da subcoleção quando o topicId estiver disponível
    effect(() => {
      const id = this.topicId();
      if (id) {
        const votesColRef = collection(this.firestore, `forumTopics/${id}/votes`);
        // onSnapshot ouve as mudanças na subcoleção de votos
        const unsubscribe = onSnapshot(votesColRef, (snapshot) => {
        this.votes.set(snapshot.docs.map(doc => {
    const data = doc.data();
   return {
      id: doc.id,
      choice: data['choice'] ?? '',
      votedAtts: data['votedAtts'] ?? [],
      votedAt: data['votedAt']?.toDate?.() ?? new Date()
    } as ForumVote;
  }));
        }, (error) => {
          console.error("Erro ao ouvir votos: ", error);
        });
        // Lembre-se de desinscrever quando o componente for destruído (não mostrado aqui por brevidade)
      }
    });
  }

  // --- Métodos de Ação ---
  async handleVote(choice: VoteChoice) {
    const id = this.topicId();
    if (!id) return;
    try {
      await this.forumService.voteOnTopic(id, choice);
    } catch (error) {
      console.error("Erro ao votar:", error);
      // Exibir erro para o usuário
    }
  }

  async handlePostReply(form: NgForm) {
    const id = this.topicId();
    if (!id || !form.valid || !this.newPostContent().trim()) return;

    this.isPosting.set(true);
    this.postError.set(null);
    try {
      await this.forumService.addPost({ topicId: id, content: this.newPostContent() });
      this.newPostContent.set(''); // Limpa o campo
      form.resetForm(); // Reseta o estado do formulário
    } catch (error) {
      console.error("Erro ao postar resposta:", error);
      this.postError.set("Não foi possível enviar sua resposta. Tente novamente.");
    } finally {
      this.isPosting.set(false);
    }
  }
  getTopics() {
    return this.firestoreService.organizations().find(o => o.id === this.topic()?.organizationId)?.name
  }
}
