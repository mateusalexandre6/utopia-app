// src/app/features/admin/organization-list/organization-list.component.ts
import { Component, inject } from '@angular/core';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { OrganizationFormComponent } from '../organization-form/organization-form';
import { Organization } from '../../../shared/models/organization.model';
import { AdminService } from '../../../shared/services/admin';

@Component({
  selector: 'app-organization-list',
  standalone: true,
 imports: [OrganizationFormComponent],
  templateUrl: './organization-list.html',
})
export class OrganizationListComponent {
private firestoreService = inject(FirestoreService);
  private adminService = inject(AdminService);
  organizations = this.firestoreService.organizations;

  isFormVisible = false;
  editingOrganization: Organization | null = null;
  organizationToDelete: Organization | null = null; // <-- Para o modal de confirmação

 onEdit(org: Organization) {
    this.editingOrganization = org;
    this.isFormVisible = true;
  }
  async onDelete(org: Organization) {
    // Adiciona uma confirmação simples antes de excluir
    if (confirm(`Tem certeza que deseja excluir a organização "${org.name}"?`)) {
      try {
        await this.adminService.deleteOrganization(org.id);
      } catch (error) {
        console.error("Erro ao excluir organização", error);
        alert("Não foi possível excluir a organização. Verifique suas permissões.");
      }
    }
  }
async confirmDelete() {
    if (!this.organizationToDelete) return;

    try {
      await this.adminService.deleteOrganization(this.organizationToDelete.id);
      this.organizationToDelete = null; // Limpa o estado
    } catch (error) {
      // (opcional) Adicionar um toast/alert de erro aqui
      console.error("Erro ao excluir organização", error);
    }
  }
  onCloseForm() {
    this.isFormVisible = false;
    this.editingOrganization = null;
  }
}
