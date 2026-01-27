// src/app/features/admin/organization-form/organization-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Organization } from '../../../shared/models/organization.model';
import { AdminService } from '../../../shared/services/admin';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [FormsModule, LoadingSpinner],
  templateUrl: './organization-form.html',
})
export class OrganizationFormComponent implements OnInit {
   @Input() organization?: Organization; // Recebe a organização para editar (opcional)
  @Output() close = new EventEmitter<void>();
  private adminService = inject(AdminService);

  model: Omit<Organization, 'id'> = { name: '', level: 'state', type: 'nucleus' };
  errorMessage: string | null = null;
  isEditMode = false; // Controla se estamos em modo de edição
  isLoading: boolean = false;
  ngOnInit(): void {
    if (this.organization) {
      this.isEditMode = true;
      // Se uma organização foi passada, preenche o formulário com seus dados
      this.model = {
        name: this.organization.name,
        level: this.organization.level,
        type: this.organization.type,
        parentid: this.organization.parentid
      };
    }
  }

  async onSave() {
    this.errorMessage = null;
    if (!this.model.name) {
      this.errorMessage = "O nome é obrigatório.";
      return;
    }
    try {
      this.isLoading = true;
       if (this.isEditMode && this.organization) {
        // Se estamos em modo de edição, chama o método de update
        await this.adminService.updateOrganization(this.organization.id, this.model);
      } else {
        // Senão, chama o método de criação
        await this.adminService.addOrganization(this.model);
      }
      this.close.emit(); // Fecha o modal em caso de sucesso
      this.isLoading = false;
    } catch (error) {
      console.error("Erro ao criar organização", error);
      this.errorMessage = "Ocorreu um erro. Verifique suas permissões.";
          this.isLoading = false;
    }
  }
}
