import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Activity } from '../../../shared/models/activity.model';
import { ActivityFormComponent } from '../activity-form/activity-form';
import { AuthService } from '../../../shared/services/auth.service';
import { ActivityService } from '../../../shared/services/activity';

@Component({
  selector: 'app-activity-management',
  standalone: true,
  imports: [CommonModule, ActivityFormComponent],
  templateUrl: './activity-management.html',
})
export class ActivityManagementComponent {
  private firestoreService = inject(FirestoreService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  private allActivities = this.firestoreService.activities;
  private allOrganizations = this.firestoreService.organizations;
  private allCommissions = this.firestoreService.commissions;

  // --- Estado da UI ---
  filterState = signal<'my-organizations' | 'all'>('my-organizations');

  // NOVO: Controle de Abas (Lista vs Calendário)
  viewMode = signal<'list' | 'calendar'>('list');
today = new Date();
  // NOVO: Data base para o calendário (Mês atual)
  currentCalendarDate = signal(new Date());

  isFormVisible = false;
  editingActivity: Activity | null = null;
  activityToDelete: Activity | null = null;

  // --- Lógica de Permissões ---
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

  // --- Processamento de Dados ---
  activitiesWithDetails = computed(() => {
    const activities = this.allActivities();
    const orgMap = new Map(this.allOrganizations().map(o => [o.id, o.name]));
    const commMap = new Map(this.allCommissions().map(c => [c.id, { name: c.name, orgId: c.organizationId }]));

    return activities.map(act => {
      const commission = commMap.get(act.commissionId);
      return {
        ...act,
        commissionName: commission ? commission.name : 'Comissão Desconhecida',
        organizationName: commission && commission.orgId ? orgMap.get(commission.orgId) : 'Núcleo Desconhecido',
        parentOrganizationId: commission ? commission.orgId : null
      };
    });
  });

  filteredActivities = computed(() => {
    const activitiesWithNames = this.activitiesWithDetails();
    if (this.filterState() === 'all') {
      return activitiesWithNames;
    } else {
      const myOrgIds = this.userOrganizationIds();
      return activitiesWithNames.filter(act =>
        act.parentOrganizationId && myOrgIds.includes(act.parentOrganizationId)
      );
    }
  });

  // --- LÓGICA DO CALENDÁRIO (NOVA) ---

  // 1. Agrupar atividades por data (String YYYY-MM-DD) para fácil acesso no HTML
  calendarActivitiesMap = computed(() => {
    const activities = this.filteredActivities();
    const map = new Map<string, any[]>();

    activities.forEach(act => {
      const date = act.date.toDate();
      // Cria chave "2023-10-25" (respeitando timezone local simplificado)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(act);
    });
    return map;
  });

  // 2. Gerar os dias para desenhar o grid
  calendarDays = computed(() => {
    const currDate = this.currentCalendarDate();
    const year = currDate.getFullYear();
    const month = currDate.getMonth();

    // Primeiro dia do mês (0 = Domingo, 1 = Segunda...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total de dias no mês
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date | null, dayNum: number, key: string }[] = [];

    // Preencher dias vazios antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ date: null, dayNum: 0, key: '' });
    }

    // Preencher os dias reais
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: d, dayNum: i, key: key });
    }

    return days;
  });

  // Navegação do Calendário
  changeMonth(delta: number) {
    this.currentCalendarDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  }

  // --- Construtor e Métodos Existentes ---

  constructor() {
    effect(() => {
      if (this.isNationalAdmin()) {
        this.filterState.set('all');
      }
    });
  }

  canModify(parentOrganizationId: string | null): boolean {
    if (!parentOrganizationId) return false;
    if (this.isNationalAdmin()) return true;
    return this.userOrganizationIds().includes(parentOrganizationId);
  }

  onNewActivity() {
    this.editingActivity = null;
    this.isFormVisible = true;
  }

  onEdit(activity: Activity) {
    this.editingActivity = activity;
    this.isFormVisible = true;
  }

  onCloseForm() {
    this.isFormVisible = false;
    this.editingActivity = null;
  }

  onDelete(activity: Activity) {
    this.activityToDelete = activity;
    (document.getElementById('delete_activity_modal') as HTMLDialogElement)?.showModal();
  }

  async confirmDelete() {
    if (!this.activityToDelete) return;
    try {
      await this.activityService.deleteActivity(this.activityToDelete.id);
      // Feedback visual opcional
    } catch (e) {
      console.error(e);
    } finally {
      this.activityToDelete = null;
    }
  }
}
