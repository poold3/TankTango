import { Injectable } from '@angular/core';
import { EmptyMaze, Maze, Room } from './game.service';
import { AssaultTank, DemolitionTank, EmptyTank, ScoutTank, ServerTank, TankTank, TankType } from '../tank';
import { Bullet, BulletInfo } from '../bullet';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  backgroundImage: HTMLImageElement;
  maze: Maze = JSON.parse(JSON.stringify(EmptyMaze));
  mazeStartX: number = 0;
  mazeStartY: number = 0;
  mazeRooms: Array<Array<Room>> = new Array<Array<Room>>();
  bullets: Array<Bullet> = new Array<Bullet>();
  serverTanks: Array<ServerTank> = new Array<ServerTank>();
  tankSelection: ServerTank = JSON.parse(JSON.stringify(EmptyTank));
  images!: TankImages;
  downArrowImage!: HTMLImageElement;
  gamerNameLengths = new Map<string, number>();

  constructor(private readonly stateService: StateService) {
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

  loadSubscriptions() {
    this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
      this.tankSelection = tankSelection;
    });
    this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
      this.serverTanks = serverTanks;
    });
    this.stateService.select<Array<Bullet>>("bullets").subscribe((bullets: Array<Bullet>): void => {
      this.bullets = bullets;
    });
    this.stateService.select<Maze>("maze").subscribe((maze: Maze): void => {
      this.maze = maze;
      this.mazeStartX = (this.canvasElement.width - maze.width) / 2;
      this.mazeStartY = 50;
      this.mazeRooms = maze.rooms;
    });
  }

  setBackground(imageSrc: string): void {
    this.backgroundImage.src = imageSrc;
  }

  drawBackgroundImage(): void {
    this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  loadGamerNameInfo(serverTanks: Array<ServerTank>) {
    this.ctx.font = "20px";
    serverTanks.forEach((tank: ServerTank) => {
      this.gamerNameLengths.set(tank.gamerName, this.ctx.measureText(tank.gamerName).width);
    });
  }

  getMazeStartX() {
    return this.mazeStartX;
  }

  getMazeStartY() {
    return this.mazeStartY;
  }

  clearMazeField() {
    this.ctx.clearRect(this.mazeStartX - 25, this.mazeStartY - 25, this.maze.width + 50, this.maze.height + 50);
  }

  drawMaze() {
    // Draw maze background
    this.ctx.fillStyle = "#e7e7e7";
    this.ctx.fillRect(this.mazeStartX - 25, this.mazeStartY - 25, this.maze.width + 50, this.maze.height + 50);

    // Draw maze walls
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.mazeStartX, this.mazeStartY, this.maze.width, this.maze.height);

    
    // Draw maze edges
    this.ctx.beginPath();
    for (let i = 0; i < this.maze.numRoomsHigh; ++i) {
      for (let j = 0; j < this.maze.numRoomsWide; ++j) {
        const room: Room = this.mazeRooms[i][j];
        if (room.minusX) {
          this.ctx.moveTo(this.mazeStartX + (j * this.maze.step), this.mazeStartY + (i * this.maze.step));
          this.ctx.lineTo(this.mazeStartX + (j * this.maze.step), this.mazeStartY + (i * this.maze.step) + this.maze.step);
        }
        if (room.plusX) {
          this.ctx.moveTo(this.mazeStartX + (j * this.maze.step) + this.maze.step, this.mazeStartY + (i * this.maze.step));
          this.ctx.lineTo(this.mazeStartX + (j * this.maze.step) + this.maze.step, this.mazeStartY + (i * this.maze.step) + this.maze.step);
        }
        if (room.minusY) {
          this.ctx.moveTo(this.mazeStartX + (j * this.maze.step), this.mazeStartY + (i * this.maze.step));
          this.ctx.lineTo(this.mazeStartX + (j * this.maze.step) + this.maze.step, this.mazeStartY + (i * this.maze.step));
        }
        if (room.plusY) {
          this.ctx.moveTo(this.mazeStartX + (j * this.maze.step), this.mazeStartY + (i * this.maze.step) + this.maze.step);
          this.ctx.lineTo(this.mazeStartX + (j * this.maze.step) + this.maze.step, this.mazeStartY + (i * this.maze.step) + this.maze.step);
        }
      }
    }
    this.ctx.stroke();
  }

  drawTanks() {
    this.serverTanks.forEach((tank: ServerTank) => {
      let tankToDraw: ServerTank;
      let isSelectedTank: boolean = false;
      if (tank.gamerName !== this.tankSelection.gamerName) {
        tankToDraw = tank;
        if (tankToDraw.type === TankType.Scout && tankToDraw.ultimateActive) {
          return;
        }
      } else {
        
        if (tank.alive !== this.tankSelection.alive) {
          this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
            return {
              ...initialState,
              alive: tank.alive
            }
          });
        }
        tankToDraw = this.tankSelection;
        isSelectedTank = true;
      }

      if (!tankToDraw.alive) {
        return;
      }

      const tankWidth = this.getTankWidthByType(tankToDraw.type);
      const tankLength = this.getTankLengthByType(tankToDraw.type);
      this.ctx.fillStyle = "black";
      if (!isSelectedTank) {
        let nameLength = this.gamerNameLengths.get(tankToDraw.gamerName);
        if (nameLength) {
          this.ctx.fillText(tankToDraw.gamerName, (tankToDraw.positionX + this.mazeStartX) - (nameLength / 2.0), (tankToDraw.positionY + this.mazeStartY) - 30);
        }
      }
      
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX), (tankToDraw.positionY + this.mazeStartY));
      this.ctx.rotate((tankToDraw.heading * Math.PI / 180.0) * -1.0);
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX) * -1.0, (tankToDraw.positionY + this.mazeStartY) * -1.0);
      this.ctx.drawImage(this.getTankBodyByType(tankToDraw.type), (tankToDraw.positionX + this.mazeStartX) - (tankLength * 0.375), (tankToDraw.positionY + this.mazeStartY) - (tankWidth * 0.375), tankLength * 0.75, tankWidth * 0.75);
      if (isSelectedTank) {
        this.ctx.drawImage(this.downArrowImage, (tankToDraw.positionX + this.mazeStartX) - (tankLength * 0.375) + (tankLength / 2.0 + 10), (tankToDraw.positionY + this.mazeStartY) - 12);
      }

      this.ctx.translate((tankToDraw.positionX + this.mazeStartX), (tankToDraw.positionY + this.mazeStartY));
      this.ctx.rotate(((tankToDraw.turretHeading - tankToDraw.heading) * Math.PI / 180.0) * -1.0);
      this.ctx.translate((tankToDraw.positionX + this.mazeStartX) * -1.0, (tankToDraw.positionY + this.mazeStartY) * -1.0);
      this.ctx.drawImage(this.getTankTurretByType(tankToDraw.type), (tankToDraw.positionX + this.mazeStartX) - (tankLength * 0.375), (tankToDraw.positionY + this.mazeStartY) - (tankWidth * 0.375), tankLength * 0.75, tankWidth * 0.75);
      this.ctx.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
    });
  }

  drawBullets() {
    this.ctx.fillStyle = "black";
    this.bullets.forEach((bullet: Bullet) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.bullet.positionX + this.mazeStartX, bullet.bullet.positionY + this.mazeStartY, BulletInfo.radius, 0, 2 * Math.PI);
      this.ctx.fill();
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
