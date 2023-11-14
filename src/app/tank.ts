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

export interface Tank {
  type: TankType;
  health: number;
  speed: number;
  fireRate: number;
  width: number;
  length: number;
  positionX: number;
  positionY: number;
  heading: number;
  turretHeading: number;
  color: TankColors;
}

export const TankTank: Tank = {
  type: TankType.Tank,
  health: 4,
  speed: 2,
  fireRate: 2,
  width: 39,
  length: 55,
  positionX: 0,
  positionY: 0,
  heading: 0.0,
  turretHeading: 0.0,
  color: TankColors.None
}

export const AssaultTank: Tank = {
  type: TankType.Assault,
  health: 2,
  speed: 2,
  fireRate: 4,
  width: 35,
  length: 49,
  positionX: 0,
  positionY: 0,
  heading: 0.0,
  turretHeading: 0.0,
  color: TankColors.None
}

export const ScoutTank: Tank = {
  type: TankType.Scout,
  health: 2,
  speed: 4,
  fireRate: 2,
  width: 31,
  length: 45,
  positionX: 0,
  positionY: 0,
  heading: 0.0,
  turretHeading: 0.0,
  color: TankColors.None
}

export const DemolitionTank: Tank = {
  type: TankType.Demolition,
  health: 2,
  speed: 3,
  fireRate: 3,
  width: 35,
  length: 49,
  positionX: 0,
  positionY: 0,
  heading: 0.0,
  turretHeading: 0.0,
  color: TankColors.None
}