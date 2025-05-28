import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  standalone:false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  async login() {
    try {

      await this.authService.login(this.email, this.password).toPromise(); 

      this.router.navigate(['/home']);
    } catch (error: any) {

      const alert = await this.alertController.create({
        header: 'Error',
        message: error.message || 'Error desconocido',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }
}
