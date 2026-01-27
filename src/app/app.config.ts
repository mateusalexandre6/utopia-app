import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(
      routes,
      withInMemoryScrolling({
        // Restores scroll position when navigating back/forward
        scrollPositionRestoration: 'enabled',
        // Enables scrolling to an anchor tag (#)
        anchorScrolling: 'enabled',
      })
    ), provideFirebaseApp(() => initializeApp({ projectId: "utopia-api-a5cf3", appId: "1:41123341861:web:5d144c2ff48805916841cc", storageBucket: "utopia-api-a5cf3.firebasestorage.app", apiKey: "AIzaSyDYYNR3KVoNCAKEv7KISzEPVuYm_BaWWHg", authDomain: "utopia-api-a5cf3.firebaseapp.com", messagingSenderId: "41123341861", measurementId: "G-7L649GLFLP" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideStorage(() => getStorage())
  ]
};
