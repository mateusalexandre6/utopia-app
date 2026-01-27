// src/app/features/tasks/task-form/task-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../shared/models/task.model';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { TaskService } from '../../../shared/services/task';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.html',
})
export class TaskFormComponent implements OnInit {
  @Input() taskToEdit?: Task;
  @Output() close = new EventEmitter<void>();

  private taskService = inject(TaskService);
  private firestoreService = inject(FirestoreService);

  // Sinais para popular os dropdowns
  commissions = this.firestoreService.commissions;
  users = this.firestoreService.users;

  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  model = {
    title: '',
    description: '',
    commissionId: '',
    assignedTo: null as string | null,
  };

  ngOnInit(): void {
    if (this.taskToEdit) {
      this.isEditMode = true;
      this.model = {
        title: this.taskToEdit.title,
        description: this.taskToEdit.description || '',
        commissionId: this.taskToEdit.commissionId,
        assignedTo: this.taskToEdit.assignedTo || null,
      };
    }
  }

  async onSave() {
    this.errorMessage = null;
    if (!this.model.title || !this.model.commissionId) {
      this.errorMessage = "Título e Comissão são obrigatórios.";
      return;
    }
    this.isLoading = true;
    try {
      if (this.isEditMode && this.taskToEdit) {
        await this.taskService.updateTaskDetails(this.taskToEdit.id, this.model);
      } else {
        await this.taskService.createTask(this.model);
      }
      this.close.emit();
    } catch (error) {
      this.errorMessage = "Ocorreu um erro ao salvar a tarefa.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}
