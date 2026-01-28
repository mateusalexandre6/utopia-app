import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../../shared/models/task.model';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { TaskService } from '../../../shared/services/task';
import { TaskFormComponent } from '../task-form/task-form';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE: Adicionar FormsModule

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskFormComponent, FormsModule], // <--- Adicionar FormsModule
  templateUrl: './task-board.html',
})
export class TaskBoardComponent {
  private firestoreService = inject(FirestoreService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  private allTasks = this.firestoreService.tasks;
  private allCommissions = this.firestoreService.commissions;
  allOrganizations = this.firestoreService.organizations;
  private allUsers = this.firestoreService.users;

  // --- Estados de Filtro ---
  filterState = signal<'my-organizations' | 'all'>('my-organizations');

  // NOVOS FILTROS
  selectedOrgFilter = signal<string>('');       // ID do núcleo selecionado
  selectedCommissionFilter = signal<string>(''); // ID da comissão selecionada

  isFormVisible = signal(false);
  editingTask = signal<Task | null>(null);
  taskToDelete = signal<Task | null>(null);

  // --- Computeds ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.allUsers().find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  // Lista de comissões disponíveis para o Filtro (Dinâmico)
  commissionsForFilter = computed(() => {
    const state = this.filterState();
    const selectedOrg = this.selectedOrgFilter();

    if (state === 'all') {
      // Se selecionou um núcleo, mostra comissões dele. Se não, mostra vazia (ou todas se preferir)
      if (selectedOrg) {
        return this.allCommissions().filter(c => c.organizationId === selectedOrg);
      }
      return []; // Não mostra comissões misturadas até selecionar o núcleo
    } else {
      // Modo 'Minhas Comissões': Mostra apenas comissões dos meus núcleos
      const myOrgs = this.userOrganizationIds();
      return this.allCommissions().filter(c => myOrgs.includes(c.organizationId));
    }
  });

  tasksWithDetails = computed(() => {
    const tasks = this.allTasks();
    const commMap = new Map(this.allCommissions().map(c => [c.id, { name: c.name, orgId: c.organizationId }]));
    const userMap = new Map(this.allUsers().map(u => [u.uid, u.displayName || u.email]));

    return tasks.map(task => {
      const commission = commMap.get(task.commissionId);
      return {
        ...task,
        commissionName: commission?.name || 'Comissão Desconhecida',
        parentOrganizationId: commission?.orgId || null,
        assignedToName: task.assignedTo ? userMap.get(task.assignedTo) : null
      };
    });
  });

  // --- LÓGICA DE FILTRAGEM FINAL ---
  filteredTasks = computed(() => {
    let tasks = this.tasksWithDetails();
    const state = this.filterState();
    const orgFilter = this.selectedOrgFilter();
    const commFilter = this.selectedCommissionFilter();

    // 1. Filtro Macro (Todos vs Meus)
    if (state === 'my-organizations') {
      const myOrgs = this.userOrganizationIds();
      tasks = tasks.filter(t => t.parentOrganizationId && myOrgs.includes(t.parentOrganizationId));
    }

    // 2. Filtro de Núcleo (Só aplica se estiver em 'Todas', pois em 'Meus' já foi filtrado acima)
    if (state === 'all' && orgFilter) {
      tasks = tasks.filter(t => t.parentOrganizationId === orgFilter);
    }

    // 3. Filtro de Comissão
    if (commFilter) {
      tasks = tasks.filter(t => t.commissionId === commFilter);
    }

    return tasks;
  });

  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === 'todo'));
  doingTasks = computed(() => this.filteredTasks().filter(t => t.status === 'doing'));
  doneTasks = computed(() => this.filteredTasks().filter(t => t.status === 'done'));

  constructor() {
    effect(() => {
      // Se mudar o modo de visualização (Minhas vs Todas), reseta os filtros finos
      this.filterState(); // dependência
      this.selectedOrgFilter.set('');
      this.selectedCommissionFilter.set('');
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.isNationalAdmin()) {
        this.filterState.set('all');
      }
    });
  }

  // Ações de UI
  setFilterState(state: 'my-organizations' | 'all') {
    this.filterState.set(state);
    // O effect acima vai limpar os selects automaticamente
  }

  // ... (Resto do código: canModify, onNewTask, onDeleteTask, dragDrop, etc. MANTENHA IGUAL)

  canModify(task: { parentOrganizationId: string | null }): boolean {
    if (!task.parentOrganizationId) return false;
    if (this.isNationalAdmin()) return true;
    return this.userOrganizationIds().includes(task.parentOrganizationId);
  }

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

  onDeleteTask(task: Task) {
    this.taskToDelete.set(task);
  }

  async confirmDelete() {
    const task = this.taskToDelete();
    if (!task) return;
    try {
      await this.taskService.deleteTask(task.id);
      this.taskToDelete.set(null);
    } catch (error) {
      console.error("Erro ao excluir tarefa", error);
    }
  }

  cancelDelete() {
    this.taskToDelete.set(null);
  }

  async onTaskDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data;
      const newStatus = event.container.id as TaskStatus;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      try {
        await this.taskService.updateTaskStatus(task.id, newStatus);
      } catch (error) {
        console.error("Erro ao atualizar status", error);
      }
    }
  }
}
