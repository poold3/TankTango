import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  backgroundImage: HTMLImageElement;

  constructor() {
    this.backgroundImage = new Image();
  }

  loadCanvasElement(canvasElement: HTMLCanvasElement): void {
    this.canvasElement = canvasElement;
    this.ctx = <CanvasRenderingContext2D> this.canvasElement.getContext("2d");
    this.backgroundImage.addEventListener("load", this.drawBackgroundImage.bind(this));
  }

  setBackground(imageSrc: string): void {
    this.backgroundImage.src = imageSrc;
  }

  drawBackgroundImage(): void {
    this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvasElement.width, this.canvasElement.height);
  }

}
