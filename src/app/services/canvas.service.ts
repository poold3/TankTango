import { Injectable } from '@angular/core';
import { Maze, Room } from './game.service';

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

  drawMaze(maze: Maze) {
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 4;
    const mazeStartX: number = (this.canvasElement.width - maze.width) / 2;
    const mazeStartY: number = 100;
    this.ctx.strokeRect(mazeStartX, mazeStartY, maze.width, maze.height);
    const rooms: Array<Array<Room>> = maze.rooms;
    for (let i = 0; i < maze.numRoomsHigh; ++i) {
      for (let j = 0; j < maze.numRoomsWide; ++j) {
        const room: Room = rooms[i][j];
        if (room.minusX) {
          this.ctx.moveTo(mazeStartX + (j * 75), mazeStartY + (i * 75));
          this.ctx.lineTo(mazeStartX + (j * 75), mazeStartY + (i * 75) + 75);
          this.ctx.stroke();
        }
        if (room.plusX) {
          this.ctx.moveTo(mazeStartX + (j * 75) + 75, mazeStartY + (i * 75));
          this.ctx.lineTo(mazeStartX + (j * 75) + 75, mazeStartY + (i * 75) + 75);
          this.ctx.stroke();
        }
        if (room.minusY) {
          this.ctx.moveTo(mazeStartX + (j * 75), mazeStartY + (i * 75));
          this.ctx.lineTo(mazeStartX + (j * 75) + 75, mazeStartY + (i * 75));
          this.ctx.stroke();
        }
        if (room.plusY) {
          this.ctx.moveTo(mazeStartX + (j * 75), mazeStartY + (i * 75) + 75);
          this.ctx.lineTo(mazeStartX + (j * 75) + 75, mazeStartY + (i * 75) + 75);
          this.ctx.stroke();
        }
      }
    }
  }

}
