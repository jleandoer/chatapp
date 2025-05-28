import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { SupabaseService } from 'src/app/services/supabase.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Message } from 'src/models/message.model';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { VideoRecorder } from '@capacitor-community/video-recorder';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private supabaseService: SupabaseService = inject(SupabaseService);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private route: ActivatedRoute = inject(ActivatedRoute);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  userId: string = '';
  contactId: string = '';
  messages: Message[] = [];
  messageText: string = '';
  selectedFile?: File;
  isSending = false;
  private unsubscribeFirestore: any;

contactName: string = '';

ngOnInit() {
  this.contactId = this.route.snapshot.paramMap.get('contactId') || '';

  this.auth.onAuthStateChanged(async (user) => {
    if (user) {
      this.userId = user.uid;
      this.contactName = await this.firestoreService.getUserNameById(this.contactId);

      await this.loadMessages();
      this.subscribeToNewMessages();
    }
  });
}


  ngOnDestroy() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }
  }

  async loadMessages() {
    try {
      this.messages = await this.firestoreService.getMessages(this.userId, this.contactId);
    } catch (error) {
      console.error('Error loading messages', error);
    }
  }

  subscribeToNewMessages() {
    this.unsubscribeFirestore = this.firestoreService.subscribeToMessages(
      this.userId,
      this.contactId,
      (msg: Message) => {
        this.messages.push(msg);
      }
    );
  }

  async sendMessage() {
    if (this.isSending) return;

    const content = this.messageText.trim();
    if (!content) return;

    const message: Message = {
      sender_id: this.userId,
      receiver_id: this.contactId,
      content,
      content_type: 'text/plain',
      created_at: new Date().toISOString(),
    };

    this.isSending = true;
    try {
      await this.firestoreService.sendMessage(message);
      this.messageText = '';
    } catch (error) {
      console.error('Error sending message', error);
    } finally {
      this.isSending = false;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.sendFileMessage();
      this.fileInput.nativeElement.value = '';
    }
  }

  async sendFileMessage() {
    if (!this.selectedFile) return;

    const file = this.selectedFile;

    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    try {
      const url = await this.supabaseService.uploadFile(type, file);
      if (url) {
        const message: Message = {
          sender_id: this.userId,
          receiver_id: this.contactId,
          content: url,
          content_type: file.type,
          created_at: new Date().toISOString(),
        };
        await this.firestoreService.sendMessage(message);
      }
    } catch (error) {
      console.error('Error sending file message', error);
    }

    this.selectedFile = undefined;
  }

  async sendPhoto(fromGallery: boolean) {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: fromGallery ? CameraSource.Photos : CameraSource.Camera,
        quality: 80,
      });

      const base64 = image.dataUrl;
      if (!base64) return;

      const blob = await (await fetch(base64)).blob();
      const file = new File([blob], `photo_${Date.now()}.jpeg`, { type: 'image/jpeg' });

      const url = await this.supabaseService.uploadFile('image', file);

      if (url) {
        const message: Message = {
          sender_id: this.userId,
          receiver_id: this.contactId,
          content: url,
          content_type: 'image/jpeg',
          created_at: new Date().toISOString(),
        };
        await this.firestoreService.sendMessage(message);
      }
    } catch (err) {
      console.error('Error al enviar foto:', err);
    }
  }

  async sendVideo() {
    try {
      await VideoRecorder.startRecording();
      const result = await VideoRecorder.stopRecording();

      if (result?.videoUrl) {
        const response = await fetch(result.videoUrl);
        const blob = await response.blob();

        const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });
        const url = await this.supabaseService.uploadFile('video', file);

        if (url) {
          const message: Message = {
            sender_id: this.userId,
            receiver_id: this.contactId,
            content: url,
            content_type: 'video/mp4',
            created_at: new Date().toISOString(),
          };
          await this.firestoreService.sendMessage(message);
          this.messages.push(message);
        }
      }
    } catch (err) {
      console.error('Error al grabar video:', err);
    }
  }

  async startRecording() {
    try {
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        console.warn('Permiso de micrófono denegado');
        return;
      }

      await VoiceRecorder.startRecording();
    } catch (err) {
      console.error('Error iniciando grabación de voz:', err);
    }
  }

  async stopRecording() {
    try {
      const result = await VoiceRecorder.stopRecording();
      if (result?.value?.recordDataBase64) {
        const blob = this.base64ToBlob(result.value.recordDataBase64, 'audio/aac');
        const file = new File([blob], `audio_${Date.now()}.aac`, { type: 'audio/aac' });

        const url = await this.supabaseService.uploadFile('audio', file);

        if (url) {
          const message: Message = {
            sender_id: this.userId,
            receiver_id: this.contactId,
            content: url,
            content_type: 'audio/aac',
            created_at: new Date().toISOString(),
          };
          await this.firestoreService.sendMessage(message);
        }
      }
    } catch (err) {
      console.error('Error al detener grabación de voz:', err);
    }
  }

  async sendFileFromPicker() {
    try {
      const result = await FilePicker.pickFiles();
      const fileInfo = result.files[0];
      if (!fileInfo || !fileInfo.name || !fileInfo.blob) return;

      const file = new File([fileInfo.blob], fileInfo.name, {
        type: fileInfo.mimeType || 'application/octet-stream',
      });

      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const url = await this.supabaseService.uploadFile(type, file);

      if (url) {
        const message: Message = {
          sender_id: this.userId,
          receiver_id: this.contactId,
          content: url,
          content_type: file.type,
          created_at: new Date().toISOString(),
        };
        await this.firestoreService.sendMessage(message);
      }
    } catch (err) {
      console.error('Error al enviar archivo desde picker:', err);
    }
  }



  async requestLocationPermission() {
    const permission = await Geolocation.requestPermissions();

    if (permission.location === 'granted') {
      console.log('✅ Permiso de ubicación concedido');
    } else {
      console.error('❌ Permiso de ubicación denegado');
    }
  }

async sendLocation() {
  try {
    await this.requestLocationPermission();

    const position = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const mapboxToken = '';
    const zoom = 15;
    const width = 600;
    const height = 300;


    const mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},${zoom}/${width}x${height}?access_token=${mapboxToken}`;


    const response = await fetch(mapImageUrl);
    if (!response.ok) throw new Error('Error descargando imagen del mapa');

    const blob = await response.blob();

    
    const file = new File([blob], `location_${Date.now()}.png`, { type: 'image/png' });


    const url = await this.supabaseService.uploadFile('image', file);

    if (url) {
      const message: Message = {
        sender_id: this.userId,
        receiver_id: this.contactId,
        content: url,
        content_type: 'image/png',
        created_at: new Date().toISOString(),
      };

      await this.firestoreService.sendMessage(message);
    }
  } catch (err) {
    console.error('Error al enviar ubicación como mapa renderizado:', err);
  }
}

  base64ToBlob(base64: string, type: string): Blob {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type });
  }
}
