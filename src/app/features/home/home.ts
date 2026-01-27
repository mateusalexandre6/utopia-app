import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { ActivityFormComponent } from '../activities/activity-form/activity-form';
import { AuthService } from '../../shared/services/auth.service';
import { TaskFormComponent } from '../tasks/task-form/task-form';
import { Router } from '@angular/router';
import { Activity } from '../../shared/models/activity.model';
import { ForumTopic } from '../../shared/models/forum-topic.model';
import { BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartData, Legend, LinearScale, Tooltip } from 'chart.js'; // <-- 2. Importar Tipos
import { BaseChartDirective } from 'ng2-charts'; // <-- 1. IMPORTAR
interface EnrichedActivity extends Activity {
  commissionName?: string;
}

interface EnrichedTopic extends ForumTopic {
  authorName?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
 imports: [
    CommonModule,
    ActivityFormComponent,
    TaskFormComponent,
    DatePipe,
    BaseChartDirective // <-- 3. ADICIONAR AOS IMPORTS
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  authService = inject(AuthService);
  firestoreService = inject(FirestoreService);
  router = inject(Router);

  // --- Sinais para controlar a visibilidade dos modais ---
  isActivityFormVisible = signal(false);
  isTaskFormVisible = signal(false);

  // --- Sinais brutos vindos do serviço ---
  private organizations = this.firestoreService.organizations;
  private users = this.firestoreService.users;
  private activities = this.firestoreService.activities;
  private commissions = this.firestoreService.commissions; // NOVO
  private courses = this.firestoreService.courses;         // NOVO
  private tasks = this.firestoreService.tasks;             // NOVO
  private forumTopics = this.firestoreService.forumTopics; // NOVO
constructor() {
    Chart.register(
      BarController,  // Registra o controlador do gráfico de barras
      BarElement,     // Registra o elemento (a forma) da barra
      LinearScale,    // Registra a escala linear (para o eixo Y) <-- O QUE FALTAVA
      CategoryScale,  // Registra a escala de categoria (para o eixo X)
      Tooltip,        // Registra os tooltips (opcional, mas bom ter)
      Legend          // Registra a legenda (opcional)
    );
  }
  // --- Mapas Computados para "Join" de Dados ---
  // Cria um Mapa de ID -> Nome para buscar nomes de usuários eficientemente
  private userMap = computed(() => {
    return new Map(this.users().map(u => [u.uid, u.displayName]));
  });

  // Cria um Mapa de ID -> Nome para buscar nomes de comissões eficientemente
  private commissionMap = computed(() => {
    return new Map(this.commissions().map(c => [c.id, c.name]));
  });

  // **Sinais Computados para os KPIs (Cards)**
  nucleiCount = computed(() => this.organizations().filter(org => org.type === 'nucleus').length);
  memberCount = computed(() => this.users().length);
  courseCount = computed(() => this.courses().length); // NOVO
  taskCount = computed(() => this.tasks().length);     // NOVO

  // **Sinais Computados para as Listas**
  upcomingActivities = computed(() => {
    const now = new Date();
    return this.activities()
      .filter(act => act.date.toDate() > now)
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
      .slice(0, 5);
  });

  latestActivities = computed((): EnrichedActivity[] => {
    const commMap = this.commissionMap(); // Pega o mapa de comissões
    return this.activities()
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
      .slice(0, 7)
      .map(activity => ({
        ...activity,
        // Adiciona o nome da comissão ao objeto
        commissionName: commMap.get(activity.commissionId) || 'N/D'
      }));
  });

  // NOVO: Lista de Tópicos Recentes do Fórum (Substitui os dados estáticos)
  latestTopics = computed((): EnrichedTopic[] => {
    const userMap = this.userMap(); // Pega o mapa de usuários
    return this.forumTopics()
      .slice(0, 5) // O serviço já ordena por 'createdAt', então só pegamos os 5 primeiros
      .map(topic => ({
        ...topic,
        // Adiciona o nome do autor ao objeto
        authorName: userMap.get(topic.createdByDisplayName) || 'Anônimo'
      }));
  });

activityChartData = computed(() => {
    const activities = this.activities();
    const daysData: any[] = [];
    // ... (lógica para calcular os últimos 7 dias - sem mudanças aqui)
    for (let i = 6; i >= 0; i--) {
       // ...
    }
    // ... (lógica para contar as atividades - sem mudanças aqui)
    return daysData.map(day => ({
      ...day,
      count: day.count,
      label: day.label
    }));
  });
  // **Microinteração: Estado de Carregamento para Skeletons**
  isLoading = computed(() => {
    // A página está carregando se os dados essenciais dos KPIs ainda não foram populados
    return this.organizations().length === 0 &&
           this.users().length === 0 &&
           this.courses().length === 0 &&
           this.tasks().length === 0;
  });

barChartData = computed((): ChartData<'bar'> => {
    const chartData = this.activityChartData(); // Reutiliza nosso signal anterior
    return {
      labels: chartData.map(d => d.label), // ['Seg', 'Ter', 'Qua'...]
      datasets: [
        {
          data: chartData.map(d => d.count), // [1, 0, 3, 2...]
          label: 'Atividades',
          backgroundColor: 'rgba(139, 92, 246, 0.6)', // Cor primária com opacidade
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(139, 92, 246, 0.8)',
        }
      ]
    };
  });

  // 5. NOVO: Opções de configuração para o gráfico
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, // <-- Importante para caber no container h-72
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Força a contagem em inteiros (1, 2, 3... sem 1.5)
          color: '#9CA3AF' // text-gray-400
        },
        grid: {
          color: '#374151' // border-gray-700
        }
      },
      x: {
        ticks: {
          color: '#9CA3AF' // text-gray-400
        },
        grid: {
          display: false // Esconde as linhas de grid verticais
        }
      }
    },
    plugins: {
      legend: {
        display: false // Não precisa de legenda, só temos 1 dataset
      },
      tooltip: {
        backgroundColor: '#1F2937', // bg-gray-800
        titleColor: '#F9FAFB', // text-gray-50
        bodyColor: '#D1D5DB', // text-gray-300
      }
    }
  };

  // --- Métodos de Ação ---

  onNewActivity(): void {
    this.isActivityFormVisible.set(true);
  }

  onNewTask(): void {
    this.isTaskFormVisible.set(true);
  }

  navigateToNewCourse(): void {
    this.router.navigate(['/cursos/novo']);
  }

  onCloseActivityForm(): void {
    this.isActivityFormVisible.set(false);
  }

  onCloseTaskForm(): void {
    this.isTaskFormVisible.set(false);
  }

  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  // NOVO: Navega para um tópico do fórum (exemplo)
  navigateToTopic(topicId: string): void {
    // Ajuste a rota conforme a sua aplicação
    this.router.navigate(['/forum/topico', topicId]);
  }
}
