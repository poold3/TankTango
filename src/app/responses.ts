import { Bullet, FromServerBullet } from "./bullet";
import { ServerTank } from "./tank";

export interface CreateResponse {
  success: boolean;
  message: string;
  gameCode: string;
}

export interface JoinResponse {
  success: boolean;
  message: string;
}

export enum WssInMessageTypes {
  Maze,
  GameUpdate,
  SelectedTankUpdate,
  GameStateUpdate,
  PlayAudio,
  NewChatMessage,
  Error
}

export interface WssInMessage {
  messageType: WssInMessageTypes,
  data: string
}

export interface GameUpdateData {
  tanks: Array<ServerTank>,
  bullets: Array<FromServerBullet>
}