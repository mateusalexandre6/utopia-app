// src/app/features/forum/topic-form/topic-form.component.ts
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ForumTopicScope } from '../../../shared/models/forum-topic.model';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { ForumService } from '../../../shared/services/forum';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-topic-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './topic-form.html',
})
export class TopicFormComponent {
  @Output() close = new EventEmitter<void>();

  private forumService = inject(ForumService);
  private firestoreService = inject(FirestoreService);

  // Pega a lista de organizações para o dropdown
  organizations = this.firestoreService.organizations;

  // Modelo do formulário
  model = {
    title: '',
    content: '',
    scope: 'national' as ForumTopicScope, // Padrão Nacional
    organizationId: null as string | null,
  };

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Função chamada ao salvar
  async onSave(form: NgForm) {
    this.errorMessage.set(null);

    // Validação básica do template
    if (!form.valid) {
      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    // Validação específica do escopo
    if (this.model.scope === 'organization' && !this.model.organizationId) {
      this.errorMessage.set('Selecione um núcleo para tópicos de organização.');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.forumService.createTopic(this.model);
      this.close.emit(); // Fecha o modal em caso de sucesso
    } catch (error) {
      console.error("Erro ao criar tópico", error);
      this.errorMessage.set("Ocorreu um erro ao criar o tópico. Verifique suas permissões.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // Limpa organizationId se o escopo mudar para nacional
  onScopeChange() {
    if (this.model.scope === 'national') {
      this.model.organizationId = null;
    }
  }
}
