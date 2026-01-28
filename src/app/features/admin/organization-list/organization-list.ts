import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Adicionei CommonModule para o @if
import { FirestoreService } from '../../../shared/services/firestore.service';
import { OrganizationFormComponent } from '../organization-form/organization-form';
import { Organization } from '../../../shared/models/organization.model';
import { AdminService } from '../../../shared/services/admin';
import { AuthService } from '../../../shared/services/auth.service'; // Novo

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, OrganizationFormComponent],
  templateUrl: './organization-list.html',
})
export class OrganizationListComponent {
  private firestoreService = inject(FirestoreService);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  organizations = this.firestoreService.organizations;
  users = this.firestoreService.users; // Necessário para buscar roles

  isFormVisible = false;
  editingOrganization: Organization | null = null;
  organizationToDelete: Organization | null = null;

  // --- Verificação de Segurança ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.users().find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  onEdit(org: Organization) {
    this.editingOrganization = org;
    this.isFormVisible = true;
  }

  onDelete(org: Organization) {
    this.organizationToDelete = org;
    const modal = document.getElementById('delete_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  async confirmDelete() {
    if (!this.organizationToDelete) return;
    try {
      await this.adminService.deleteOrganization(this.organizationToDelete.id);
      this.organizationToDelete = null;
    } catch (error) {
      console.error("Erro ao excluir organização", error);
      alert("Erro ao excluir. Verifique permissões.");
    }
  }

  onCloseForm() {
    this.isFormVisible = false;
    this.editingOrganization = null;
  }
}
