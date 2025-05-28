import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { SupabaseService } from './supabase.service';

type ChatMessage = {
  id?: string;
  senderId: string;
  receiverId: string;
  messageType: 'text' | 'audio' | 'file' | 'image' | 'video' | 'location';
  content: string;
  timestamp: number;
};

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private messagesCollection;

  constructor(private firestore: Firestore, private supabaseService: SupabaseService) {
    this.messagesCollection = collection(this.firestore, 'chatMessages');
  }

  async sendTextMessage(senderId: string, receiverId: string, text: string) {
    const msg: ChatMessage = {
      senderId,
      receiverId,
      messageType: 'text',
      content: text,
      timestamp: Date.now()
    };
    await addDoc(this.messagesCollection, msg);
  }

  async sendFileMessage(
    senderId: string,
    receiverId: string,
    file: File,
    bucketName: string
  ) {
    const filePath = `${senderId}/${Date.now()}_${file.name}`;
    const fileUrl = await this.supabaseService.uploadFile(bucketName, filePath, file);

    if (!fileUrl) {
      throw new Error('Error uploading file');
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    let messageType: ChatMessage['messageType'] = 'file';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      messageType = 'image';
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
      messageType = 'video';
    } else if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension)) {
      messageType = 'audio';
    }

    const msg: ChatMessage = {
      senderId,
      receiverId,
      messageType,
      content: fileUrl,
      timestamp: Date.now()
    };

    await addDoc(this.messagesCollection, msg);
  }

  listenMessages(userId: string, contactId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      this.messagesCollection,
      where('senderId', 'in', [userId, contactId]),
      where('receiverId', 'in', [userId, contactId]),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach(doc => {
        messages.push({ id: doc.id, ...(doc.data() as ChatMessage) });
      });
      callback(messages);
    });
  }
}
