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
  styleUrl: './admin-dashboard.css' // Se existir esse arquivo
})
export class AdminDashboard {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  // Começa com uma tab segura, depois o effect ajusta se necessário
  activeTab = signal<'organizations' | 'commissions' | 'users'>('commissions');

  // --- Lógica de Permissões ---
  private currentUserProfile = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return this.firestoreService.users().find(u => u.uid === uid);
  });

  isNationalAdmin = computed(() => {
    const roles = this.currentUserProfile()?.roles;
    return roles ? Object.values(roles).includes('admin_nacional') : false;
  });

  constructor() {
    // Efeito de Redirecionamento de Segurança
    effect(() => {
      // Se for Admin Nacional, pode ver a aba de Organizações (padrão)
      if (this.isNationalAdmin()) {
        // Só define como padrão se o usuário ainda não tiver navegado
        if (this.activeTab() === 'commissions') {
           this.activeTab.set('organizations');
        }
      } else {
        // Se NÃO for Admin Nacional e estiver tentando ver Organizações, joga para Comissões
        if (this.activeTab() === 'organizations') {
          this.activeTab.set('commissions');
        }
      }
    }, { allowSignalWrites: true });
  }
}
