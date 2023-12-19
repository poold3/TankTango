import { Bullet } from "./bullet";
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

export interface StartRoundResponse {
  success: boolean;
  message: string;
}

export enum WssInMessageTypes {
  Maze,
  GameUpdate,
  SelectedTankUpdate,
  GameStateUpdate,
  PlayAudio,
  Error
}

export interface WssInMessage {
  messageType: WssInMessageTypes,
  data: string
}

export interface GameUpdateData {
  tanks: Array<ServerTank>,
  bullets: Array<Bullet>
}