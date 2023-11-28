import { Injectable } from '@angular/core';
import { Maze, Room } from './game.service';
import { AssaultTank, DemolitionTank, ScoutTank, ServerTank, TankTank, TankType } from '../tank';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  backgroundImage: HTMLImageElement;
  mazeStartX: number = 0;
  mazeStartY: number = 0;
  mazeWidth: number = 0;
  mazeHeight: number = 0;
  mazeStep: number = 0;
  mazeNumRoomsWide: number = 0;
  mazeNumRoomsHigh: number = 0;
  mazeRooms: Array<Array<Room>> = new Array<Array<Room>>();
  images!: TankImages;
  downArrowImage!: HTMLImageElement;

  constructor() {
    this.backgroundImage = new Image();
    this.images = {
      tankBody: this.createImage("/assets/tanks/tankbody.png"),
      tankTurret: this.createImage("/assets/tanks/tankturret.png"),
      assaultBody: this.createImage("/assets/tanks/assaultbody.png"),
      assaultTurret: this.createImage("/assets/tanks/assaultturret.png"),
      scoutBody: this.createImage("/assets/tanks/scoutbody.png"),
      scoutTurret: this.createImage("/assets/tanks/scoutturret.png"),
      demolitionBody: this.createImage("/assets/tanks/demolitionbody.png"),
      demolitionTurret: this.createImage("/assets/tanks/demolitionturret.png"),
    }
    this.downArrowImage = new Image();
    this.downArrowImage.src = "/assets/downarrow.png";
  }

  createImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  getTankBodyByType(type: TankType): HTMLImageElement {
    if (type == TankType.Tank) {
      return this.images.tankBody;
    } else if (type == TankType.Assault) {
      return this.images.assaultBody;
    } else if (type == TankType.Scout) {
      return this.images.scoutBody;
    } else {
      return this.images.demolitionBody;
    }
  }

  getTankTurretByType(type: TankType): HTMLImageElement {
    if (type == TankType.Tank) {
      return this.images.tankTurret;
    } else if (type == TankType.Assault) {
      return this.images.assaultTurret;
    } else if (type == TankType.Scout) {
      return this.images.scoutTurret;
    } else {
      return this.images.demolitionTurret;
    }
  }

  getTankWidthByType(type: TankType): number {
    if (type == TankType.Tank) {
      return TankTank.width;
    } else if (type == TankType.Assault) {
      return AssaultTank.width;
    } else if (type == TankType.Scout) {
      return ScoutTank.width;
    } else {
      return DemolitionTank.width;
    }
  }

  getTankLengthByType(type: TankType): number {
    if (type == TankType.Tank) {
      return TankTank.length;
    } else if (type == TankType.Assault) {
      return AssaultTank.length;
    } else if (type == TankType.Scout) {
      return ScoutTank.length;
    } else {
      return DemolitionTank.length;
    }
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

  loadMazeInfo(maze: Maze) {
    this.mazeStartX = (this.canvasElement.width - maze.width) / 2;
    this.mazeStartY = 50;
    this.mazeWidth = maze.width;
    this.mazeHeight = maze.height;
    this.mazeStep = maze.step;
    this.mazeNumRoomsWide = maze.numRoomsWide;
    this.mazeNumRoomsHigh = maze.numRoomsHigh;
    this.mazeRooms = maze.rooms;
  }

  getMazeStartX() {
    return this.mazeStartX;
  }

  getMazeStartY() {
    return this.mazeStartY;
  }

  clearMazeField() {
    this.ctx.clearRect(this.mazeStartX - 2, this.mazeStartY - 2, this.mazeWidth + 4, this.mazeHeight + 4);
  }

  drawMaze() {
    // Draw maze background
    this.ctx.fillStyle = "#e7e7e7";
    this.ctx.fillRect(this.mazeStartX, this.mazeStartY, this.mazeWidth, this.mazeHeight);

    // Draw maze walls
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.mazeStartX, this.mazeStartY, this.mazeWidth, this.mazeHeight);

    
    // Draw maze edges
    this.ctx.beginPath();
    for (let i = 0; i < this.mazeNumRoomsHigh; ++i) {
      for (let j = 0; j < this.mazeNumRoomsWide; ++j) {
        const room: Room = this.mazeRooms[i][j];
        if (room.minusX) {
          this.ctx.moveTo(this.mazeStartX + (j * this.mazeStep), this.mazeStartY + (i * this.mazeStep));
          this.ctx.lineTo(this.mazeStartX + (j * this.mazeStep), this.mazeStartY + (i * this.mazeStep) + this.mazeStep);
        }
        if (room.plusX) {
          this.ctx.moveTo(this.mazeStartX + (j * this.mazeStep) + this.mazeStep, this.mazeStartY + (i * this.mazeStep));
          this.ctx.lineTo(this.mazeStartX + (j * this.mazeStep) + this.mazeStep, this.mazeStartY + (i * this.mazeStep) + this.mazeStep);
        }
        if (room.minusY) {
          this.ctx.moveTo(this.mazeStartX + (j * this.mazeStep), this.mazeStartY + (i * this.mazeStep));
          this.ctx.lineTo(this.mazeStartX + (j * this.mazeStep) + this.mazeStep, this.mazeStartY + (i * this.mazeStep));
        }
        if (room.plusY) {
          this.ctx.moveTo(this.mazeStartX + (j * this.mazeStep), this.mazeStartY + (i * this.mazeStep) + this.mazeStep);
          this.ctx.lineTo(this.mazeStartX + (j * this.mazeStep) + this.mazeStep, this.mazeStartY + (i * this.mazeStep) + this.mazeStep);
        }
      }
    }
    this.ctx.stroke();
  }

  drawTanks(tankSelection: ServerTank, serverTanks: Array<ServerTank>) {
    serverTanks.forEach((tank: ServerTank) => {
      let tankToDraw: ServerTank;
      let isSelectedTank: boolean = false;
      if (tank.gamerName !== tankSelection.gamerName) {
        tankToDraw = tank;
      } else {
        tankToDraw = tankSelection;
        isSelectedTank = true;
      }

      if (!tankToDraw.alive) {
        return;
      }

      const tankWidth = this.getTankWidthByType(tankToDraw.type);
      const tankLength = this.getTankLengthByType(tankToDraw.type);

      if (isSelectedTank && tankToDraw.positionY - 50 > -10.0) {
        this.ctx.drawImage(this.downArrowImage, (tankToDraw.positionX + this.mazeStartX) - 12, (tankToDraw.positionY + this.mazeStartY) - 50);
      }
      
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX), (tankToDraw.positionY + this.mazeStartY));
      this.ctx.rotate((tankToDraw.heading * Math.PI / 180.0) * -1.0);
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX) * -1.0, (tankToDraw.positionY + this.mazeStartY) * -1.0);
      this.ctx.drawImage(this.getTankBodyByType(tankToDraw.type), (tankToDraw.positionX + this.mazeStartX) - (tankLength * 0.375), (tankToDraw.positionY + this.mazeStartY) - (tankWidth * 0.375), tankLength * 0.75, tankWidth * 0.75);
    
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX), (tankToDraw.positionY + this.mazeStartY));
      this.ctx.rotate(((tankToDraw.turretHeading - tankToDraw.heading) * Math.PI / 180.0) * -1.0);
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX) * -1.0, (tankToDraw.positionY + this.mazeStartY) * -1.0);
      this.ctx.drawImage(this.getTankTurretByType(tankToDraw.type), (tankToDraw.positionX + this.mazeStartX) - (tankLength * 0.375), (tankToDraw.positionY + this.mazeStartY) - (tankWidth * 0.375), tankLength * 0.75, tankWidth * 0.75);
      this.ctx.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
    });
  }

}

export interface TankImages {
  tankBody: HTMLImageElement;
  tankTurret: HTMLImageElement;
  assaultBody: HTMLImageElement;
  assaultTurret: HTMLImageElement;
  scoutBody: HTMLImageElement;
  scoutTurret: HTMLImageElement;
  demolitionBody: HTMLImageElement;
  demolitionTurret: HTMLImageElement;
}
