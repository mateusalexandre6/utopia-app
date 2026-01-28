// src/app/features/activities/activity-management/activity-management.component.ts
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
    // --- Injeção de Serviços ---
  private firestoreService = inject(FirestoreService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  // --- Sinais Brutos ---
  private allActivities = this.firestoreService.activities;
  private allOrganizations = this.firestoreService.organizations;
  private allCommissions = this.firestoreService.commissions; // <-- NOVO

  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });

  // --- Estado da UI ---
  filterState = signal<'my-organizations' | 'all'>('my-organizations');
  isFormVisible = false;
  editingActivity: Activity | null = null;
  activityToDelete: Activity | null = null;

  // --- Lógica de Permissões ---
  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

   userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });
   activitiesWithDetails = computed(() => {
    const orgMap = new Map(this.allOrganizations().map(org => [org.id, org.name]));
    const commMap = new Map(this.allCommissions().map(comm => [comm.id, { name: comm.name, orgId: comm.organizationId }]));

    return this.allActivities().map(activity => {
      const commission = commMap.get(activity.commissionId);
      const organizationName = commission ? orgMap.get(commission.orgId) : 'Núcleo Desconhecido';

      return {
        ...activity,
        commissionName: commission ? commission.name : 'Comissão Desconhecida',
        organizationName: organizationName || 'Erro de Associação',
        // Passa o ID do núcleo pai para a verificação de permissão
        parentOrganizationId: commission ? commission.orgId : null,
      };
    });
  });

   isLoading = computed(() => this.allActivities().length === 0 && this.allCommissions().length === 0);


  // --- O "Cérebro": Computed Signal (Agora Puro) ---
  filteredActivities = computed(() => {
     const activities = this.activitiesWithDetails();
    const orgMap = new Map(this.allOrganizations().map(org => [org.id, org.name]));

    const activitiesWithNames = activities.map(activity => ({
      ...activity,
      organizationName: orgMap.get(activity.commissionId) || 'Desconhecida',
    }));

    // <-- O IF PROBLEMÁTICO FOI REMOVIDO DAQUI
    if (this.filterState() === 'all') {
      return activitiesWithNames;
    } else {
      const myOrgIds = this.userOrganizationIds();
      return activitiesWithNames.filter(act =>
          act.parentOrganizationId && myOrgIds.includes(act.parentOrganizationId)
      );
    }
  });

  constructor() {
    // **A SOLUÇÃO: Use um effect() para definir o estado inicial do filtro**
    effect(() => {
      // Este efeito roda sempre que 'isNationalAdmin' muda.
      if (this.isNationalAdmin()) {
        // Se o usuário é um admin, define o filtro padrão para 'all'.
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
      this.activityToDelete = null;
    } catch (error) {
      console.error("Erro ao excluir evento", error);
      // O ideal é mostrar um toast de erro para o usuário aqui
    }
  }
}
