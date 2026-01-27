import { Component, signal } from '@angular/core';
import { OrganizationListComponent } from '../organization-list/organization-list';
import { UserListComponent } from '../user-list/user-list';
import { CommissionListComponent } from '../commission-list/commission-list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
   imports: [UserListComponent, OrganizationListComponent, CommissionListComponent, CommonModule], // <-- ADICIONE AQUI


  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard {
  activeTab = signal<'organizations' | 'commissions' | 'users'>('organizations');

}
