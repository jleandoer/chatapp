import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications } from '@capacitor/push-notifications';
import { FirestoreService } from './services/firestore.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  userId: string = '';

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private firestoreService: FirestoreService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    this.authService.getUser().subscribe(async (user) => {
      if (user && user.uid) {
        this.userId = user.uid;
        this.registerPushNotifications();
      }
    });
  }

  async registerPushNotifications() {
    let permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('FCM Token:', token.value);

        this.firestoreService.updateUserToken(this.userId, token.value);
      });

  
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error en el registro de notificaciones:', error);
      });
    } else {
      console.warn('Permiso de notificaciones denegado');
    }
  }
}
