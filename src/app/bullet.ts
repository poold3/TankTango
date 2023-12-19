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
  public bullet: FromServerBullet;

  constructor(bullet: FromServerBullet) {
    this.bullet = bullet;
  }

  public bounceX(): void {
    this.bullet.incrementX *= -1;
  }

  public bounceY(): void {
    this.bullet.incrementY *= -1;
  }

  public move(): void {
    if (!this.isActive()) {
      this.bullet.active -= 1;
    }
    this.bullet.positionX += this.bullet.incrementX;
    this.bullet.positionY += this.bullet.incrementY;
  }

  public isActive(): boolean {
    return this.bullet.active <= 0;
  }

  public isAlive(): boolean {
    return (Date.now() - this.bullet.startTime) < BulletInfo.timeAlive;
  }
}

export interface FromServerBullet {
  id: string;
  positionX: number;
  positionY: number;
  heading: number;
  incrementX: number;
  incrementY: number;
  active: number;
  demolition: boolean;
  startTime: number;
}

export interface BulletInfoInterface {
  speed: number;
  radius: number;
  inactivePeriod: number;
  timeAlive: number;
}

export const BulletInfo: BulletInfoInterface = {
  speed: 4,
  radius: 2,
  inactivePeriod: 3,
  timeAlive: 10000
}