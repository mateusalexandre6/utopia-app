// src/app/features/courses/course-management/course-management.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { FirestoreService } from '../../../shared/services/firestore.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-management.html',
})
export class CourseManagementComponent {
  // --- Injeção de Serviços ---
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // --- Sinais Brutos ---
  private allCourses = this.firestoreService.courses;
  private allCommissions = this.firestoreService.commissions;

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

  // **LÓGICA CHAVE**: Identifica as comissões de formação do usuário
  private userFormationCommissions = computed(() => {
    if (this.isNationalAdmin()) {
      // Admin pode ver cursos de todas as comissões de formação
      return this.allCommissions().filter(c => c.isFormationCommission);
    }
    // Usuário comum só vê as comissões de formação dos seus núcleos
    const myOrgIds = this.userOrganizationIds();
    return this.allCommissions().filter(c => c.isFormationCommission && myOrgIds.includes(c.organizationId));
  });

  // --- Computed Signals para a UI ---
  isLoading = computed(() => this.allCourses().length === 0 && this.allCommissions().length === 0);

  // Filtra os cursos que o usuário tem permissão para ver e gerenciar
  visibleCourses = computed(() => {
    const myCommissionIds = this.userFormationCommissions().map(c => c.id);
    const commMap = new Map(this.allCommissions().map(c => [c.id, c.name]));

    return this.allCourses()
      .filter(course => myCommissionIds.includes(course.commissionId))
      .map(course => ({
        ...course,
        commissionName: commMap.get(course.commissionId) || 'Comissão Desconhecida',
      }));
  });

  // --- Métodos de Ação ---
  navigateToCourse(courseId: string) {
    // No futuro, isso levará para a página de edição do curso
    this.router.navigate(['/cursos', courseId]);
    console.log('Navegar para o gerenciamento do curso:', courseId);
  }

  navigateToNewCourse() {
    // Leva para uma página de criação
    this.router.navigate(['/cursos', 'novo']);
    console.log('Navegar para a criação de um novo curso');
  }
}
