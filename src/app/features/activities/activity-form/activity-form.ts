// src/app/features/activities/activity-form/activity-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Activity } from '../../../shared/models/activity.model';
import { ActivityService } from '../../../shared/services/activity';
import { AuthService } from '../../../shared/services/auth.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingSpinner],
  templateUrl: './activity-form.html',
})
export class ActivityFormComponent implements OnInit {
 @Input() activityToEdit?: Activity;
  @Output() close = new EventEmitter<void>();

  private firestoreService = inject(FirestoreService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  // --- Sinais Brutos ---
  allOrganizations = this.firestoreService.organizations;
  allCommissions = this.firestoreService.commissions;

  // --- Modelo do Formulário (agora como um signal para reatividade) ---
  model = signal({
    title: '',
    description: '',
    date: '',
    organizationId: '', // ID do núcleo selecionado
    commissionId: '',
  });

  // --- Lógica de Permissões ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });
  private isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });
  private userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  // Determina se o dropdown de núcleo deve ser travado
  isNucleoLocked = computed(() => !this.isNationalAdmin() && this.userOrganizationIds().length === 1);

  // **O "CÉREBRO" DO DROPDOWN EM CASCATA**
  // Gera a lista de comissões disponíveis com base no núcleo selecionado
  availableCommissions = computed(() => {
    const selectedOrgId = this.model().organizationId;
    if (!selectedOrgId) {
      return []; // Se nenhum núcleo for selecionado, a lista de comissões é vazia
    }
    return this.allCommissions().filter(comm => comm.organizationId === selectedOrgId);
  });

  // --- Estado da UI ---
  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  constructor() {
    // Efeito para pré-selecionar e travar o núcleo se o usuário não for admin
    effect(() => {
      if (this.isNucleoLocked()) {
        const userNucleoId = this.userOrganizationIds()[0];
        this.model.update(m => ({ ...m, organizationId: userNucleoId }));
      }
    });
  }

  ngOnInit(): void {
    if (this.activityToEdit) {
      this.isEditMode = true;
      // Para edição, precisamos encontrar o núcleo da comissão
      const commission = this.allCommissions().find(c => c.id === this.activityToEdit!.commissionId);
      this.model.set({
        title: this.activityToEdit.title,
        description: this.activityToEdit.description,
        date: this.formatDateForInput(this.activityToEdit.date.toDate()),
        organizationId: commission ? commission.organizationId : '',
        commissionId: this.activityToEdit.commissionId,
      });
    }
  }

  // Reseta a seleção da comissão quando o núcleo muda
  onNucleoChange(): void {
    this.model.update(m => ({ ...m, commissionId: '' }));
  }

  async onSave() {
    this.errorMessage = null;
    const currentModel = this.model();
    if (!currentModel.title || !currentModel.date || !currentModel.commissionId) {
      this.errorMessage = "Título, data e comissão são obrigatórios.";
      return;
    }
    this.isLoading = true;
    try {
      // O serviço só precisa dos dados finais, não do organizationId temporário
      const formData = {
        title: currentModel.title,
        description: currentModel.description,
        date: currentModel.date,
        commissionId: currentModel.commissionId,
      };
      if (this.isEditMode && this.activityToEdit) {
        await this.activityService.updateActivity(this.activityToEdit.id, formData);
      } else {
        await this.activityService.createActivity(formData);
      }
      this.close.emit();
    } catch (error) {
      this.errorMessage = "Ocorreu um erro ao salvar.";
    } finally {
      this.isLoading = false;
    }
  }
  updateTitle(title: string) {
  this.model.update(m => ({ ...m, title }));
}

updateDate(date: string) {
  this.model.update(m => ({ ...m, date }));
}

updateDescription(description: string) {
  this.model.update(m => ({ ...m, description }));
}

onOrganizationChange(orgId: string) {
  this.model.update(m => ({ ...m, organizationId: orgId, commissionId: '' }));
  this.onNucleoChange();
}

onCommissionChange(commId: string) {
  this.model.update(m => ({ ...m, commissionId: commId }));
}

  // Função auxiliar para formatar a data corretamente
  private formatDateForInput(date: Date): string {
    // Adiciona o fuso horário local para evitar problemas de conversão
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16);
  }
}
