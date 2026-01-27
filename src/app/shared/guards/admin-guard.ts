// src/app/core/guards/admin.guard.ts

import { inject, Injector, runInInjectionContext } from '@angular/core'; // <-- Import Injector
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap, take, filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop'; // <-- Import runInInjectionContext
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const firestoreService = inject(FirestoreService);
  const router = inject(Router);
  const injector = inject(Injector); // <-- 1. Capture the current injector

  return toObservable(authService.currentUser).pipe(
    filter(user => user !== undefined),
    take(1),
    switchMap(authUser => {
      if (!authUser) {
        router.navigate(['/login']);
        return of(false);
      }

      // 2. Use runInInjectionContext to provide the context for the inner observable
      return runInInjectionContext(injector, () => {
        return toObservable(firestoreService.users).pipe(
          filter(userProfiles => userProfiles.length > 0),
          take(1),
          map(userProfiles => {
            const profile = userProfiles.find(p => p.uid === authUser.uid);

            if (!profile || !profile?.roles) {
              router.navigate(['/']);
              return false;
            }

            const userRoles = Object.values(profile.roles);
            const isAdmin = userRoles.some(role =>
              role === 'admin_nacional' || role === 'admin_estadual'
            );

            if (isAdmin) {
              return true;
            } else {
              router.navigate(['/']);
              return false;
            }
          })
        );
      });
    })
  );
};
