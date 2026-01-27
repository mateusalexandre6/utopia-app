// src/app/core/services/course.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { CourseLocationType, LearningObjective } from '../models/course.model';

// Interface para os dados do formulário
export interface CourseFormData {
    title: string,
    description: string,
    commissionId: string,
    isPublic: boolean,
    slug: string,
    learningObjectives: LearningObjective[];
    locationType: CourseLocationType, // Valor padrão
    address: string | null,
    virtualLink: string | null,
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  /**
   * Cria um novo documento de curso no Firestore.
   */
  async createCourse(formData: CourseFormData) {
    const user = this.authService.currentUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const coursesCollection = collection(this.firestore, 'courses');
    const newCourse = {
      ...formData,
      createdAt: Timestamp.now(),
    };
    return addDoc(coursesCollection, newCourse);
  }

  /**
   * Atualiza os dados de um curso existente.
   */
  async updateCourse(courseId: string, formData: CourseFormData) {
    const courseDocRef = doc(this.firestore, 'courses', courseId);
    // Não atualizamos o 'createdAt'
    return updateDoc(courseDocRef, { ...formData });
  }
}
