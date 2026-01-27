// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard } from './shared/guards/admin-guard';
import { authGuard } from './shared/guards/auth-guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
// ... outros imports

export const routes: Routes = [
 {
    path: 'curso/:slug',
    loadComponent: () => import('./features/courses/public-course-page/public-course-page').then(m => m.PublicCoursePageComponent),
  },
  {
  path: 'cursos-geral',
  loadComponent: () => import('./features/courses/public-course-list/public-course-list')
    .then(m => m.PublicCourseList),
},
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '', // Dashboard
        loadComponent: () => import('./features/home/home').then(m => m.HomeComponent),
      },
      {
        path: 'admin', // Gerenciamento de Usuários/Orgs
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
        canActivate: [adminGuard]
      },
      {
        path: 'eventos', // Gerenciamento de Eventos
        loadComponent: () => import('./features/activities/activity-management/activity-management').then(m => m.ActivityManagementComponent),
        canActivate: [adminGuard] // Apenas admins podem gerenciar
      },
      {
        path: 'tarefas',
        loadComponent: () => import('./features/tasks/task-board/task-board').then(m => m.TaskBoardComponent),
      },
      {
        path: 'cursos',
        loadComponent: () => import('./features/courses/course-management/course-management').then(m => m.CourseManagementComponent),
      },
      {
        path: 'cursos',
        // O componente principal da lista de cursos
        loadComponent: () => import('./features/courses/course-management/course-management').then(m => m.CourseManagementComponent),
      },
      {
        path: 'cursos/novo', // Rota para criar
        loadComponent: () => import('./features/courses/course-detail/course-detail').then(m => m.CourseDetailComponent),
      },
      {
        path: 'cursos/:id', // Rota para editar/ver
        loadComponent: () => import('./features/courses/course-detail/course-detail').then(m => m.CourseDetailComponent),
      },
      {
        path: 'forum',
        loadComponent: () => import('./features/forum/forum-page/forum-page').then(m => m.ForumPageComponent),
      },
      {
        path: 'forum/:id', // Usa o ID do tópico como parâmetro
        loadComponent: () => import('./features/forum/topic-detail/topic-detail').then(m => m.TopicDetailComponent),
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
