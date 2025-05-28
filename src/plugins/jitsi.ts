import { registerPlugin } from '@capacitor/core';

export interface JitsiMeetPlugin {
  startConference(options: { roomName: string }): Promise<void>;
}

export const Jitsi = registerPlugin<JitsiMeetPlugin>('JitsiMeetPlugin');
