import { Component, computed, effect, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-course-list',
   imports: [CommonModule, RouterLink],

  templateUrl: './public-course-list.html',
  styleUrl: './public-course-list.css'
})
export class PublicCourseList {
 private firestore = inject(FirestoreService);

  allCourses = this.firestore.courses; // sinal com todos os cursos (array)

  // Sinal que conterá cursos enriquecidos com earliestStart: Date | null
  private coursesWithEarliest = signal<Array<any>>([]);

  // Links da organização (exemplo)
  organizationLinks = [
    { name: 'Site Oficial', url: 'https://movaut.com.br' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/movaut' },
    { name: 'Instagram', url: 'https://instagram.com/movaut' },
    { name: 'Blog', url: 'https://blog.movaut.com.br' },
  ];

  // Computeds públicos que a view usará
  upcomingCourses = computed(() =>
    this.coursesWithEarliest()
      .filter(c => c.isPublic && c.earliestStart && c.earliestStart.getTime() >= Date.now())
      .sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime())
  );

  pastCourses = computed(() =>
    this.coursesWithEarliest()
      .filter(c => c.isPublic && (!c.earliestStart || c.earliestStart.getTime() < Date.now()))
      .sort((a, b) => {
        // Cursos passados: do mais recente para o mais antigo
        const ta = a.earliestStart ? a.earliestStart.getTime() : 0;
        const tb = b.earliestStart ? b.earliestStart.getTime() : 0;
        return tb - ta;
      })
  );

  constructor() {
    // Sempre que allCourses mudar, (re)carrega os earliestStart para cada curso.
    effect(() => {
      const courses = this.allCourses();
      // Se ainda não houver cursos, zera
      if (!courses || courses.length === 0) {
        this.coursesWithEarliest.set([]);
        return;
      }

      // Async IIFE para calcular earliestStart para cada curso
      (async () => {
        try {
          // Para cada curso, buscamos os schedule items e calculamos a menor startTime
          const enriched = await Promise.all(courses.map(async (c: any) => {
            try {
              // getScheduleItems retorna Observable — convertemos para Promise com firstValueFrom
              const items: any[] = await firstValueFrom(this.firestore.getScheduleItems(c.id));
              if (!items || items.length === 0) {
                return { ...c, earliestStart: null };
              }

              // Converte startTime (assumindo FieldValue Timestamp) para Date e pega a menor
              const earliestDate = items
                .map(i => i.startTime.toDate())
                .reduce((min: Date, cur: Date) => (cur.getTime() < min.getTime() ? cur : min), items[0].startTime.toDate());

              return { ...c, earliestStart: earliestDate };
            } catch (err) {
              // Em caso de erro na busca do cronograma, marca como sem data
              console.error('Erro ao buscar scheduleItems para curso', c.id, err);
              return { ...c, earliestStart: null };
            }
          }));

          this.coursesWithEarliest.set(enriched);
        } catch (err) {
          console.error('Erro ao enriquecer cursos com earliestStart', err);
          this.coursesWithEarliest.set(courses.map(c => ({ ...c, earliestStart: null })));
        }
      })();
    });
  }
}
