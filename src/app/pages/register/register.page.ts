import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name: string = '';
  surname: string = '';
  email: string = '';
  password: string = '';
  phone: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  register() {
    this.authService.register(this.email, this.password).subscribe({
      next: async (userCredential) => {
        const user = userCredential.user;
        await this.authService.saveUserData(user.uid, this.name, this.surname, this.phone);
        this.router.navigate(['/home']);
      },
      error: async (error: any) => {
        const alert = await this.alertController.create({
          header: 'Error',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    });
  }
}
