// src/app/features/courses/course-detail/course-detail.component.ts
import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService, CourseFormData } from '../../../shared/services/course';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ScheduleItem } from '../../../shared/models/schedule-item.model';
import { ScheduleFormComponent } from '../schedule-form/schedule-form';
import { Speaker } from '../../../shared/models/speaker.model';
import { SpeakerFormComponent } from '../speaker-form/speaker-form';
import { switchMap, of, map } from 'rxjs';
import { CourseLocationType, ObjectiveIcon } from '../../../shared/models/course.model';
import { QRCodeComponent } from 'angularx-qrcode';
import { SafeUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ScheduleFormComponent, SpeakerFormComponent, QRCodeComponent],
  templateUrl: './course-detail.html',
})
export class CourseDetailComponent {

 qrCodeDownloadLink: SafeUrl | null = null;
  // --- Injeção de Serviços ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestoreService = inject(FirestoreService);
  private courseService = inject(CourseService);


  availableIcons: { name: ObjectiveIcon, label: string }[] = [
    { name: 'light-bulb', label: 'Lâmpada (Ideias)' },
    { name: 'academic-cap', label: 'Capelo (Acadêmico)' },
    { name: 'users', label: 'Pessoas (Conexão)' },
    { name: 'sparkles', label: 'Brilho (Habilidades)' },
    { name: 'chat-bubble', label: 'Balão (Debate)' },
    { name: 'chart-bar', label: 'Gráfico (Prática)' },
  ];

  // --- Sinais ---
  courseId = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  commissions = this.firestoreService.commissions;

  // Modelo do Formulário
  model = signal<CourseFormData>({
    title: '',
    description: '',
    commissionId: '',
    isPublic: false,
    slug: '',
    learningObjectives: [],
    locationType: 'tbd',
    address: null,
    virtualLink: null,
  });

  // UI state
activeTab = signal<'info' | 'content' | 'location' | 'registrations' | 'actions'>('info'); // Adicionada a nova aba // <-- ADICIONE 'registrations'

  // **NOVA LÓGICA PARA BUSCAR INSCRIÇÕES**
  registrations = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id && id !== 'novo') {
          return this.firestoreService.getRegistrationsForCourse(id);
        }
        return of([]);
      })
    ), { initialValue: [] }
  );
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  pageTitle = computed(() => {
    const id = this.courseId();
    return !!id && id !== 'novo' ? 'Editar Curso' : 'Criar Novo Curso';
  });

  // Schedule & speakers
  scheduleItems = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id && id !== 'novo') return this.firestoreService.getScheduleItems(id);
        return of([]);
      })
    ), { initialValue: [] }
  );

  isScheduleFormVisible = signal(false);
  editingScheduleItem = signal<ScheduleItem | null>(null);

  speakers = this.firestoreService.speakers;
  isSpeakerFormVisible = signal(false);
  editingSpeaker = signal<Speaker | null>(null);
  publicCourseUrl = computed(() => {
    const slug = this.model().slug;
    if (!slug) return null;
    // Constrói a URL completa usando a origem da janela atual
    return `${window.location.origin}/curso/${slug}`;
  });

  mailToLink = computed(() => {
    const emails = this.registrations().map(r => r.email);
    if (emails.length === 0) return '';
    // Usa BCC (Cópia Oculta) para proteger a privacidade dos inscritos
    return `mailto:?bcc=${emails.join(',')}&subject=Aviso sobre o curso: ${this.model().title}`;
  });


  // helpers for slug debounce
  private slugTimer: any = null;

  constructor() {
    // populate model in edit mode
    effect(() => {
      const id = this.courseId();
      if (id && id !== 'novo') {
        const course = this.firestoreService.courses().find(c => c.id === id);
        if (course) {
          this.model.set({
            title: course.title,
            description: course.description,
            commissionId: course.commissionId,
            isPublic: course.isPublic,
            slug: course.slug,
            learningObjectives: course.learningObjectives || [],
            locationType: course.locationType || 'tbd',
            address: course.address || null,
            virtualLink: course.virtualLink || null,
          });
        }
      }
    });
  }

  /* ===== Tabs ===== */
setActiveTab(tab: 'info' | 'content' | 'location' | 'registrations' | 'actions') {
    this.activeTab.set(tab);
  }

  /* ===== Form interactions & microvalidations ===== */
  onTitleChange(value: string) {
    this.model.update(m => ({ ...m, title: value }));
    // debounce slug generation
    if (this.slugTimer) clearTimeout(this.slugTimer);
    this.slugTimer = setTimeout(() => this.generateSlug(false), 600);
  }

  onSlugChange(value: string) {
    this.model.update(m => ({ ...m, slug: value }));
  }

  onDescriptionChange(value: string) {
    this.model.update(m => ({ ...m, description: value }));
  }

  updateAddress(value: string | null) {
    this.model.update(m => ({ ...m, address: value }));
  }

  updateVirtualLink(value: string | null) {
    this.model.update(m => ({ ...m, virtualLink: value }));
  }

  setLocationType(type: CourseLocationType): void {
    this.model.update(m => ({ ...m, locationType: type }));
    // microinteraction: switch to location tab
    this.activeTab.set('location');
  }

  // explicit slug generation (force = true when user clicks "Gerar")
  generateSlug(force = false) {
    const title = this.model().title || '';
    if (!title && !force) return;
    const computed = (title || this.model().slug || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (computed) {
      this.model.update(m => ({ ...m, slug: computed }));
    }
  }

  /* ===== CRUD UI actions ===== */
  onNewSpeaker() {
    this.editingSpeaker.set(null);
    this.isSpeakerFormVisible.set(true);
  }

  onEditSpeaker(speaker: Speaker) {
    this.editingSpeaker.set(speaker);
    this.isSpeakerFormVisible.set(true);
  }

  onCloseSpeakerForm() {
    this.isSpeakerFormVisible.set(false);
  }

  onNewScheduleItem() {
    this.editingScheduleItem.set(null);
    this.isScheduleFormVisible.set(true);
  }

  onEditScheduleItem(item: ScheduleItem) {
    this.editingScheduleItem.set(item);
    this.isScheduleFormVisible.set(true);
  }

  onCloseScheduleForm() {
    this.isScheduleFormVisible.set(false);
  }

  /* ===== Validation helpers ===== */
  private basicChecks(): string | null {
    const m = this.model();
    if (!m.title || m.title.trim().length < 5) return 'Título deve ter pelo menos 5 caracteres.';
    if (!m.slug || !/^[a-z0-9-]+$/.test(m.slug)) return 'Slug inválido. Use apenas letras minúsculas, números e hífen.';
    if (!m.commissionId) return 'Selecione a comissão organizadora.';
    if (m.locationType === 'virtual' && m.virtualLink && !/^https?:\/\/.+/.test(m.virtualLink)) return 'Link virtual inválido.';
    return null;
  }

  isFormValid(form?: NgForm): boolean {
    // combine template-driven form state + our extra checks
    if (!form) return false;
    if (!form.valid) return false;
    const err = this.basicChecks();
    if (err) {
      this.errorMessage.set(err);
      return false;
    }
    this.errorMessage.set(null);
    return true;
  }

  resetModel() {
    // keep id aside, but reset fields
    this.model.set({
      title: '',
      description: '',
      commissionId: '',
      isPublic: false,
      slug: '',
      learningObjectives: [],
      locationType: 'tbd',
      address: null,
      virtualLink: null,
    });
  }
addObjective(): void {
    this.model.update(currentModel => ({
      ...currentModel,
      learningObjectives: [
        ...currentModel.learningObjectives,
        // Adiciona um novo objetivo em branco ao final da lista
        { icon: 'light-bulb', title: '', description: '' }
      ]
    }));
  }

  removeObjective(index: number): void {
    this.model.update(currentModel => ({
      ...currentModel,
      // Cria um novo array sem o item no índice especificado
      learningObjectives: currentModel.learningObjectives.filter((_, i) => i !== index)
    }));
  }
  /* ===== Save ===== */
 async onSave(form: NgForm) { // <-- Garantimos que o NgForm seja passado
    // **1. VALIDAÇÃO ACONTECE AQUI, DENTRO DA AÇÃO DE SALVAR**

    // Primeiro, checa as validações do template (required, minlength, etc.)
    if (!form.valid) {
      this.errorMessage.set('Por favor, corrija os erros indicados no formulário.');
      this.activeTab.set('info'); // Leva o usuário para a aba com o erro
      return;
    }

    // Segundo, executa nossas checagens customizadas
    const customError = this.basicChecks();
    if (customError) {
      this.errorMessage.set(customError); // Define a mensagem de erro específica
      this.activeTab.set('info');
      return;
    }

    // Se tudo estiver válido, limpa o erro e prossegue
    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      if (this.courseId() && this.courseId() !== 'novo') {
        await this.courseService.updateCourse(this.courseId()!, this.model());
      } else {
        await this.courseService.createCourse(this.model());
      }
      setTimeout(() => this.router.navigate(['/cursos']), 300);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Ocorreu um erro ao salvar o curso. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
    exportRegistrationsToCSV(): void {
    const regs = this.registrations();
    if (regs.length === 0) return;

    const headers = '"Nome","E-mail","Telefone","Data da Inscrição"';
    const rows = regs.map(r =>
      `"${r.name}","${r.email}","${r.phone || ''}","${r.registeredAt.toDate().toLocaleString('pt-BR')}"`
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscritos_${this.model().slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

 onChangeQRUrl(url: SafeUrl) {
    this.qrCodeDownloadLink = url;
  }

  downloadQRCode(): void {
    if (!this.qrCodeDownloadLink) {
      console.error('QR Code ainda não gerado.');
      return;
    }

    const link = document.createElement('a');
    link.href = this.qrCodeDownloadLink.toString();
    link.download = `qrcode-${this.model().slug || 'curso'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}
