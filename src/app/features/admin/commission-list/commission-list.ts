import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Commission } from '../../../shared/models/commission.model';
import { AdminService } from '../../../shared/services/admin';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { CommissionFormComponent } from '../commission-form/commission-form';

@Component({
  selector: 'app-commission-list',
  standalone: true,
  imports: [CommonModule, CommissionFormComponent],
  templateUrl: './commission-list.html',
})
export class CommissionListComponent {
  private firestoreService = inject(FirestoreService);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  private allCommissions = this.firestoreService.commissions;
  private allOrganizations = this.firestoreService.organizations;

  // O filtro padrão começa como 'my-organizations' para segurança
  filterState = signal<'my-organizations' | 'all'>('my-organizations');

  isLoading = computed(() => this.allCommissions().length === 0);
  isFormVisible = false;
  editingCommission: Commission | null = null;
  commissionToDelete: Commission | null = null;

  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  commissionsWithDetails = computed(() => {
    const orgMap = new Map(this.allOrganizations().map(org => [org.id, org.name]));
    return this.allCommissions().map(comm => ({
      ...comm,
      organizationName: orgMap.get(comm.organizationId) || 'Núcleo Desconhecido',
    }));
  });

  // --- FILTRO SEGURO ---
  filteredCommissions = computed(() => {
    const commissions = this.commissionsWithDetails();
    const myOrgIds = this.userOrganizationIds();

    // Regra 1: Se não é admin nacional, SEMPRE filtra pelos meus núcleos.
    // Ignora o filterState() 'all' se o usuário não tiver permissão.
    if (!this.isNationalAdmin()) {
      return commissions.filter(comm => myOrgIds.includes(comm.organizationId));
    }

    // Regra 2: Se é admin nacional, obedece o filtro da UI
    if (this.filterState() === 'all') {
      return commissions;
    } else {
      // Caso o Admin Nacional queira ver só as "suas" (se ele tiver cargo em alguma específica)
      return commissions.filter(comm => myOrgIds.includes(comm.organizationId));
    }
  });

  constructor() {
    effect(() => {
      // Admin Nacional começa vendo tudo por conveniência
      if (this.isNationalAdmin()) {
        this.filterState.set('all');
      }
    }, { allowSignalWrites: true });
  }

  canModify(commissionOrgId: string): boolean {
    if (this.isNationalAdmin()) return true;
    return this.userOrganizationIds().includes(commissionOrgId);
  }

  // ... (Resto dos métodos onNewCommission, onEdit, onDelete iguais) ...
  onNewCommission() {
    this.editingCommission = null;
    this.isFormVisible = true;
  }
  onEdit(commission: Commission) {
    this.editingCommission = commission;
    this.isFormVisible = true;
  }
  onCloseForm() {
    this.isFormVisible = false;
    this.editingCommission = null;
  }
  onDelete(commission: Commission) {
    this.commissionToDelete = commission;
    (document.getElementById('delete_commission_modal') as HTMLDialogElement)?.showModal();
  }
  async confirmDelete() {
    if (!this.commissionToDelete) return;
    await this.adminService.deleteCommission(this.commissionToDelete.id);
    this.commissionToDelete = null;
  }
}
