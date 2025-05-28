import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-add-contact',
  templateUrl: './add-contact.page.html',
  styleUrls: ['./add-contact.page.scss'],
})
export class AddContactPage implements OnInit {

  phone: string = '';
  contact: any = null;
  userId: string = '';

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      if (user && user.uid) {
        this.userId = user.uid;
        console.log('User ID:', this.userId);
      } else {
        this.showError('User not authenticated');
        this.router.navigate(['/login']);
      }
    });
  }

  async searchContact() {
    if (!this.phone) {
      this.showError('Please enter a phone number.');
      return;
    }

    if (!this.userId) {
      this.showError('User ID is not available.');
      return;
    }

    try {
      const foundUser = await this.firestoreService.findUserByPhone(this.phone);

      if (!foundUser) {
        this.showError('Contact not found.');
        this.contact = null;
        return;
      }

      if (foundUser.id === this.userId) {
        this.showError('You cannot add yourself as a contact.');
        this.contact = null;
        return;
      }

      this.contact = {
        id: foundUser.id,
        name: foundUser.name || 'No name',
        phone: foundUser.phone
      };

      console.log('User found:', this.contact);
    } catch (error) {
      this.showError('An error occurred while searching for the contact.');
    }
  }

  addContact() {
    if (!this.contact) {
      this.showError('No contact selected');
      return; 
    }

    this.firestoreService.addContact(this.userId, this.contact).then(
      () => {
        this.showSuccess('Contact added successfully');
      },
      () => {
        this.showError('An error occurred while adding the contact');
      }
    );
  }

  async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async showSuccess(message: string) {
    const alert = await this.alertController.create({
      header: 'Success',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
