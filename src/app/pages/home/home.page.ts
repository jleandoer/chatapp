import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { PushNotifications } from '@capacitor/push-notifications';
@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  userId = '';
  contacts: any[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.getUser().subscribe(async user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      const permStatus = await PushNotifications.checkPermissions();
      console.log('Estado del permiso:', permStatus.receive);

      this.userId = user.uid;
      await this.loadContacts();
    });
  }

  goToAddContact() {
    this.router.navigate(['/add-contact']);
  }
  goToChat(contactId: string) {
    this.router.navigate(['/chat', contactId]);
  }

  async loadContacts() {
    try {
      this.contacts = await this.firestoreService.getContacts(this.userId);
      console.log('Contactos cargados:', this.contacts);
    } catch (error) {
      console.error('Error cargando contactos:', error);
    }
  }
}
