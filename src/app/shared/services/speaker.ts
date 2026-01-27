// src/app/core/services/speaker.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';

export interface SpeakerFormData {
  name: string;
  bio: string;
  organizationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SpeakerService {
  private firestore: Firestore = inject(Firestore);

  createSpeaker(formData: SpeakerFormData) {
    const speakersCollection = collection(this.firestore, 'speakers');
    return addDoc(speakersCollection, formData);
  }

  updateSpeaker(speakerId: string, formData: SpeakerFormData) {
    const speakerDocRef = doc(this.firestore, 'speakers', speakerId);
    return updateDoc(speakerDocRef, { ...formData });
  }

  deleteSpeaker(speakerId: string) {
    const speakerDocRef = doc(this.firestore, 'speakers', speakerId);
    return deleteDoc(speakerDocRef);
  }
}
