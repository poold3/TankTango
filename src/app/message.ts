import { TankColors } from "./tank";

export class Message {
  public message: string;
  public gamerName: string;
  public color: TankColors

  constructor(message: string, gamerName: string, color: TankColors) {
    this.message = message;
    this.gamerName = gamerName;
    this.color = color;
  }
}