// src/app/features/courses/speaker-form/speaker-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Speaker } from '../../../shared/models/speaker.model';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { SpeakerService } from '../../../shared/services/speaker';

@Component({
  selector: 'app-speaker-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './speaker-form.html',
})
export class SpeakerFormComponent implements OnInit {
  @Input() speakerToEdit?: Speaker;
  @Output() close = new EventEmitter<void>();

  private speakerService = inject(SpeakerService);
  private firestoreService = inject(FirestoreService);

  organizations = this.firestoreService.organizations; // Para o dropdown de núcleo
  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  model = { name: '', bio: '', organizationId: '' };

  ngOnInit(): void {
    if (this.speakerToEdit) {
      this.isEditMode = true;
      this.model = {
        name: this.speakerToEdit.name,
        bio: this.speakerToEdit.bio,
        organizationId: this.speakerToEdit.organizationId,
      };
    }
  }

  async onSave() {
    this.errorMessage = null;
    if (!this.model.name || !this.model.organizationId) {
      this.errorMessage = "Nome e Núcleo são obrigatórios.";
      return;
    }
    this.isLoading = true;
    try {
      if (this.isEditMode && this.speakerToEdit) {
        await this.speakerService.updateSpeaker(this.speakerToEdit.id, this.model);
      } else {
        await this.speakerService.createSpeaker(this.model);
      }
      this.close.emit();
    } catch (error) {
      this.errorMessage = "Ocorreu um erro ao salvar o palestrante.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}
