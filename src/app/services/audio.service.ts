import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  audioElements: Map<string, HTMLAudioElement> = new Map<string, HTMLAudioElement>();
  constructor() { }

  addAudio(keyword: string, src: string, loop: boolean = false, volume = 1, playbackRate = 1) {
    const newSound = document.createElement("audio");
    if (newSound.canPlayType("audio/mpeg") === "probably") {
      newSound.setAttribute("src", src);
      newSound.volume = volume;
      newSound.playbackRate = playbackRate;
      newSound.setAttribute("preload", "auto");
      if (loop) {
        newSound.setAttribute("loop", "true");
      }
      this.audioElements.set(keyword, newSound);
    }
  }

  async playAudio(keyword: string): Promise<void> {
    if (this.audioElements.has(keyword)) {
      (<HTMLAudioElement> this.audioElements.get(keyword)).currentTime = 0;
      await (<HTMLAudioElement> this.audioElements.get(keyword)).play();
    }
  }

  pauseAudio(keyword: string) {
    if (this.audioElements.has(keyword)) {
      (<HTMLAudioElement> this.audioElements.get(keyword)).pause();
    }
  }
}

export enum AudioType {
  Hit,
  Boom,
  Ultimate
}
