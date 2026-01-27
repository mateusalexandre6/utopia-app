// src/app/features/courses/public-course-page/public-course-page.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, of, map } from 'rxjs';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { RegistrationService } from '../../../shared/services/registration';



@Component({
  selector: 'app-public-course-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './public-course-page.html',
  styleUrl: './public-course-page.css'
})
export class PublicCoursePageComponent {
 // --- Injeção de Serviços e Sinais Brutos ---
  private route = inject(ActivatedRoute);
  private firestoreService = inject(FirestoreService);
  private registrationService = inject(RegistrationService);

  private slug = toSignal(this.route.paramMap.pipe(map(params => params.get('slug'))));
  private allCourses = this.firestoreService.courses;
  allSpeakers = this.firestoreService.speakers;

  // --- Estado da UI ---
  isLoading = signal(true);
  registrationModel = { name: '', email: '', phone: '' };
  isRegistering = signal(false);
  registrationSuccess = signal(false);
  registrationError = signal<string|null>(null);

  // --- Computed Signals para buscar os dados ---

  // 1. Encontra o curso principal. Este sinal é a nossa "fonte da verdade".
  course = computed(() => {
    const slug = this.slug();
    if (!slug) return null;
    return this.allCourses().find(c => c.slug === slug && c.isPublic);
  });

  // **2. CORREÇÃO PRINCIPAL: O cronograma agora reage à descoberta do curso.**
  scheduleItems = toSignal(
    // Converte o sinal 'course' em um fluxo de dados
    toObservable(this.course).pipe(
      switchMap(foundCourse => {
        // SÓ busca os itens se o curso foi encontrado
        if (foundCourse) {
          return this.firestoreService.getScheduleItems(foundCourse.id);
        }
        // CASO CONTRÁRIO, retorna um array vazio.
        return of([]);
      })
    ), { initialValue: [] }
  );
  groupedSchedule = computed(() => {
    const schedule = this.scheduleItems();
    if (schedule.length === 0) return [];

    // Agrupa os itens por data
    const groups = new Map<string, any[]>();
    schedule.forEach(item => {
      const dateKey = item.startTime.toDate().toDateString(); // "Thu Oct 16 2025"
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    });

    // Converte o mapa em um array ordenado
    return Array.from(groups.entries())
      .map(([date, items]) => ({
        date: new Date(date),
        items: items.sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime()),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  // 3. Os palestrantes agora reagem corretamente ao cronograma.
  courseSpeakers = computed(() => {
    if (this.scheduleItems().length === 0) return [];
    const speakerIds = new Set(this.scheduleItems().flatMap(item => item.speakerIds));
    return this.allSpeakers().filter(speaker => speakerIds.has(speaker.id));
  });

  constructor() {
    effect(() => {
      // Para de carregar quando a busca inicial por cursos termina,
      // mesmo que o curso específico não seja encontrado.
      if (this.slug() && this.allCourses().length > 0 && this.isLoading()) {
          this.isLoading.set(false);
      }
    });
  }

  getGoogleMapsLink(address: string | null | undefined): string {
    if (!address) {
      // Retorna um link seguro caso o endereço não exista
      return '#';
    }
    // Codifica o endereço para ser usado em uma URL
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  // --- Métodos de Ação ---
  async handleRegistration() {
    this.isRegistering.set(true);
    this.registrationError.set(null);
    this.registrationSuccess.set(false);
    try {
      const courseId = this.course()?.id;
      if (!courseId) throw new Error("Curso não encontrado.");
      await this.registrationService.registerForCourse(courseId, this.registrationModel);
      this.registrationSuccess.set(true);
    } catch (error) {
      this.registrationError.set("Ocorreu um erro ao processar sua inscrição. Tente novamente.");
    } finally {
      this.isRegistering.set(false);
    }
  }
  getSpeakerNameById(speakerId: string): string {
    const speaker = this.allSpeakers().find(s => s.id === speakerId);
    return speaker ? speaker.name : 'Palestrante';
  }

  scrollTo(fragment: string): void {
    const element = document.querySelector(`#${fragment}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  share(platform: 'whatsapp' | 'twitter' | 'linkedin') {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Confira este curso incrível: ${this.course()?.title}`);
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    }
    window.open(shareUrl, '_blank');
  }
}
