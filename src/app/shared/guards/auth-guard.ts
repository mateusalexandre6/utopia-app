// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.currentUser).pipe(
    // O filter vai pausar a execução enquanto o valor for 'undefined'
    filter(user => user !== undefined),
    take(1),
    map(user => {
      console.log(user, " user")
      if (user) {
        return true; // Logado
      } else {
        router.navigate(['/login']); // Não logado
        return false;
      }
    })
  );
};
