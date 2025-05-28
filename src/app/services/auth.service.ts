import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence,
  user,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private http = inject(HttpClient);

  private apiUrl = 'https://ravishing-courtesy-production.up.railway.app';

  // 🧠 Credenciales quemadas para API externa (diferente a Firebase)
  private externalEmail = 'santiago.osorioescobar@unicolombo.edu.co';    
  private externalPassword = 'REDNGOLD32';     

  user$: Observable<User | null> = user(this.auth);

  constructor() {
    setPersistence(this.auth, browserSessionPersistence);
  }

  register(email: string, password: string): Observable<any> {
    return new Observable(observer => {
      createUserWithEmailAndPassword(this.auth, email, password)
        .then(userCredential => observer.next(userCredential))
        .catch(err => observer.error(err));
    });
  }

  login(firebaseEmail: string, firebasePassword: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.auth, firebaseEmail, firebasePassword);
    return from(promise).pipe(
      switchMap(() => {
     
        return this.loginToExternalApi(this.externalEmail, this.externalPassword);
      }),
      tap((response: any) => {
        console.log('🔐 Respuesta completa de API externa:', response);
  
  
        if (response && response.data && response.data.access_token) {
          const token = response.data.access_token;
          this.saveApiToken(token);  
          console.log('✅ Token guardado:', token);
        } else {
          console.warn('⚠️ No se recibió token válido');
        }
      })
    );
  }

  logout(): Observable<void> {
    const promise = signOut(this.auth).then(() => {
      sessionStorage.clear();
      localStorage.removeItem('accessToken');
      this.router.navigate(['/login']);
    });
    return from(promise);
  }

  getUser(): Observable<any> {
    return new Observable(observer => {
      onAuthStateChanged(this.auth, user => {
        observer.next(user);
      });
    });
  }

  isAuthenticated(): Observable<boolean> {
    return new Observable(observer => {
      onAuthStateChanged(this.auth, user => {
        observer.next(!!user);
      });
    });
  }

  saveUserData(uid: string, name: string, surname: string, phone: string): Promise<void> {
    if (!uid || !name || !surname || !phone) {
      return Promise.reject('Datos inválidos para guardar el usuario.');
    }

    const userRef = doc(this.firestore, `users/${uid}`);
    return setDoc(userRef, {
      name,
      surname,
      phone
    });
  }

  loginToExternalApi(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/login`, { email, password });
  }

  saveApiToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getApiToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getStoredUserId(): string | null {
    const user = sessionStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      return parsed?.uid || null;
    }
    return null;
  }
}
