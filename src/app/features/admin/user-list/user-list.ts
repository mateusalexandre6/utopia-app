// src/app/features/admin/user-list/user-list.component.ts
import { Component, inject } from '@angular/core';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { RoleManagerComponent } from '../role-manager/role-manager';
import { UserProfile } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
   imports: [RoleManagerComponent],

  templateUrl: './user-list.html',
})
export class UserListComponent {
   private firestoreService = inject(FirestoreService);
  users = this.firestoreService.users;

  // Variável para guardar o usuário selecionado para edição
  selectedUser: UserProfile | null = null;

  formatRoles(roles: { [key: string]: string }): string {
    if (!roles || Object.keys(roles).length === 0) {
      return 'Nenhum papel atribuído';
    }
    return Object.values(roles).join(', ');
  }

  // Função para abrir o modal com o usuário clicado
  onManageRoles(user: UserProfile) {
    this.selectedUser = user;
  }

  // Função para fechar o modal
  onCloseModal() {
    this.selectedUser = null;
  }
}
