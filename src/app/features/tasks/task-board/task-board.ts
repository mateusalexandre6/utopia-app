// src/app/features/tasks/task-board/task-board.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../../shared/models/task.model';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { TaskService } from '../../../shared/services/task';
import { TaskFormComponent } from '../task-form/task-form';

// Futuramente, importaremos o TaskFormComponent aqui

@Component({
  selector: 'app-task-board',
  standalone: true,
 imports: [CommonModule, DragDropModule, TaskFormComponent], // <-- ADICIONE AQUI // Adicione DragDropModule e o TaskFormComponent
  templateUrl: './task-board.html',
})
export class TaskBoardComponent {
  // --- Injeção de Serviços ---
  private firestoreService = inject(FirestoreService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  // --- Sinais Brutos ---
  private allTasks = this.firestoreService.tasks;
  private allCommissions = this.firestoreService.commissions;
  allOrganizations = this.firestoreService.organizations;
  private allUsers = this.firestoreService.users;


  isFormVisible = signal(false);
  editingTask = signal<Task | null>(null);

  // --- Estado da UI ---
  filterState = signal<'my-organizations' | 'all'>('my-organizations');
  isLoading = computed(() => this.allTasks().length === 0 && this.allCommissions().length === 0);

  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });
   isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });
  private userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  // --- Computed Signals para Preparar os Dados ---
  tasksWithDetails = computed(() => {
    const commMap = new Map(this.allCommissions().map(c => [c.id, { name: c.name, orgId: c.organizationId }]));
    const userMap = new Map(this.allUsers().map(u => [u.uid, u.email]));
    return this.allTasks().map(task => ({
      ...task,
      commissionName: commMap.get(task.commissionId)?.name || '?',
      parentOrganizationId: commMap.get(task.commissionId)?.orgId || null,
      assignedToName: userMap.get(task.assignedTo || '') || null,
    }));
  });

  filteredTasks = computed(() => {
    // (Mesma lógica de filtro que usamos nos outros componentes)
    if (this.filterState() === 'all') return this.tasksWithDetails();
    const myOrgIds = this.userOrganizationIds();
    return this.tasksWithDetails().filter(task => myOrgIds.includes(task.parentOrganizationId || ''));
  });

  // **Computed Signals para as Colunas do Kanban**
  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === 'todo'));
  doingTasks = computed(() => this.filteredTasks().filter(t => t.status === 'doing'));
  doneTasks = computed(() => this.filteredTasks().filter(t => t.status === 'done'));

  constructor() {
    effect(() => {
      if (this.isNationalAdmin()) this.filterState.set('all');
    });
  }

  // Métodos para controlar o formulário
  onNewTask() {
    this.editingTask.set(null);
    this.isFormVisible.set(true);
  }

  onEditTask(task: Task) {
    this.editingTask.set(task);
    this.isFormVisible.set(true);
  }

  onCloseForm() {
    this.isFormVisible.set(false);
  }
  // --- Métodos de Ação ---
  canModify(task: { parentOrganizationId: string | null }): boolean {
    if (!task.parentOrganizationId) return false;
    if (this.isNationalAdmin()) return true;
    return this.userOrganizationIds().includes(task.parentOrganizationId);
  }

  // **Lógica do Drag and Drop**
  async onTaskDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      // Reordenar na mesma lista (opcional, por enquanto não faremos nada)
    } else {
      // Mover entre listas (atualizar status)
      const task = event.item.data;
      const newStatus = event.container.id as TaskStatus;

      // Atualiza a UI otimisticamente
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Envia a atualização para o backend
      try {
        await this.taskService.updateTaskStatus(task.id, newStatus);
      } catch (error) {
        console.error("Falha ao atualizar status da tarefa:", error);
        // Em caso de erro, reverte a mudança na UI (lógica mais avançada)
      }
    }
  }
}
