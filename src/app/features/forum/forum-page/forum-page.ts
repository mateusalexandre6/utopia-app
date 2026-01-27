// src/app/features/forum/forum-page/forum-page.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Importe RouterLink
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { TopicFormComponent } from '../topic-form/topic-form';


@Component({
  selector: 'app-forum-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TopicFormComponent], // Adicione RouterLink e TopicFormComponent
  templateUrl: './forum-page.html',
})
export class ForumPageComponent {
  // --- Injeção de Serviços ---
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // --- Sinais Brutos ---
  private allTopics = this.firestoreService.forumTopics;
  private allOrganizations = this.firestoreService.organizations;

  // --- Lógica de Permissões ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    // Garante que users() foi populado antes de procurar
    const users = this.firestoreService.users();
    return users.find(u => u.uid === uid);
  });
  private userOrganizationIds = computed(() => {
    const profile = this.currentUserProfile();
    return profile?.roles ? Object.keys(profile.roles) : [];
  });

  // --- Computed Signals para a UI ---
  isLoading = computed(() => this.allTopics().length === 0 && this.authService.currentUser() === undefined);

  // Filtra os tópicos que o usuário pode ver e adiciona o nome da organização
  visibleTopics = computed(() => {
    const myOrgIds = this.userOrganizationIds();
    // Garante que organizations() foi populado
    const organizations = this.allOrganizations();
    if (organizations.length === 0) return []; // Retorna vazio se organizações não carregaram

    const orgMap = new Map(organizations.map(org => [org.id, org.name]));

    return this.allTopics()
      .filter(topic =>
        topic.scope === 'national' ||
        (topic.scope === 'organization' && myOrgIds.includes(topic.organizationId || ''))
      )
      .map(topic => ({
        ...topic,
        organizationName: topic.organizationId ? orgMap.get(topic.organizationId) : null
      }));
  });

  // --- Estado para o Modal ---
  isTopicFormVisible = signal(false);

  // --- Métodos de Ação ---
  navigateToTopic(topicId: string) {
    this.router.navigate(['/forum', topicId]); // Navegação real para a página de detalhes
  }

  openNewTopicForm() {
    this.isTopicFormVisible.set(true); // Abre o modal
  }

  onCloseTopicForm() {
    this.isTopicFormVisible.set(false); // Fecha o modal
  }
}
