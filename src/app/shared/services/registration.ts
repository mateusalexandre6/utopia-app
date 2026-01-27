// src/app/core/services/registration.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, Timestamp } from '@angular/fire/firestore';

export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private firestore: Firestore = inject(Firestore);

  registerForCourse(courseId: string, formData: RegistrationFormData) {
    if (!courseId) throw new Error("ID do curso é necessário.");

    const registrationsCollection = collection(this.firestore, 'registrations');
    const newRegistration = {
      courseId: courseId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      registeredAt: Timestamp.now(),
    };
    return addDoc(registrationsCollection, newRegistration);
  }
}
