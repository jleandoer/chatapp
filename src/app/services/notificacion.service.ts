import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import {
  Firestore,
  doc,
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://ravishing-courtesy-production.up.railway.app';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  async initFCM() {
    console.log('🛑 Inicializando FCM');
    const permission = await PushNotifications.requestPermissions();
    console.log('🔍 Permisos para notificaciones:', permission);
    if (permission.receive !== 'granted') {
      console.warn('⚠️ Permiso para notificaciones no concedido');
      return;
    }

    console.log('📲 Registrando para recibir notificaciones');
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('📲 FCM Token recibido:', token.value);

      this.authService.getUser().subscribe(async user => {
        if (user && user.uid) {
          const userRef = doc(this.firestore, `users/${user.uid}`);
          await updateDoc(userRef, { token: token.value });
          console.log('✅ Token guardado en Firestore');
        } else {
          console.error('❌ Usuario no autenticado para guardar el token');
        }
      });
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Error al registrar FCM:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 Notificación recibida:', notification);

      const data = notification.data;

      if (data?.type === 'incoming_call') {
        const callerName = data.name;
        const roomName = data.meetingId;

        console.log('📞 Llamada entrante de:', callerName, '| Sala:', roomName);

        this.router.navigate(['/incoming-call'], {
          queryParams: {
            callerName,
            roomName
          }
        });
      }
    });
  }

  async sendIncomingCallNotification(receptorUid: string): Promise<any> {
    console.log('🛑 Iniciando envío de notificación');

    const jwt = localStorage.getItem('accessToken');
    console.log('🔍 JWT Recuperado:', jwt);
    
    if (!jwt) {
      console.error('❌ Token JWT no disponible');
      throw new Error('Token JWT no disponible');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    });

    const llamador = await firstValueFrom(this.authService.getUser());
    if (!llamador || !llamador.uid) {
      console.error('❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    const llamadorRef = doc(this.firestore, `users/${llamador.uid}`);
    const llamadorSnap = await getDoc(llamadorRef);
    if (!llamadorSnap.exists()) {
      console.error('❌ No se encontró el llamador');
      throw new Error('No se encontró el llamador');
    }

    const llamadorData = llamadorSnap.data() as any;
    const nombreLlamador = llamadorData?.name || 'Alguien';

    const receptorRef = doc(this.firestore, `users/${receptorUid}`);
    const receptorSnap = await getDoc(receptorRef);
    if (!receptorSnap.exists()) {
      console.error('❌ El usuario receptor no existe');
      throw new Error('El usuario receptor no existe');
    }

    const receptorData = receptorSnap.data() as any;
    if (!receptorData.token) {
      console.error('❌ El receptor no tiene un token registrado');
      throw new Error('El receptor no tiene un token registrado');
    }

    const payloadToSend = {
      token: receptorData.token,
      notification: {
        title: 'Llamada entrante',
        body: `${nombreLlamador} te está llamando`
      },
      android: {
        priority: 'high',
        data: {
          userId: receptorUid,
          meetingId: uuidv4(),
          type: 'incoming_call',
          name: nombreLlamador,
          userFrom: llamador.uid
        }
      }
    };

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/notifications`, payloadToSend, { headers })
      );
      console.log('✅ Notificación enviada correctamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error al enviar la notificación:', JSON.stringify(error));
      throw new Error('Error al enviar la notificación');
    }
  }
}
