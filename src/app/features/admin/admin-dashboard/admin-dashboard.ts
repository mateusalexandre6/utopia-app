import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationListComponent } from '../organization-list/organization-list';
import { UserListComponent } from '../user-list/user-list';
import { CommissionListComponent } from '../commission-list/commission-list';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UserListComponent,
    OrganizationListComponent,
    CommissionListComponent
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css' // Se existir
})
export class AdminDashboard {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  // Aba padrão inicial
  activeTab = signal<'organizations' | 'commissions' | 'users'>('commissions');

  // --- Lógica de Permissões ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    // Garante que a lista de usuários foi carregada antes de buscar
    const users = this.firestoreService.users();
    return users.find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const profile = this.currentUserProfile();
    // Verificação defensiva (profile pode ser undefined no carregamento)
    if (!profile || !profile.roles) return false;
    return Object.values(profile.roles).includes('admin_nacional');
  });

  constructor() {
    // Efeito de Segurança
    effect(() => {
      const isAdmin = this.isNationalAdmin();
      const currentTab = this.activeTab();

      // REGRA DE BLOQUEIO:
      // Apenas impede quem NÃO é admin de entrar na aba 'organizations'.
      // Se for Admin Nacional, ele é livre para navegar onde quiser.
      if (!isAdmin && currentTab === 'organizations') {
        this.activeTab.set('commissions');
      }

    }, { allowSignalWrites: true });
  }
}
