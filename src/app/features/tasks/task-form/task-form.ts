import { Component, EventEmitter, Input, OnInit, Output, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { TaskService } from '../../../shared/services/task';
import { AuthService } from '../../../shared/services/auth.service';
import { Task, TaskPriority, TaskStatus } from '../../../shared/models/task.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingSpinner],
  templateUrl: './task-form.html',
})
export class TaskFormComponent implements OnInit {
  @Input() taskToEdit?: Task;
  @Output() close = new EventEmitter<void>();

  private firestoreService = inject(FirestoreService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  // --- Sinais Brutos ---
  allOrganizations = this.firestoreService.organizations;
  allCommissions = this.firestoreService.commissions;
  users = this.firestoreService.users; // Lista completa de usuários

  model = signal({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    assignedTo: '',
    organizationId: '',
    commissionId: '',
  });

  // --- Permissões e Contexto ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });

  userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  isNucleoLocked = computed(() => !this.isNationalAdmin() && this.userOrganizationIds().length > 0);

  // --- 1. Filtro de Comissões (Cascata) ---
  availableCommissions = computed(() => {
    const selectedOrgId = this.model().organizationId;
    if (!selectedOrgId) return [];
    return this.allCommissions().filter(c => c.organizationId === selectedOrgId);
  });

  // --- 2. Filtro de Responsáveis (Apenas membros do Núcleo) ---
  availableUsers = computed(() => {
    const selectedOrgId = this.model().organizationId;
    if (!selectedOrgId) return [];

    // Filtra usuários que tenham a chave do núcleo dentro do seu map de 'roles'
    // Ex: user.roles = { 'nucleo_sp': 'admin' } -> Vai aparecer se selectedOrgId for 'nucleo_sp'
    return this.users().filter(u => u.roles && selectedOrgId in u.roles);
  });

  isLoading = false;

  constructor() {
    effect(() => {
      if (this.isNucleoLocked()) {
        const myOrgId = this.userOrganizationIds()[0];
        if (this.model().organizationId !== myOrgId) {
             this.model.update(m => ({ ...m, organizationId: myOrgId }));
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.taskToEdit) {
      const commission = this.allCommissions().find(c => c.id === this.taskToEdit!.commissionId);

      this.model.set({
        title: this.taskToEdit.title,
        description: this.taskToEdit.description || '',
        status: this.taskToEdit.status,
        priority: this.taskToEdit.priority,
        dueDate: this.taskToEdit.dueDate ? this.formatDateForInput(this.taskToEdit.dueDate.toDate()) : '',
        assignedTo: this.taskToEdit.assignedTo || '',
        organizationId: commission ? commission.organizationId : (this.taskToEdit.organizationId || ''),
        commissionId: this.taskToEdit.commissionId,
      });
    }
  }

  updateField(field: string, value: any) {
    this.model.update(m => ({ ...m, [field]: value }));
  }

  onOrganizationChange(orgId: string) {
    // Reseta comissão e responsável se o núcleo mudar, para evitar inconsistência
    this.model.update(m => ({ ...m, organizationId: orgId, commissionId: '', assignedTo: '' }));
  }

  async onSave() {
    const data = this.model();
    if (!data.title || !data.commissionId) return;

    this.isLoading = true;
    try {
      const payload = {
        title: data.title,
        description: data.description,
        commissionId: data.commissionId,
        organizationId: data.organizationId,
        assignedTo: data.assignedTo,
        priority: data.priority,
        dueDate: data.dueDate, // O Service converte para Timestamp
        status: data.status
      };

      if (this.taskToEdit) {
        await this.taskService.updateTask(this.taskToEdit.id, payload);
      } else {
        await this.taskService.createTask(payload);
      }
      this.close.emit();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  private formatDateForInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  }
}
