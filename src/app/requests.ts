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

export enum WssOutMessageTypes {
  Connection,
  WaitingRoomUpdate,
  TankUpdate,
  NewBullet,
  PlayAudio,
  NewChatMessage
}

export interface WssOutMessage {
  messageType: WssOutMessageTypes,
  data: string
}