// src/app/core/services/task.service.ts

import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { TaskStatus } from '../models/task.model';

// Interface para os dados do formulário, agora com o responsável opcional
interface TaskFormData {
  title: string;
  description?: string;
  commissionId: string;
  assignedTo?: string | null; // <-- NOVO CAMPO
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  /**
   * Cria uma nova tarefa no Firestore.
   */
  async createTask(formData: TaskFormData) {
    const user = this.authService.currentUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const tasksCollection = collection(this.firestore, 'tasks');
    const newTask = {
      title: formData.title,
      description: formData.description || '',
      commissionId: formData.commissionId,
      status: 'todo' as TaskStatus,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      assignedTo: formData.assignedTo || null,
    };
    return addDoc(tasksCollection, newTask);
  }

  /**
   * **NOVO MÉTODO**
   * Atualiza todos os detalhes de uma tarefa (usado pelo formulário de edição).
   */
  async updateTaskDetails(taskId: string, formData: TaskFormData) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);
    const updatedData = {
      title: formData.title,
      description: formData.description || '',
      commissionId: formData.commissionId,
      assignedTo: formData.assignedTo || null,
    };
    return updateDoc(taskDocRef, updatedData);
  }

  /**
   * Atualiza APENAS o status de uma tarefa (usado pelo Kanban).
   */
  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);
    return updateDoc(taskDocRef, { status: newStatus });
  }

  /**
   * Exclui uma tarefa.
   */
  async deleteTask(taskId: string) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);
    return deleteDoc(taskDocRef);
  }
}
