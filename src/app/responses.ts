import { GameState, Maze } from "./services/game.service";
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
  TanksUpdate,
  SelectedTankUpdate,
  GameStateUpdate,
  NewBullet,
  EraseBullet,
  PlayAudio,
  Error
}

export interface WssInMessage {
  messageType: WssInMessageTypes,
  data: string
}