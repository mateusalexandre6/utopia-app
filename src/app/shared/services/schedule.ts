// src/app/core/services/schedule.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, updateDoc, Timestamp } from '@angular/fire/firestore';

export interface ScheduleItemFormData {
  title: string;
  description?: string;
  startTime: string; // Vem do input datetime-local
  endTime: string;   // Vem do input datetime-local
  speakerIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private firestore: Firestore = inject(Firestore);

  // Note que todos os métodos recebem 'courseId' para saber em qual subcoleção operar

  createScheduleItem(courseId: string, formData: ScheduleItemFormData) {
    const itemsCollection = collection(this.firestore, `courses/${courseId}/scheduleItems`);
    const newItem = {
      ...formData,
      startTime: Timestamp.fromDate(new Date(formData.startTime)),
      endTime: Timestamp.fromDate(new Date(formData.endTime)),
    };
    return addDoc(itemsCollection, newItem);
  }

  updateScheduleItem(courseId: string, itemId: string, formData: ScheduleItemFormData) {
    const itemDocRef = doc(this.firestore, `courses/${courseId}/scheduleItems`, itemId);
    const updatedItem = {
      ...formData,
      startTime: Timestamp.fromDate(new Date(formData.startTime)),
      endTime: Timestamp.fromDate(new Date(formData.endTime)),
    };
    return updateDoc(itemDocRef, updatedItem);
  }

  deleteScheduleItem(courseId: string, itemId: string) {
    const itemDocRef = doc(this.firestore, `courses/${courseId}/scheduleItems`, itemId);
    return deleteDoc(itemDocRef);
  }
}
