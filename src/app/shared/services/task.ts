// src/app/shared/services/task.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { TaskStatus, TaskPriority } from '../models/task.model';

// Interface atualizada com TUDO que o formulário envia
interface TaskFormData {
  title: string;
  description?: string;
  commissionId: string;
  organizationId: string; // <-- Obrigatório para o filtro de segurança
  assignedTo?: string | null;
  priority: TaskPriority; // <-- Novo
  dueDate: string;        // <-- Vem como string do input date
  status?: TaskStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  async createTask(formData: TaskFormData) {
    const user = this.authService.currentUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const tasksCollection = collection(this.firestore, 'tasks');

    // Tratamento de data: converte string para Timestamp do Firestore
    const dueDateTimestamp = formData.dueDate
      ? Timestamp.fromDate(new Date(formData.dueDate))
      : Timestamp.now(); // Fallback se vier vazio

    const newTask = {
      title: formData.title,
      description: formData.description || '',
      commissionId: formData.commissionId,
      organizationId: formData.organizationId, // <-- SALVANDO O ID DO NÚCLEO
      status: 'todo' as TaskStatus,
      priority: formData.priority || 'medium',
      dueDate: dueDateTimestamp,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      assignedTo: formData.assignedTo || null,
    };
    return addDoc(tasksCollection, newTask);
  }

  // Renomeado de 'updateTaskDetails' para 'updateTask' para facilitar
  async updateTask(taskId: string, formData: TaskFormData) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);

    const dueDateTimestamp = formData.dueDate
      ? Timestamp.fromDate(new Date(formData.dueDate))
      : Timestamp.now();

    const updatedData = {
      title: formData.title,
      description: formData.description || '',
      commissionId: formData.commissionId,
      organizationId: formData.organizationId, // Mantém atualizado
      assignedTo: formData.assignedTo || null,
      priority: formData.priority,
      dueDate: dueDateTimestamp,
      // Status não atualiza aqui, só no Kanban
    };
    return updateDoc(taskDocRef, updatedData);
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);
    return updateDoc(taskDocRef, { status: newStatus });
  }

  async deleteTask(taskId: string) {
    const taskDocRef = doc(this.firestore, 'tasks', taskId);
    return deleteDoc(taskDocRef);
  }
}
