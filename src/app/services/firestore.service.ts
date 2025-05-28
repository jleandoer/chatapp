import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  onSnapshot
} from '@angular/fire/firestore';
import { Message } from 'src/models/message.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: Firestore) { }



  async sendMessage(message: Message): Promise<void> {
    const messagesCol = collection(this.firestore, 'messages');
    await addDoc(messagesCol, message);
  }

  async getMessages(userId: string, contactId: string): Promise<Message[]> {
    const messagesCol = collection(this.firestore, 'messages');
    const q = query(messagesCol, orderBy('created_at', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as unknown as Message))
      .filter(
        (msg: Message) =>
          (msg.sender_id === userId && msg.receiver_id === contactId) ||
          (msg.sender_id === contactId && msg.receiver_id === userId)
      );
  }

  subscribeToMessages(
    userId: string,
    contactId: string,
    callback: (msg: Message) => void
  ) {
    const messagesCol = collection(this.firestore, 'messages');
    const q = query(messagesCol, orderBy('created_at', 'asc'));

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const msg = change.doc.data() as Message;
          if (
            (msg.sender_id === userId && msg.receiver_id === contactId) ||
            (msg.sender_id === contactId && msg.receiver_id === userId)
          ) {
            callback(msg);
          }
        }
      });
    });
  }



  async findUserByPhone(phone: string): Promise<any | null> {
    const usersCol = collection(this.firestore, 'users');
    const q = query(usersCol, where('phone', '==', phone));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }

    return null;
  }

  async getContacts(userId: string): Promise<any[]> {
    const contactsCol = collection(this.firestore, `users/${userId}/contacts`);
    const querySnapshot = await getDocs(contactsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  addContact(userId: string, contact: any): Promise<any> {
    const contactsRef = collection(this.firestore, `users/${userId}/contacts`);
    return addDoc(contactsRef, contact);
  }

  getContactById(userId: string, contactId: string): Promise<any> {
    const contactRef = doc(this.firestore, `users/${userId}/contacts/${contactId}`);
    return getDoc(contactRef).then(docSnap => {
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('El contacto no existe.');
      }
    });
  }
  async getUserNameById(userId: string): Promise<string> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return data?.['name'] || 'Sin nombre';
      } else {
        return 'Sin nombre';
      }
    } catch (error) {
      console.error('Error al obtener nombre de usuario:', error);
      return 'Sin nombre';
    }
  }

  updateContact(userId: string, contactId: string, data: any): Promise<void> {
    const contactRef = doc(this.firestore, `users/${userId}/contacts/${contactId}`);
    return updateDoc(contactRef, data);
  }

  deleteContact(userId: string, contactId: string): Promise<void> {
    const contactRef = doc(this.firestore, `users/${userId}/contacts/${contactId}`);
    return deleteDoc(contactRef);
  }

  updateUserToken(userId: string, token: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, { token });
  }
}
