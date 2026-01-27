// src/app/features/admin/commission-form/commission-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Commission } from '../../../shared/models/commission.model';
import { AdminService } from '../../../shared/services/admin';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-commission-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './commission-form.html',
})
export class CommissionFormComponent implements OnInit {
  @Input() commissionToEdit?: Commission;
  @Output() close = new EventEmitter<void>();

  private adminService = inject(AdminService);
  private firestoreService = inject(FirestoreService);

  // Pega a lista de organizações (núcleos) para o dropdown
  organizations = this.firestoreService.organizations;
  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  model = {
    name: '',
    description: '',
    organizationId: '',
    isFormationCommission: false,
  };

  ngOnInit(): void {
    if (this.commissionToEdit) {
      this.isEditMode = true;
     this.model = {
        name: this.commissionToEdit.name,
        description: this.commissionToEdit.description || '',
        organizationId: this.commissionToEdit.organizationId,
        // Garante que o toggle reflita o estado salvo da comissão
        isFormationCommission: this.commissionToEdit.isFormationCommission || false, // <-- ATUALIZADO AQUI
      };
    }
  }

  async onSave() {
    this.errorMessage = null;
    if (!this.model.name || !this.model.organizationId) {
      this.errorMessage = "Nome e Núcleo são obrigatórios.";
      return;
    }
    this.isLoading = true;
    try {
      if (this.isEditMode && this.commissionToEdit) {
        // O método updateCommission já aceita Partial<Commission>, então o novo campo será salvo
        await this.adminService.updateCommission(this.commissionToEdit.id, this.model);
      } else {
        // O método addCommission também já aceita o novo campo
        await this.adminService.addCommission(this.model);
      }
      this.close.emit();
    } catch (error) {
      this.errorMessage = "Ocorreu um erro ao salvar. Verifique suas permissões.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}
