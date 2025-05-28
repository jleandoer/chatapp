import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucket = environment.supabaseBucket;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async uploadFile(
    type: 'profile' | 'image' | 'video' | 'audio' | 'document',
    file: File
  ): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}.${extension}`;
      const path = this.getPath(type, fileName);

      const { error } = await this.supabase
        .storage
        .from(this.bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (error) {
        console.error('❌ Error uploading to Supabase:', error.message);
        return null;
      }

      const { data } = this.supabase
        .storage
        .from(this.bucket)
        .getPublicUrl(path);

      return data?.publicUrl ?? null;
    } catch (e) {
      console.error('❌ Upload failed:', e);
      return null;
    }
  }

  private getPath(type: string, fileName: string): string {
    switch (type) {
      case 'profile':
        return `profile-pictures/${fileName}`;
      case 'image':
        return `messages/images/${fileName}`;
      case 'video':
        return `messages/videos/${fileName}`;
      case 'audio':
        return `messages/audio/${fileName}`;
      case 'document':
      default:
        return `messages/documents/${fileName}`;
    }
  }
}
