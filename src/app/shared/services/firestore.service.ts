// src/app/core/services/firestore.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, collectionData, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
import { Activity } from '../models/activity.model';
import { UserProfile } from '../models/user.model'; // <-- IMPORTE O MODELO DE USUÁRIO
import { Organization } from '../models/organization.model'; // <-- IMPORTE O MODELO DE ORGANIZAÇÃO
import { Commission } from '../models/commission.model';
import { Task } from '../models/task.model';
import { Course } from '../models/course.model';
import { Observable } from 'rxjs';
import { ScheduleItem } from '../models/schedule-item.model';
import { Speaker } from '../models/speaker.model';
import { Registration } from '../models/registration.model';
import { ForumPost } from '../models/forum-post.model';
import { ForumTopic } from '../models/forum-topic.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore = inject(Firestore);

  // Signals para manter os dados das coleções em tempo real.
  activities = signal<Activity[]>([]);
  users = signal<UserProfile[]>([]); // <-- NOVO SIGNAL PARA USUÁRIOS
  organizations = signal<Organization[]>([]); // <-- NOVO SIGNAL PARA ORGANIZAÇÕES
 commissions = signal<Commission[]>([]); // <-- NOVO SIGNAL PARA COMISSÕES
 tasks = signal<Task[]>([]); // <-- NOVO SIGNAL PARA TAREFAS
 courses = signal<Course[]>([]);
 speakers = signal<Speaker[]>([]);
 forumTopics = signal<ForumTopic[]>([]); // <-- NOVO SIGNAL PARA TÓPICOS
  forumPosts = signal<ForumPost[]>([]);

  constructor() {
    this.listenToActivities();
    this.listenToUsers(); // <-- CHAMA A NOVA FUNÇÃO
    this.listenToOrganizations(); // <-- CHAMA A NOVA FUNÇÃO
     this.listenToCommissions(); // <-- CHAMA A NOVA FUNÇÃO
     this.listenToTasks();
     this.listenToCourses();
     this.listenToSpeakers();
     this.listenToForumTopics(); // <-- CHAMA A NOVA FUNÇÃO
    this.listenToForumPosts();

  }

  private listenToActivities() {
    const activitiesCollection = collection(this.firestore, 'activities');
    onSnapshot(query(activitiesCollection), (snapshot) => {
      this.activities.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
    });
  }

  // NOVA FUNÇÃO PARA OUVIR A COLEÇÃO DE USUÁRIOS
  private listenToUsers() {
    const usersCollection = collection(this.firestore, 'users');
    onSnapshot(query(usersCollection), (snapshot) => {
      // O uid já está no documento do Firebase Auth, mas é bom tê-lo aqui também.
      this.users.set(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });
  }

  // NOVA FUNÇÃO PARA OUVIR A COLEÇÃO DE ORGANIZAÇÕES
  private listenToOrganizations() {
    const orgsCollection = collection(this.firestore, 'organizations');
    onSnapshot(query(orgsCollection), (snapshot) => {
      this.organizations.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization)));
    });
  }

   private listenToCommissions() {
    const commissionsCollection = collection(this.firestore, 'commissions');
    onSnapshot(query(commissionsCollection), (snapshot) => {
      this.commissions.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    });
  }
  private listenToTasks() {
    const tasksCollection = collection(this.firestore, 'tasks');
    onSnapshot(query(tasksCollection), (snapshot) => {
      this.tasks.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
  }
  private listenToCourses() {
    const coursesCollection = collection(this.firestore, 'courses');
    onSnapshot(query(coursesCollection), (snapshot) => {
      this.courses.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
  }
  private listenToSpeakers() {
    const speakerCollection = collection(this.firestore, 'speakers');
    onSnapshot(query(speakerCollection), (snapshot) => {
      this.speakers.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Speaker)));
    });
  }
  private listenToForumTopics() {
    const topicsCollection = collection(this.firestore, 'forumTopics');
    // Ordena os tópicos pelos mais recentes primeiro
    const q = query(topicsCollection, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.forumTopics.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic)));
    });
  }
  private listenToForumPosts() {
    const postsCollection = collection(this.firestore, 'forumPosts');
    // Ordena os posts pelos mais recentes primeiro (útil para feeds)
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.forumPosts.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost)));
    });
  }

  getScheduleItems(courseId: string): Observable<ScheduleItem[]> {
    const itemsCollection = collection(this.firestore, `courses/${courseId}/scheduleItems`);
    return collectionData(query(itemsCollection), { idField: 'id' }) as Observable<ScheduleItem[]>;
  }
  getRegistrationsForCourse(courseId: string): Observable<Registration[]> {
    const registrationsCollection = collection(this.firestore, 'registrations');
    // Cria uma consulta que busca documentos onde o campo 'courseId' é igual ao ID fornecido
    const q = query(registrationsCollection, where("courseId", "==", courseId));
    return collectionData(q, { idField: 'id' }) as Observable<Registration[]>;
  }
}
