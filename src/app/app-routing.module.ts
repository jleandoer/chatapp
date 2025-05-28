import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { ChatComponent } from './pages/chat/chat.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'add-contact',
    loadChildren: () => import('./pages/add-contact/add-contact.module').then(m => m.AddContactPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'incoming-call',
    loadChildren: () => import('./pages/incoming-call/incoming-call.module').then(m => m.IncomingCallPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:contactId',
    component: ChatComponent
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
