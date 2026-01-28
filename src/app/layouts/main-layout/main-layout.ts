
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, SafeHtmlPipe],
  templateUrl: './main-layout.html',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);

  currentUser = this.authService.currentUser;

  navItems = [
    {
      label: 'Dashboard',
      route: '/',
      exact: true,
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z"/>
        </svg>
      `
    },
    { route: '/tarefas', label: 'Atividades', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm2.5 4.5a.75.75 0 000 1.5h7a.75.75 0 000-1.5h-7zm0 3.5a.75.75 0 000 1.5h7a.75.75 0 000-1.5h-7zm0 3.5a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z" clip-rule="evenodd" /></svg>' }, // <-- NOVO ITEM
    {
      route: '/eventos',
      label: 'Eventos',
      exact: false,
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      `
    },
    { route: '/cursos', label: 'Cursos', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M7.875 3.682a.75.75 0 000 1.06l5.25 5.25a.75.75 0 001.06-1.06l-5.25-5.25a.75.75 0 00-1.06 0z" /><path d="M6.328 4.23a.75.75 0 00-1.056 1.06l5.25 5.25a.75.75 0 001.06-1.06l-5.25-5.25zM2 9a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9z" /><path d="M3.5 12.5a.75.75 0 000 1.5h4.81l-1.28 1.28a.75.75 0 001.06 1.06l2.5-2.5a.75.75 0 000-1.06l-2.5-2.5a.75.75 0 10-1.06 1.06l1.28 1.28H3.5z" /><path d="M10 17c-4.418 0-8-2.015-8-4.5V12h16v.5c0 2.485-3.582 4.5-8 4.5z" /></svg>' }, // <-- NOVO ITEM,
    { route: '/forum', label: 'Fórum', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.138 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.75.75 0 01.53-.218c.265-.008.53-.017.795-.024l.004-.001a9.953 9.953 0 005.993-1.631c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A16.7 16.7 0 0010 2zm-5.003 10.75a.75.75 0 010-1.5h10.006a.75.75 0 010 1.5H4.997z" clip-rule="evenodd" /></svg>' },
    {
      label: 'Configurações',
      route: '/admin',
      exact: false,
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-2 0-3.5 1.5-3.5 3.5S10 15 12 15s3.5-1.5 3.5-3.5S14 8 12 8z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 01.33 1.82l-1.8 3.11a1.65 1.65 0 01-2.1.6l-2-1a6.75 6.75 0 01-1.6.9l-.3 2.2a1.65 1.65 0 01-1.64 1.4H9a1.65 1.65 0 01-1.64-1.4l-.3-2.2a6.75 6.75 0 01-1.6-.9l-2 1a1.65 1.65 0 01-2.1-.6L1.27 16.82a1.65 1.65 0 01.33-1.82l1.7-1.5a6.75 6.75 0 010-2.16l-1.7-1.5a1.65 1.65 0 01-.33-1.82l1.8-3.11a1.65 1.65 0 012.1-.6l2 1a6.75 6.75 0 011.6-.9l.3-2.2A1.65 1.65 0 019 1.65h3.0a1.65 1.65 0 011.64 1.4l.3 2.2a6.75 6.75 0 011.6.9l2-1a1.65 1.65 0 012.1.6l1.8 3.11a1.65 1.65 0 01-.33 1.82l-1.7 1.5a6.75 6.75 0 010 2.16l1.7 1.5z"/>
        </svg>
      `
    }
  ];


  async handleLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
