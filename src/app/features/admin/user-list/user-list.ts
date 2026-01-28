import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AdminService } from '../../../shared/services/admin';
import { RoleManagerComponent } from '../role-manager/role-manager';
import { UserProfile } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleManagerComponent],
  templateUrl: './user-list.html',
})
export class UserListComponent {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  private allUsers = this.firestoreService.users;
  allOrganizations = this.firestoreService.organizations;

  // --- DIAGNÓSTICO E PERMISSÕES ---

  // 1. Perfil do Usuário Logado
  private currentUserProfile = computed(() => {
    // Tenta pegar o UID. Se o Auth ainda estiver carregando, pode ser null no início.
    const user = this.authService.currentUser();
    const uid = user?.uid;
    const usersList = this.allUsers();

    if (!uid) return null;

    const foundUser = usersList.find(u => u.uid === uid);

    // DEBUG: Verifique isso no Console do Navegador (F12)
    if (!foundUser) {
      console.warn(`[UserList] Usuário logado (UID: ${uid}) não encontrado na coleção 'users'.`);
    }
    return foundUser;
  });

  // 2. IDs das Organizações que eu gerencio
  userOrganizationIds = computed(() => {
    const profile = this.currentUserProfile();

    if (!profile) return [];
    if (!profile.roles) {
      console.warn('[UserList] Usuário logado não tem o campo "roles" no banco de dados.');
      return [];
    }

    const orgIds = Object.keys(profile.roles);
    console.log('[UserList] Meus IDs de Núcleo calculados:', orgIds);
    return orgIds;
  });

  // 3. Sou Admin Nacional?
  isNationalAdmin = computed(() => {
    const profile = this.currentUserProfile();
    if (!profile?.roles) return false;
    return Object.values(profile.roles).includes('admin_nacional');
  });

  // 4. Lista de Usuários Filtrada
  filteredUsers = computed(() => {
    const users = this.allUsers();

    if (this.isNationalAdmin()) {
      return users;
    }

    const myOrgs = this.userOrganizationIds();
    // Se não sou nacional e não tenho núcleos, não vejo ninguém (ou vejo vazio)
    if (myOrgs.length === 0) return [];

    return users.filter(user => {
      if (!user.roles) return false;
      const userOrgKeys = Object.keys(user.roles);
      return userOrgKeys.some(orgId => myOrgs.includes(orgId));
    });
  });

  // --- Lógica de Modais e Ações (Mantida Igual) ---
  selectedUser: UserProfile | null = null;
  isCreateModalVisible = signal(false);
  isCreating = signal(false);
  newUser = signal({ displayName: '', email: '', password: '', organizationId: '' });

  formatRoles(roles: { [key: string]: string }): string {
    if (!roles || Object.keys(roles).length === 0) return 'Nenhum papel atribuído';
    return Object.entries(roles)
      .map(([orgId, role]) => `${role} (${orgId})`)
      .join(', ');
  }

  onManageRoles(user: UserProfile) {
    this.selectedUser = user;
    console.log('[UserList] Abrindo RoleManager. Enviando meus IDs:', this.userOrganizationIds());
  }

  onCloseModal() {
    this.selectedUser = null;
  }

  openCreateModal() {
    let defaultOrgId = '';
    if (!this.isNationalAdmin()) {
      const myOrgs = this.userOrganizationIds();
      if (myOrgs.length > 0) defaultOrgId = myOrgs[0];
    }
    this.newUser.set({ displayName: '', email: '', password: '', organizationId: defaultOrgId });
    this.isCreateModalVisible.set(true);
  }

  closeCreateModal() {
    this.isCreateModalVisible.set(false);
  }

  async onCreateUser() {
    const { email, password, displayName, organizationId } = this.newUser();
    if (!email || !password || !displayName) return;

    this.isCreating.set(true);
    try {
      await this.adminService.createUser(email, password, displayName, organizationId);
      this.closeCreateModal();
      alert('Usuário criado com sucesso!');
    } catch (error: any) {
      console.error('Erro:', error);
      alert('Erro ao criar usuário: ' + error.message);
    } finally {
      this.isCreating.set(false);
    }
  }

  getRoleBadges(user: UserProfile) {
    const badges: { label: string, class: string }[] = [];
    const roles = user.roles || {};
    const orgs = this.allOrganizations();
    const orgMap = new Map(orgs.map(o => [o.id, o.name]));

    for (const [key, value] of Object.entries(roles)) {
      if (value === 'admin_nacional') {
        badges.push({ label: 'Nacional', class: 'badge-warning text-black border-none font-bold' });
      } else {
        const orgName = orgMap.get(key) || 'Núcleo Desconhecido';
        let label = '';
        let cssClass = '';

        switch(value) {
          case 'admin_estadual':
            label = `Admin - ${orgName}`;
            cssClass = 'badge-primary text-white border-none';
            break;
          case 'membro':
            label = `Membro - ${orgName}`;
            cssClass = 'badge-ghost bg-gray-700 text-gray-300 border-gray-600';
            break;
          default:
            label = `${value} (${orgName})`;
            cssClass = 'badge-outline';
        }
        badges.push({ label, class: cssClass });
      }
    }
    return badges.sort((a, b) => a.class.includes('warning') ? -1 : 1);
  }
}
