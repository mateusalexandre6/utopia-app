// src/app/core/services/activity.service.ts

import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, Timestamp, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../shared/services/auth.service';

// Interface para os dados que vêm do formulário
interface ActivityFormData {
  title: string;
  description: string;
  date: string;
  commissionId: string; // <-- ALTERADO DE organizationId
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);



  // --- createActivity ---
  async createActivity(formData: ActivityFormData) {
    const user = this.authService.currentUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const activitiesCollection = collection(this.firestore, 'activities');
    const newActivity = {
      title: formData.title,
      description: formData.description,
      date: Timestamp.fromDate(new Date(formData.date)),
      commissionId: formData.commissionId, // <-- ALTERADO DE organizationId
      createdBy: user.uid,
    };
    return addDoc(activitiesCollection, newActivity);
  }

  // --- updateActivity ---
  async updateActivity(activityId: string, formData: ActivityFormData) {
    if (!activityId) throw new Error("ID da evento é necessário.");

    const activityDocRef = doc(this.firestore, 'activities', activityId);
    const updatedData = {
      title: formData.title,
      description: formData.description,
      date: Timestamp.fromDate(new Date(formData.date)),
      commissionId: formData.commissionId, // <-- ALTERADO DE organizationId
    };
    return updateDoc(activityDocRef, updatedData);
  }

  // --- deleteActivity (sem alterações na lógica interna) ---
  async deleteActivity(activityId: string) {
    if (!activityId) throw new Error("ID da evento é necessário.");
    const activityDocRef = doc(this.firestore, 'activities', activityId);
    return deleteDoc(activityDocRef);
  }
}
