// src/app/core/services/auth.service.ts

import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  initializeAuth, // Importe initializeAuth
  indexedDBLocalPersistence // Importe a persistência
} from '@angular/fire/auth';
import { Credentials } from '../models/credentials.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);

  // Signal para o usuário: undefined (carregando), User (logado), null (não logado)
  currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    // onAuthStateChanged já faz o trabalho de ouvir, vamos apenas garantir que ele popule o signal
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });
  }

  login(credentials: Credentials) {
    return signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
  }

  register(credentials: Credentials) {
    return createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password);
  }

  logout() {
    return signOut(this.auth);
  }
}
