import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Utopia');
  authService = inject(AuthService);
  router = inject(Router);

  // Expõe o signal para o template
  currentUser = this.authService.currentUser;

  async handleLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']); // Redireciona para o login após o logout
  }
}
