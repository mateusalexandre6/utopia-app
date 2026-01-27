// src/app/features/courses/schedule-form/schedule-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleItem } from '../../../shared/models/schedule-item.model';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { ScheduleService } from '../../../shared/services/schedule';

@Component({
  selector: 'app-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-form.html',
})
export class ScheduleFormComponent implements OnInit {
  @Input({ required: true }) courseId!: string;
  @Input() itemToEdit?: ScheduleItem;
  @Output() close = new EventEmitter<void>();

  private scheduleService = inject(ScheduleService);
  private firestoreService = inject(FirestoreService);

  speakers = this.firestoreService.speakers; // Para o multi-select
  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  model = { title: '', description: '', startTime: '', endTime: '', speakerIds: [] as string[] };

  ngOnInit(): void {
    if (this.itemToEdit) {
      this.isEditMode = true;
      this.model = {
        title: this.itemToEdit.title,
        description: this.itemToEdit.description || '',
        startTime: this.formatDateForInput(this.itemToEdit.startTime.toDate()),
        endTime: this.formatDateForInput(this.itemToEdit.endTime.toDate()),
        speakerIds: this.itemToEdit.speakerIds || [],
      };
    }
  }

  isSpeakerSelected(speakerId: string): boolean {
    return this.model.speakerIds.includes(speakerId);
  }

  toggleSpeakerSelection(speakerId: string): void {
    const selected = this.model.speakerIds;
    const index = selected.indexOf(speakerId);
    if (index > -1) {
      selected.splice(index, 1); // Remove se já estiver selecionado
    } else {
      selected.push(speakerId); // Adiciona se não estiver
    }
    this.model.speakerIds = selected;
  }

  async onSave() {
    this.errorMessage = null;
    if (!this.model.title || !this.model.startTime || !this.model.endTime) {
      this.errorMessage = "Título, Início e Fim são obrigatórios.";
      return;
    }
    this.isLoading = true;
    try {
      if (this.isEditMode && this.itemToEdit) {
        await this.scheduleService.updateScheduleItem(this.courseId, this.itemToEdit.id, this.model);
      } else {
        await this.scheduleService.createScheduleItem(this.courseId, this.model);
      }
      this.close.emit();
    } catch (error) {
      this.errorMessage = "Ocorreu um erro ao salvar o item.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  private formatDateForInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16);
  }
}
