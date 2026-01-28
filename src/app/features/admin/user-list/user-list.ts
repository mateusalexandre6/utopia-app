import { Component, computed, inject } from '@angular/core';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { AuthService } from '../../../shared/services/auth.service'; // Novo
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
  private authService = inject(AuthService);

  // Lista bruta
  private allUsers = this.firestoreService.users;

  // --- Lógica de Filtro ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.allUsers().find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  userOrganizationIds = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.keys(roles) : [];
  });

  // Lista Filtrada (Essa é a que o HTML deve usar)
  filteredUsers = computed(() => {
    const users = this.allUsers();

    if (this.isNationalAdmin()) {
      return users; // Admin Nacional vê todos
    }

    // Admin Estadual: Vê usuários que tem role no meu núcleo
    const myOrgs = this.userOrganizationIds();
    return users.filter(user => {
      if (!user.roles) return false;
      // Verifica se o usuário alvo tem alguma chave de role que bate com meus núcleos
      const userOrgKeys = Object.keys(user.roles);
      return userOrgKeys.some(orgId => myOrgs.includes(orgId));
    });
  });

  selectedUser: UserProfile | null = null;

  formatRoles(roles: { [key: string]: string }): string {
    if (!roles || Object.keys(roles).length === 0) {
      return 'Nenhum papel atribuído';
    }
    // Melhoria visual: Mostra "Núcleo: Cargo"
    return Object.entries(roles)
      .map(([orgId, role]) => `${role} (${orgId})`) // O ideal seria mapear ID -> Nome do Núcleo
      .join(', ');
  }

  onManageRoles(user: UserProfile) {
    this.selectedUser = user;
  }

  onCloseModal() {
    this.selectedUser = null;
  }
}
