import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../shared/models/user.model';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { AdminService } from '../../../shared/services/admin';

@Component({
  selector: 'app-role-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-manager.html',
})
export class RoleManagerComponent implements OnInit, OnChanges {
  @Input({ required: true }) user!: UserProfile;

  // Inputs simples (vamos processar no ngOnChanges)
  @Input() currentUserIsNationalAdmin = false;
  @Input() currentUserOrgIds: string[] = [];

  @Output() close = new EventEmitter<void>();

  private firestoreService = inject(FirestoreService);
  private adminService = inject(AdminService);

  // Sinais públicos para o template
  allOrganizations = this.firestoreService.organizations;
  isLoading = signal(false);
  currentRoles = signal<{ [key: string]: string }>({});

  // Sinais internos para controle de filtro
  private _isNational = signal(false);
  private _myOrgIds = signal<string[]>([]);

  readonly availableRoles = [
    { value: 'admin_estadual', label: 'Administrador do Núcleo' },
    { value: 'membro', label: 'Membro' }
  ];

  // FILTRO ROBUSTO
  visibleOrganizations = computed(() => {
    const orgs = this.allOrganizations();
    const isNational = this._isNational();
    const myOrgIds = this._myOrgIds();

    console.log('--- Debug Filtro RoleManager ---');
    console.log('Total Orgs:', orgs.length);
    console.log('Sou Nacional?', isNational);
    console.log('Meus IDs de Núcleo:', myOrgIds);

    if (isNational) {
      return orgs;
    }

    // Filtra comparando IDs
    const filtered = orgs.filter(org => myOrgIds.includes(org.id));
    console.log('Orgs visíveis após filtro:', filtered.map(o => o.id));

    return filtered;
  });

  // Getter para facilitar o HTML
  get isNationalAdminInput(): boolean {
    return this._isNational();
  }

  // Debug Data (para mostrar na tela se der erro)
  debugData = computed(() => ({
    myIds: this._myOrgIds(),
    totalOrgs: this.allOrganizations().length,
    allOrgIds: this.allOrganizations().map(o => o.id)
  }));

  // Atualiza os sinais quando os Inputs mudam
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUserIsNationalAdmin']) {
      this._isNational.set(this.currentUserIsNationalAdmin);
    }
    if (changes['currentUserOrgIds']) {
      // Garante que é sempre um array e remove duplicatas/vazios
      const ids = this.currentUserOrgIds || [];
      this._myOrgIds.set(ids);
    }
  }

  ngOnInit() {
    if (this.user.roles) {
      this.currentRoles.set({ ...this.user.roles });
    }
  }

  isNationalAdminTarget(): boolean {
    const roles = this.currentRoles();
    return Object.values(roles).includes('admin_nacional');
  }

  toggleNationalAdmin(checked: boolean) {
    if (!this._isNational()) return;

    this.currentRoles.update(roles => {
      const newRoles = { ...roles };
      if (checked) {
        newRoles['global'] = 'admin_nacional';
      } else {
        Object.keys(newRoles).forEach(key => {
          if (newRoles[key] === 'admin_nacional') delete newRoles[key];
        });
      }
      return newRoles;
    });
  }

  hasRoleInOrg(orgId: string, roleValue: string): boolean {
    return this.currentRoles()[orgId] === roleValue;
  }

  toggleRole(orgId: string, roleValue: string, checked: boolean) {
    this.currentRoles.update(roles => {
      const newRoles = { ...roles };
      if (checked) {
        newRoles[orgId] = roleValue;
      } else {
        if (newRoles[orgId] === roleValue) {
          delete newRoles[orgId];
        }
      }
      return newRoles;
    });
  }

  async onSave() {
    this.isLoading.set(true);
    try {
      await this.adminService.updateUserRoles(this.user.uid, this.currentRoles());
      this.close.emit();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar permissões.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
