// src/app/features/admin/commission-list/commission-list.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Commission } from '../../../shared/models/commission.model';
import { AdminService } from '../../../shared/services/admin';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { CommissionFormComponent } from '../commission-form/commission-form';
// Futuramente, importaremos o CommissionFormComponent aqui

@Component({
  selector: 'app-commission-list',
  standalone: true,
    imports: [CommonModule, CommissionFormComponent], // Adicione o formulário aqui
 // Adicionaremos o CommissionFormComponent aqui
  templateUrl: './commission-list.html',
})
export class CommissionListComponent {
   private firestoreService = inject(FirestoreService);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  // --- Sinais Brutos e Estado da UI ---
  private allCommissions = this.firestoreService.commissions;
  private allOrganizations = this.firestoreService.organizations;
  filterState = signal<'my-organizations' | 'all'>('my-organizations');
  isLoading = computed(() => this.allCommissions().length === 0 && this.allOrganizations().length === 0);
  isFormVisible = false;
  editingCommission: Commission | null = null;
  commissionToDelete: Commission | null = null;

  // --- Lógica de Permissões ---
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

  // --- Computed Signals Puros (Read-Only) ---
   commissionsWithDetails = computed(() => {
    const orgMap = new Map(this.allOrganizations().map(org => [org.id, org.name]));
    return this.allCommissions().map(comm => ({
      ...comm,
      organizationName: orgMap.get(comm.organizationId) || 'Núcleo não encontrado',
    }));
  });

  filteredCommissions = computed(() => {
    // A lógica de escrita foi REMOVIDA daqui, tornando este computed puro.
    if (this.filterState() === 'all') {
      return this.commissionsWithDetails();
    }
    const myOrgIds = this.userOrganizationIds();
    return this.commissionsWithDetails().filter(comm => myOrgIds.includes(comm.organizationId));
  });

   constructor() {
    // **A SOLUÇÃO: Use um effect() para o side effect**
    effect(() => {
      // Este efeito roda sempre que 'isNationalAdmin' muda.
      if (this.isNationalAdmin()) {
        // Se o usuário é um admin, define o filtro padrão para 'all'.
        this.filterState.set('all');
      }
    }, { allowSignalWrites: true }); // Necessário no construtor
  }
  // --- Métodos de Ação ---
  canModify(commissionOrgId: string): boolean {
    if (this.isNationalAdmin()) return true;
    return this.userOrganizationIds().includes(commissionOrgId);
  }

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
