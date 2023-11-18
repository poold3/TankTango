export enum TankColors {
  None,
  Blue,
  Green,
  Orange,
  Red
}

export enum TankType {
  None,
  Tank,
  Assault,
  Scout,
  Demolition
}

export interface ServerTank {
  gamerName: string;
  gameAdmin: boolean;
  type: TankType;
  alive: boolean;
  positionX: number;
  positionY: number;
  heading: number;
  turretHeading: number;
  color: TankColors;
}

export interface TankInfo {
  type: TankType;
  health: number;
  speed: number;
  fireRate: number;
  width: number;
  length: number;
}

export const TankTank: TankInfo = {
  type: TankType.Tank,
  health: 4,
  speed: 2,
  fireRate: 2,
  width: 39,
  length: 55
}

export const AssaultTank: TankInfo = {
  type: TankType.Assault,
  health: 2,
  speed: 2,
  fireRate: 4,
  width: 35,
  length: 49
}

export const ScoutTank: TankInfo = {
  type: TankType.Scout,
  health: 2,
  speed: 4,
  fireRate: 2,
  width: 31,
  length: 45
}

export const DemolitionTank: TankInfo = {
  type: TankType.Demolition,
  health: 3,
  speed: 3,
  fireRate: 2,
  width: 35,
  length: 49
}