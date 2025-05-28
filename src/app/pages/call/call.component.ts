import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notificacion.service';
import { v4 as uuidv4 } from 'uuid';


@Component({
  standalone: false,
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent {
  contactPhone = '';
  userFrom = '';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.authService.getUser().subscribe(user => {
      if (user) {
        this.userFrom = user.uid;
      }
    });
  }

  async sendCallNotification() {
    console.log('🚨 Método ejecutado');
    alert('🚨 ¡Click recibido!');
    if (!this.contactPhone) {
      console.warn('📵 Número vacío');
      return;
    }
  
    const receptorUid = await this.getUidByPhone(this.contactPhone.trim());
    if (!receptorUid) {
      console.error('❌ Usuario no encontrado');
      return;
    }
  
    try {
      const response = await this.notificationService.sendIncomingCallNotification(receptorUid);
      console.log('✅ Notificación enviada:', response);
    } catch (error: any) {
      console.error('❌ Error al llamar:', error);
      alert('❌ Error al llamar: ' + (error?.message || 'Error desconocido'));
    }
  }
  
  async getUidByPhone(phone: string): Promise<string | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const result = await getDocs(q);
  
    if (!result.empty) {
      return result.docs[0].id; 
    } else {
      return null;
    }
  }
}  