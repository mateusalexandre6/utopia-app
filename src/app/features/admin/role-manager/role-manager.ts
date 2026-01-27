// src/app/features/admin/role-manager/role-manager.component.ts

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../shared/models/user.model';
import { AdminService } from '../../../shared/services/admin';

@Component({
  selector: 'app-role-manager',
  standalone: true,
  imports: [FormsModule], // Necessário para o ngModel
  templateUrl: './role-manager.html',
})
export class RoleManagerComponent implements OnInit {
  @Input({ required: true }) user!: UserProfile;
  @Output() close = new EventEmitter<void>();

  private adminService = inject(AdminService);

  // Usamos uma string para editar os papéis como texto JSON.
  // É uma abordagem simples e poderosa para um painel admin.
  rolesAsText: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    // Quando o componente inicia, converte o objeto de papéis para uma string JSON formatada
    this.rolesAsText = JSON.stringify(this.user.roles, null, 2);
  }

  async onSaveRoles() {
    this.errorMessage = null;
    this.successMessage = null;
    try {
      // Converte o texto de volta para um objeto JSON
      const newRoles = JSON.parse(this.rolesAsText);
      await this.adminService.updateUserRoles(this.user.uid, newRoles);
      this.successMessage = 'Papéis atualizados com sucesso!';

      // Fecha o modal após 2 segundos em caso de sucesso
      setTimeout(() => this.close.emit(), 2000);

    } catch (error) {
      console.error('Failed to update roles', error);
      this.errorMessage = 'Erro ao salvar. Verifique o formato do JSON ou suas permissões.';
    }
  }
}
