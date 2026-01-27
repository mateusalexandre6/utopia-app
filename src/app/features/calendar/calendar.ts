// src/app/features/calendar/calendar.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../shared/services/firestore.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent {
  private firestoreService = inject(FirestoreService);
  activities = this.firestoreService.activities;
}
