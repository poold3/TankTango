import { ServerTank } from "./tank";

export interface CreateRequest {
  gamerName: string;
  tankType: number;
}

export interface JoinRequest {
  gamerName: string;
  tankType: number;
  gameCode: string;
}

export interface StartRoundRequest {
  gameCode: string;
}

export enum WssOutMessageTypes {
  Connection,
  WaitingRoomTankUpdate,
  TankUpdate,
  NewBullet,
  PlayAudio
}

export interface WssOutMessage {
  messageType: WssOutMessageTypes,
  data: string
}