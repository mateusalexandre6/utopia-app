// src/app/auth/login/login.component.ts

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importe o FormsModule
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  // Para que o [(ngModel)] funcione em um componente standalone, precisamos importar o FormsModule aqui.
  imports: [FormsModule, LoadingSpinner],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
 private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage: string | null = null;
  isLoading = false; // <-- Estado para a microinteração de carregamento

  async handleLogin() {
    this.errorMessage = null;
    this.isLoading = true; // <-- Ativa o spinner

    try {
      await this.authService.login({ email: this.email, password: this.password });
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Erro no login:', error);
      this.errorMessage = 'Email ou senha inválidos. Tente novamente.';
    } finally {
      this.isLoading = false; // <-- Desativa o spinner ao final
    }
  }
}
