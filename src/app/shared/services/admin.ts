// src/app/core/services/admin.service.ts

import { Injectable, inject } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, setDoc, updateDoc } from '@angular/fire/firestore';
import { UserProfile } from '../../shared/models/user.model';
import { Organization } from '../../shared/models/organization.model';
import { Commission } from '../models/commission.model';
import { getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

async updateUserRoles(userId: string, roles: { [key: string]: string }) {
    const userDocRef = doc(this.firestore, 'users', userId);
    return updateDoc(userDocRef, {
      roles: roles,
      updatedAt: serverTimestamp()
    });
  }

   addOrganization(orgData: Omit<Organization, 'id'>) {
    const orgsCollection = collection(this.firestore, 'organizations');
    return addDoc(orgsCollection, orgData);
  }
   updateOrganization(id: string, orgData: Partial<Organization>) {
    const orgDocRef = doc(this.firestore, `organizations/${id}`);
    return updateDoc(orgDocRef, orgData);
  }
  deleteOrganization(id: string) {
    const orgDocRef = doc(this.firestore, `organizations/${id}`);
    return deleteDoc(orgDocRef);
  }

  addCommission(commissionData: Omit<Commission, 'id'>) {
    const commissionsCollection = collection(this.firestore, 'commissions');
    return addDoc(commissionsCollection, commissionData);
  }

  updateCommission(id: string, commissionData: Partial<Commission>) {
    const commissionDocRef = doc(this.firestore, `commissions/${id}`);
    return updateDoc(commissionDocRef, commissionData);
  }

  deleteCommission(id: string) {
    const commissionDocRef = doc(this.firestore, `commissions/${id}`);
    return deleteDoc(commissionDocRef);
  }

async createUser(email: string, password: string, displayName: string, initialOrgId?: string) {
    const app = getApp();
    const secondaryApp = initializeApp(app.options, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userDocRef = doc(this.firestore, 'users', user.uid);

      // Prepara os dados iniciais
      const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        roles: {}, // Inicializa vazio
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // LÓGICA DE VÍNCULO AUTOMÁTICO
      if (initialOrgId) {
        // Define o papel padrão como 'membro' para o núcleo selecionado/automático
        userData.roles[initialOrgId] = 'membro';
      }

      await setDoc(userDocRef, userData);

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      return user;

    } catch (error) {
      await deleteApp(secondaryApp);
      throw error;
    }
  }
}
