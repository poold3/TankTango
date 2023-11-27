import { Point } from "./point";

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
  score: number;
  ultimateActive: boolean;
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
  turnSpeed: number;
  fireRate: number;
  width: number;
  length: number;
  center: Point;
  vertices: Array<Point>;
}

export const TankTank: TankInfo = {
  type: TankType.Tank,
  health: 4,
  speed: 2,
  turnSpeed: 3,
  fireRate: 2,
  width: 39,
  length: 55,
  center: new Point(20, 28),
  vertices: new Array<Point>()
}
TankTank.vertices.push(new Point(5, 1));
TankTank.vertices.push(new Point(1, 13));
TankTank.vertices.push(new Point(1, 48));
TankTank.vertices.push(new Point(5, 55));
TankTank.vertices.push(new Point(35, 55));
TankTank.vertices.push(new Point(39, 48));
TankTank.vertices.push(new Point(39, 13));
TankTank.vertices.push(new Point(35, 1));

export const AssaultTank: TankInfo = {
  type: TankType.Assault,
  health: 2,
  speed: 2,
  turnSpeed: 3,
  fireRate: 4,
  width: 35,
  length: 49,
  center: new Point(18, 25),
  vertices: new Array<Point>()
}
AssaultTank.vertices.push(new Point(4, 1));
AssaultTank.vertices.push(new Point(1, 24));
AssaultTank.vertices.push(new Point(1, 31));
AssaultTank.vertices.push(new Point(5, 49));
AssaultTank.vertices.push(new Point(31, 49));
AssaultTank.vertices.push(new Point(35, 31));
AssaultTank.vertices.push(new Point(35, 24));
AssaultTank.vertices.push(new Point(32, 1));

export const ScoutTank: TankInfo = {
  type: TankType.Scout,
  health: 2,
  speed: 4,
  turnSpeed: 5,
  fireRate: 2,
  width: 31,
  length: 45,
  center: new Point(16, 23),
  vertices: new Array<Point>()
}
ScoutTank.vertices.push(new Point(5, 1));
ScoutTank.vertices.push(new Point(1, 43));
ScoutTank.vertices.push(new Point(5, 45));
ScoutTank.vertices.push(new Point(27, 45));
ScoutTank.vertices.push(new Point(31, 43));
ScoutTank.vertices.push(new Point(27, 1));

export const DemolitionTank: TankInfo = {
  type: TankType.Demolition,
  health: 3,
  speed: 3,
  turnSpeed: 4,
  fireRate: 2,
  width: 35,
  length: 49,
  center: new Point(18, 25),
  vertices: new Array<Point>()
}
DemolitionTank.vertices.push(new Point(4, 1));
DemolitionTank.vertices.push(new Point(1, 4));
DemolitionTank.vertices.push(new Point(1, 46));
DemolitionTank.vertices.push(new Point(4, 49));
DemolitionTank.vertices.push(new Point(32, 49));
DemolitionTank.vertices.push(new Point(35, 46));
DemolitionTank.vertices.push(new Point(35, 4));
DemolitionTank.vertices.push(new Point(32, 1));

export const EmptyTank: ServerTank = {
  gamerName: "",
  gameAdmin: false,
  alive: false,
  score: 0,
  ultimateActive: false,
  type: TankType.None,
  positionX: 0,
  positionY: 0,
  heading: 0.0,
  turretHeading: 0.0,
  color: TankColors.None
}