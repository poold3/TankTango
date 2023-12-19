export class ServerBullet {
  public id: string;
  public positionX: number;
  public positionY: number;
  public heading: number;
  public demolition: boolean;
  constructor(id: string, positionX: number, positionY: number, heading: number, demolition: boolean = false) {
    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
    this.heading = heading;
    this.demolition = demolition;
  }
}

export class Bullet {
  public id: string;
  public positionX: number;
  public positionY: number;

  constructor(id: string, positionX: number, positionY: number) {
    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
  }
}

export const BULLET_RADIUS: number = 2.0;