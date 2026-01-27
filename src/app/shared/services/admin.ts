// src/app/core/services/admin.service.ts

import { Injectable, inject } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { UserProfile } from '../../shared/models/user.model';
import { Organization } from '../../shared/models/organization.model';
import { Commission } from '../models/commission.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  /**
   * Atualiza o mapa de papéis de um usuário específico.
   * Esta operação só será bem-sucedida se o usuário logado
   * for um admin, conforme definido nas regras do Firestore.
   * @param uid O ID do usuário a ser modificado.
   * @param newRoles O novo objeto de papéis para o usuário.
   */
  async updateUserRoles(uid: string, newRoles: UserProfile['roles']): Promise<void> {
    if (!uid) {
      throw new Error('User ID is required');
    }
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userDocRef, { roles: newRoles });
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
}
