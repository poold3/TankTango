import { Injectable } from '@angular/core';
import { StateService } from './state.service';
import { AssaultTank, DemolitionTank, EmptyTank, ScoutTank, ServerTank, TankInfo, TankTank, TankType } from '../tank';
import { CreateResponse, JoinResponse, StartRoundResponse, WssInMessage, WssInMessageTypes } from '../responses';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, timeout } from 'rxjs';
import { CreateRequest, JoinRequest, StartRoundRequest, WssOutMessage, WssOutMessageTypes } from '../requests';
import { HttpClient } from '@angular/common/http';
import { CanvasService } from './canvas.service';
import { Point, rotatePoint } from '../point';
import { Line } from '../line';
import { Bullet, BulletInfo, ServerBullet } from '../bullet';
import {v4 as uuidv4} from 'uuid'

@Injectable({
  providedIn: 'root'
})
export class GameService {
  gamerName: string = "";
  tankSelection: ServerTank = JSON.parse(JSON.stringify(EmptyTank));
  gameCode: string = "";
  port: number = -1;
  serverTanks: Array<ServerTank> = new Array<ServerTank>();
  bullets: Array<Bullet> = new Array<Bullet>();
  socket!: WebSocket;
  maze: Maze = JSON.parse(JSON.stringify(EmptyMaze));
  state: GameState = GameState.Waiting;
  createGame$: Subject<Observable<CreateResponse>> = new Subject<Observable<CreateResponse>>;
  joinGame$: Subject<Observable<JoinResponse>> = new Subject<Observable<JoinResponse>>;
  startRound$: Subject<Observable<StartRoundResponse>> = new Subject<Observable<StartRoundResponse>>;
  mousePositionX: number = 0;
  mousePositionY: number = 0;
  bulletsAvailable: number = 0;
  health: number = 0;
  moveState: MoveState = MoveState.None;
  turnState: TurnState = TurnState.None;
  ultimateAvailable: boolean = false;
  previousTime: number = 0;
  mazeStartX: number = 0;
  mazeStartY: number = 0;
  stopMovement: StopMovement = {
    PlusX: false,
    MinusX: false,
    PlusY: false,
    MinusY: false
  }
  tankReference: TankInfo = TankTank;
  animationRequest: number = 0;
  timeouts: Array<number> = new Array<number>();

  constructor(private readonly stateService: StateService, private readonly http: HttpClient, private readonly canvasService: CanvasService) {
    this.stateService.addSlice("gamerName", this.gamerName);
    this.stateService.addSlice("tankSelection", this.tankSelection);
    this.stateService.addSlice("gameCode", this.gameCode);
    this.stateService.addSlice("port", this.port);
    this.stateService.addSlice("serverTanks", this.serverTanks);
    this.stateService.addSlice("maze", this.maze);
    this.stateService.addSlice("state", this.state);
    this.stateService.addSlice("health", this.health);

    this.stateService.select<string>("gamerName").subscribe((gamerName: string): void => {
      this.gamerName = gamerName;
    });
    this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
      this.tankSelection = tankSelection;
    });
    this.stateService.select<string>("gameCode").subscribe((gameCode: string): void => {
      this.gameCode = gameCode;
    });
    this.stateService.select<number>("port").subscribe((port: number): void => {
      this.port = port;
    });
    this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
      this.serverTanks = serverTanks;
    });
    this.stateService.select<Maze>("maze").subscribe((maze: Maze): void => {
      this.maze = maze;
    });
    this.stateService.select<GameState>("state").subscribe((state: GameState): void => {
      this.state = state;
    });
    this.stateService.select<number>("health").subscribe((health: number): void => {
      this.health = health;
    });
    this.createGame$.pipe(
      switchMap((response: Observable<CreateResponse>) => response.pipe(
        timeout(10000),
        finalize(() => {
          this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
            return false;
          });
        }),
        catchError(error => {
          console.error(error);
          window.alert(error.message);
          return EMPTY;
        })
      ))
    ).subscribe((response: CreateResponse) => {
      if (response.success) {
        console.log(response);
        this.stateService.dispatch<string>("gameCode", (initialState: string): string => {
          return response.gameCode;
        });
        this.stateService.dispatch<number>("port", (initialState: number): number => {
          return response.port;
        });
        this.connect();
      } else {
        window.alert(response.message);
      }
    });
    this.joinGame$.pipe(
      switchMap((response: Observable<JoinResponse>) => response.pipe(
        timeout(10000),
        finalize(() => {
          this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
            return false;
          });
        }),
        catchError(error => {
          console.error(error);
          window.alert(error.message);
          return EMPTY;
        })
      ))
    ).subscribe((response: JoinResponse) => {
      if (response.success) {
        console.log(response);
        this.stateService.dispatch<number>("port", (initialState: number): number => {
          return response.port;
        });
        this.connect();
      } else {
        window.alert(response.message);
      }
    });
    this.startRound$.pipe(
      switchMap((response: Observable<StartRoundResponse>) => response.pipe(
        timeout(10000),
        finalize(() => {
          if (this.state !== GameState.Countdown) {
            this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
              return false;
            });
          }
        }),
        catchError(error => {
          console.error(error);
          window.alert(error.message);
          return EMPTY;
        })
      ))
    ).subscribe((response: StartRoundResponse) => {
      if (response.success) {
        
      } else {
        window.alert("Failed to start round. " + response.message);
      }
    });
  }

  createGame() {
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: CreateRequest = {
      gamerName: this.gamerName,
      tankType: this.tankSelection.type
    }
    const body = JSON.stringify(request);
    this.createGame$.next(this.http.post<CreateResponse>("https://localhost:3000/create/", body, { headers, responseType: "json" }));
  }

  joinGame() {
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: JoinRequest = {
      gamerName: this.gamerName,
      tankType: this.tankSelection.type,
      gameCode: this.gameCode
    }
    const body = JSON.stringify(request);
    this.joinGame$.next(this.http.post<JoinResponse>("https://localhost:3000/join/", body, { headers, responseType: "json" })); 
  }

  connect() {
    // Double check credentials
    if (this.gamerName.trim().length === 0 || this.tankSelection.type === TankType.None ||
     this.tankSelection.gamerName !== this.gamerName || this.gameCode.length === 0 || this.port === -1) {
      window.alert("Unable to connect to game. Please retry later.");
      return;
    }

    this.showWaitingRoom();

    // Begin loading
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });

    // Connect to websocket
    this.socket = new WebSocket("wss://localhost:" + this.port.toString());
    this.socket.onopen = () => {

      this.socket.onmessage = (event) => {
        const message: WssInMessage = JSON.parse(event.data);
        if (message.messageType == WssInMessageTypes.TanksUpdate) {
          const serverTanks: Array<ServerTank> = JSON.parse(message.data);
          this.stateService.dispatch("serverTanks", (initialState: Array<ServerTank>): Array<ServerTank> => {
            return serverTanks;
          });
        } else if (message.messageType == WssInMessageTypes.NewBullet) {
          const newBullet: ServerBullet = JSON.parse(message.data);
          this.bullets.push(new Bullet(newBullet.id, newBullet.positionX, newBullet.positionY, newBullet.heading, newBullet.demolition));
        } else if (message.messageType == WssInMessageTypes.EraseBullet) {
          const bulletId: string = JSON.parse(message.data);
          for (let i = 0; i < this.bullets.length; ++i) {
            if (this.bullets[i].id === bulletId) {
              this.bullets.splice(i, 1);
              break;
            }
          }
        } else if (message.messageType == WssInMessageTypes.Maze) {
          const maze: Maze = JSON.parse(message.data);
          this.stateService.dispatch("maze", (initialState: Maze): Maze => {
            return maze;
          });
        } else if (message.messageType == WssInMessageTypes.GameStateUpdate) {
          const newState: GameState = JSON.parse(message.data);
          this.stateService.dispatch("state", (initialState: GameState): GameState => {
            return newState;
          });

          // Handle changes in game state
          if (this.state === GameState.Waiting) {
            this.showWaitingRoom();
          } else if (this.state === GameState.Countdown) {
            this.startCountdown();
          } else if (this.state === GameState.Running) {
            this.startRunning();
          }
        } else if (message.messageType == WssInMessageTypes.SelectedTankUpdate) {
          // Same as Tanks Update but we want to update our local selected tank as well
          const serverTanks: Array<ServerTank> = JSON.parse(message.data);
          this.stateService.dispatch("serverTanks", (initialState: Array<ServerTank>): Array<ServerTank> => {
            return serverTanks;
          });
          for (let i = 0; i < serverTanks.length; ++i) {
            if (serverTanks[i].gamerName === this.gamerName) {
              this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
                return JSON.parse(JSON.stringify(serverTanks[i]));
              });
              break;
            }
          }
        } else if (message.messageType == WssInMessageTypes.Error) {
          const errorMessage: string = JSON.parse(message.data);
          console.error(errorMessage);
          window.alert("An error occurred. Please restart your game.");
          this.leaveGame();
        }
      }

      //Send our selected tank to the server
      const message: WssOutMessage = {
        messageType: WssOutMessageTypes.Connection,
        data: JSON.stringify(this.tankSelection)
      }
      this.socket.send(JSON.stringify(message));

      //Stop loading
      this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
        return false;
      });
    };

    this.socket.onerror = (error) => {
      console.error(error);
      window.alert("An error occurred. Please restart your game.");
      this.leaveGame();
    };
  }

  switchTanks(type: TankType) {
    // Begin loading
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });

    // Update tankSelection
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        type: type
      };
    });

    // Build message
    const message: WssOutMessage = {
      messageType: WssOutMessageTypes.WaitingRoomTankUpdate,
      data: JSON.stringify(this.tankSelection)
    }

    // Send message
    this.socket.send(JSON.stringify(message));

    // Stop loading
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return false;
    });
  }

  startRound() {
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: StartRoundRequest = {
      gameCode: this.gameCode
    }
    const body = JSON.stringify(request);
    this.startRound$.next(this.http.post<CreateResponse>("https://localhost:3000/startRound/", body, { headers, responseType: "json" }));
  }

  leaveGame() {
    // Close websocket connection
    this.socket.close();

    //Update all game variables
    this.stateService.dispatch("gamerName", (initialState: string): string => {
      return "";
    });
    this.stateService.dispatch("gameCode", (initialState: string): string => {
      return "";
    });
    this.stateService.dispatch("port", (initialState: number): number => {
      return -1;
    });
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return JSON.parse(JSON.stringify(EmptyTank));
    });
    this.stateService.dispatch("serverTanks", (initialState: Array<ServerTank>): Array<ServerTank> => {
      return new Array<ServerTank>();
    });
    this.stateService.dispatch("state", (initialState: GameState): GameState => {
      return GameState.Waiting;
    });
    this.stateService.dispatch("maze", (initialState: Maze): Maze => {
      return JSON.parse(JSON.stringify(EmptyMaze));
    });

    // Make sure we are not loading. Proceed to menu.
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showGameRoom", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
      return true;
    });
  }

  showWaitingRoom() {
    this.canvasService.setBackground("assets/menu_background.jpg");

    window.cancelAnimationFrame(this.animationRequest);
    this.timeouts.forEach((timeout: number) => {
      window.clearTimeout(timeout);
    });
    this.timeouts.length = 0;

    this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showGameRoom", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
      return true;
    });
  }

  startCountdown() {
    // Show proper display
    this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showGameRoom", (initialState: boolean): boolean => {
      return true;
    });
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    
    // Draw initial maze and tanks
    this.canvasService.loadMazeInfo(this.maze);
    this.canvasService.clearMazeField();
    this.canvasService.drawMaze();
    this.canvasService.drawTanks(this.tankSelection, this.serverTanks);

    //Initialize game parameters
    this.mazeStartX = this.canvasService.getMazeStartX();
    this.mazeStartY = this.canvasService.getMazeStartY();
    this.previousTime = 0;
    this.ultimateAvailable = true;
    this.moveState = MoveState.None;
    this.turnState = TurnState.None;
    this.bullets.length = 0;

    if (this.tankSelection.type === TankType.Tank) {
      this.tankReference = TankTank;
    } else if (this.tankSelection.type === TankType.Assault) {
      this.tankReference = AssaultTank;
    } else if (this.tankSelection.type === TankType.Scout) {
      this.tankReference = ScoutTank;
    } else if (this.tankSelection.type === TankType.Demolition) {
      this.tankReference = DemolitionTank;
    }
    this.bulletsAvailable = this.tankReference.fireRate;
    this.stateService.dispatch("health", (initialState: number): number => {
      return this.tankReference.health;
    });
  }

  startRunning() {
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return false;
    });

    this.animationRequest = window.requestAnimationFrame(this.animationFrame.bind(this));
  }

  animationFrame(timeStamp: number) {
    if (this.previousTime === 0) {
      this.previousTime = timeStamp;
    }
    const elapsed = timeStamp - this.previousTime;
    this.previousTime = timeStamp;

    const rotatedEdges: Array<Line> = this.calculateCollisions();

    // Move Tank
    if (this.moveState !== MoveState.None) {
      const speed = this.tankReference.speed * elapsed * 0.06;
      let horizontal = speed * Math.cos(this.tankSelection.heading * (Math.PI / 180.0));
      let vertical = speed * Math.sin(this.tankSelection.heading * (Math.PI / 180.0));
      
      if (this.moveState === MoveState.Forward) {
        vertical *= -1.0;
      } else if (this.moveState === MoveState.Backward) {
        horizontal *= -1.0;
      }

      // Account for stopMovement
      if ((horizontal > 0.0 && this.stopMovement.PlusX) || (horizontal < 0.0 && this.stopMovement.MinusX)) {
        horizontal = 0.0;
      }
      if ((vertical > 0.0 && this.stopMovement.PlusY) || (vertical < 0.0 && this.stopMovement.MinusY)) {
        vertical = 0.0;
      }

      this.tankSelection.positionX += horizontal;
      this.tankSelection.positionY += vertical;
    }

    // Turn Tank
    if (this.turnState !== TurnState.None) {
      if (this.turnState === TurnState.Right) {
        this.tankSelection.heading -= this.tankReference.turnSpeed;
        if (this.tankSelection.heading < 0.0) {
          this.tankSelection.heading += 360.0;
        }
      } else if (this.turnState === TurnState.Left) {
        this.tankSelection.heading += this.tankReference.turnSpeed;
        if (this.tankSelection.heading >= 360.0) {
          this.tankSelection.heading -= 360.0;
        }
      }

      if (this.stopMovement.MinusX) {
        this.tankSelection.positionX += this.tankReference.speed;
      } else if (this.stopMovement.PlusX) {
        this.tankSelection.positionX -= this.tankReference.speed;
      }
      if (this.stopMovement.MinusY) {
        this.tankSelection.positionY += this.tankReference.speed;
      } else if (this.stopMovement.PlusY) {
        this.tankSelection.positionY -= this.tankReference.speed;
      }
    }

    // Turn turret
    this.tankSelection.turretHeading = Math.atan2(((this.mousePositionY - this.mazeStartY) - this.tankSelection.positionY) * -1.0, (this.mousePositionX - this.mazeStartX) - this.tankSelection.positionX) * 180.0 / Math.PI;

    //Update bullet positions and collisions
    for (let i = 0; i < this.bullets.length; ++i) {
      // Remove bullet if timeout
      if (!this.bullets[i].isAlive()) {
        this.bullets.splice(i, 1);
        i -= 1;
        continue;
      }

      // Compute bounces
      const roomX = Math.floor(this.bullets[i].positionX / this.maze.step);
      const roomY = Math.floor(this.bullets[i].positionY / this.maze.step);
      const room: Room = this.maze.rooms[roomY][roomX];
      if (room.plusX && ((roomX + 1) * this.maze.step) - this.bullets[i].positionX <= BulletInfo.speed) {
        this.bullets[i].bounceX();
      } else if (room.minusX && this.bullets[i].positionX - (roomX * this.maze.step) <= BulletInfo.speed) {
        this.bullets[i].bounceX();
      }
      if (room.plusY && ((roomY + 1) * this.maze.step) - this.bullets[i].positionY <= BulletInfo.speed) {
        this.bullets[i].bounceY();
      } else if (room.minusY && this.bullets[i].positionY - (roomY * this.maze.step) <= BulletInfo.speed) {
        this.bullets[i].bounceY();
      }

      // Move the bullet
      this.bullets[i].move();

      // Is the bullet colliding with our tank
      if (this.bullets[i].isActive() && Math.sqrt(Math.pow(this.bullets[i].positionY - this.tankSelection.positionY, 2) + Math.pow(this.bullets[i].positionX - this.tankSelection.positionX, 2)) < this.tankReference.length && this.intersects(new Point(this.bullets[i].positionX, this.bullets[i].positionY), this.maze.step, rotatedEdges)) {
        //Send bulletId to server
        const message: WssOutMessage = {
          messageType: WssOutMessageTypes.EraseBullet,
          data: JSON.stringify(this.bullets[i].id)
        }
        this.socket.send(JSON.stringify(message));

        this.stateService.dispatch("health", (initialState: number): number => {
          return initialState - 1;
        });
        if (this.health === 0) {
          this.tankSelection.alive = false;
        }
      }
    }

    //Send our selected tank to the server
    const message: WssOutMessage = {
      messageType: WssOutMessageTypes.TankUpdate,
      data: JSON.stringify(this.tankSelection)
    }
    this.socket.send(JSON.stringify(message));

    // Draw
    this.canvasService.clearMazeField();
    this.canvasService.drawMaze();
    this.canvasService.drawTanks(this.tankSelection, this.serverTanks);
    this.canvasService.drawBullets(this.bullets);
    this.animationRequest = window.requestAnimationFrame(this.animationFrame.bind(this));
  }

  mouseMoveHandler = (event: MouseEvent) => {
    this.mousePositionX = event.clientX;
    this.mousePositionY = event.clientY;
  }

  mouseClickHandler = (event: MouseEvent) => {
    if (this.state === GameState.Running && this.bulletsAvailable > 0) {
      this.bulletsAvailable -= 1;
      console.log(this.bulletsAvailable);
      this.timeouts.push(window.setTimeout(() => {
        this.bulletsAvailable += 1;
      }, 4000));

      const positionX: number = this.tankSelection.positionX + this.tankReference.turretLength * Math.cos(this.tankSelection.turretHeading * Math.PI / -180.0);
      const positionY: number = this.tankSelection.positionY + this.tankReference.turretLength * Math.sin(this.tankSelection.turretHeading * Math.PI / -180.0);
      const demolition: boolean = (this.tankSelection.type === TankType.Demolition && this.tankSelection.ultimateActive);
      // Send new Bullet request
      const message: WssOutMessage = {
        messageType: WssOutMessageTypes.NewBullet,
        data: JSON.stringify(new ServerBullet(uuidv4(), positionX, positionY, this.tankSelection.turretHeading, demolition))
      }
      this.socket.send(JSON.stringify(message));
    }
  }

  keyDownHandler = (event: KeyboardEvent) => {
    if (this.state === GameState.Running) {
      if (event.code === "KeyW") {
        this.moveState = MoveState.Forward;
      } else if (event.code === "KeyS") {
        this.moveState = MoveState.Backward;
      } else if (event.code === "KeyD") {
        this.turnState = TurnState.Right;
      } else if (event.code === "KeyA") {
        this.turnState = TurnState.Left;
      } else if (event.code === "Space") {
        if (this.ultimateAvailable) {
          this.ultimateAvailable = false;
          this.tankSelection.ultimateActive = true;
          this.timeouts.push(window.setTimeout(() => {
            this.tankSelection.ultimateActive = false;
          }, 2000));
        }
      }
    }
  }

  keyUpHandler = (event: KeyboardEvent) => {
    if (this.state === GameState.Running) {
      if (event.code === "KeyW" && this.moveState === MoveState.Forward) {
        this.moveState = MoveState.None;
      } else if (event.code === "KeyS" && this.moveState === MoveState.Backward) {
        this.moveState = MoveState.None;
      } else if (event.code === "KeyD" && this.turnState === TurnState.Right) {
        this.turnState = TurnState.None;
      } else if (event.code === "KeyA" && this.turnState === TurnState.Left) {
        this.turnState = TurnState.None;
      }
    }
  }

  calculateCollisions(): Array<Line> {
    this.stopMovement.MinusX = false;
    this.stopMovement.PlusX = false;
    this.stopMovement.MinusY = false;
    this.stopMovement.PlusY = false;

    // Find nearest borders
    const nearestIntersectionX = Math.round(this.tankSelection.positionX / this.maze.step);
    const nearestIntersectionValueX = nearestIntersectionX * this.maze.step;
    const nearestIntersectionY = Math.round(this.tankSelection.positionY / this.maze.step);
    const nearestIntersectionValueY = nearestIntersectionY * this.maze.step;
    
    // Add nearest rooms
    let upperLeftRoom: Room | undefined = undefined;
    let lowerLeftRoom: Room | undefined = undefined;
    let upperRightRoom: Room | undefined = undefined;
    let lowerRightRoom: Room | undefined = undefined;
    if (nearestIntersectionY - 1 >= 0 && nearestIntersectionY - 1 < this.maze.numRoomsHigh && nearestIntersectionX - 1 >= 0 && nearestIntersectionX - 1 < this.maze.numRoomsWide) {
      upperLeftRoom = this.maze.rooms[nearestIntersectionY - 1][nearestIntersectionX - 1];
    }
    if (nearestIntersectionY >= 0 && nearestIntersectionY < this.maze.numRoomsHigh && nearestIntersectionX - 1 >= 0 && nearestIntersectionX - 1 < this.maze.numRoomsWide) {
      lowerLeftRoom = this.maze.rooms[nearestIntersectionY][nearestIntersectionX - 1];
    }
    if (nearestIntersectionY - 1 >= 0 && nearestIntersectionY - 1 < this.maze.numRoomsHigh && nearestIntersectionX >= 0 && nearestIntersectionX < this.maze.numRoomsWide) {
      upperRightRoom = this.maze.rooms[nearestIntersectionY - 1][nearestIntersectionX];
    }
    if (nearestIntersectionY >= 0 && nearestIntersectionY < this.maze.numRoomsHigh && nearestIntersectionX >= 0 && nearestIntersectionX < this.maze.numRoomsWide) {
      lowerRightRoom = this.maze.rooms[nearestIntersectionY][nearestIntersectionX];
    }

    //Rotate tank vertices
    const rotatedPoints: Array<Point> = new Array<Point>();
    const tankPoint: Point = new Point(this.tankSelection.positionX, this.tankSelection.positionY);
    for (let i = 0; i < this.tankReference.vertices.length; ++i) {
      const rotatedPoint: Point = rotatePoint(this.tankReference.vertices[i], this.tankReference.center, (this.tankSelection.heading - 90) * Math.PI / -180.0);
      rotatedPoints.push(rotatedPoint.subtract(this.tankReference.center).multiplyScalar(0.75).add(tankPoint));
    }

    // Build rotated edges
    const rotatedEdges: Array<Line> = new Array<Line>();
    for (let i = 0; i < rotatedPoints.length; ++i) {
      if (i < rotatedPoints.length - 1) {
        rotatedEdges.push(new Line(rotatedPoints[i], rotatedPoints[i + 1]));
      } else {
        rotatedEdges.push(new Line(rotatedPoints[i], rotatedPoints[0]));
      }
    }

    // Set corner signature
    let minusY = false;
    let plusY = false;
    let minusX = false;
    let plusX = false;

    if (upperLeftRoom) {
      if (upperLeftRoom.plusX) {
        minusY = true;
      }
      if (upperLeftRoom.plusY) {
        minusX = true;
      }
    }
    if (lowerLeftRoom) {
      if (lowerLeftRoom.plusX) {
        plusY = true;
      }
      if (lowerLeftRoom.minusY) {
        minusX = true;
      }
    }
    if (upperRightRoom) {
      if (upperRightRoom.minusX) {
        minusY = true;
      }
      if (upperRightRoom.plusY) {
        plusX = true;
      }
    }
    if (lowerRightRoom) {
      if (lowerRightRoom.minusX) {
        plusY = true;
      }
      if (lowerRightRoom.minusY) {
        plusX = true;
      }
    }

    // Compute stops on exposed intersection points
    if ((minusY || plusY || minusX || plusX) && this.intersects(new Point(nearestIntersectionValueX, nearestIntersectionValueY), this.maze.step, rotatedEdges)) {
      let headingToIntersection = Math.atan2((nearestIntersectionValueY - this.tankSelection.positionY) * -1.0, nearestIntersectionValueX - this.tankSelection.positionX) * 180.0 / Math.PI;
      if (headingToIntersection < 0.0) {
        headingToIntersection += 360.0;
      } else if (headingToIntersection >= 360.0) {
        headingToIntersection -= 360.0;
      }

      if (headingToIntersection > 0.0 && headingToIntersection < 180.0) {
        this.stopMovement.MinusY = true;
      } else if (headingToIntersection > 180.0 && headingToIntersection < 360.0) {
        this.stopMovement.PlusY = true;
      } else if (headingToIntersection == 0.0) {
        this.stopMovement.PlusX = true;
      } else if (headingToIntersection == 180.0) {
        this.stopMovement.MinusX = true;
      }

      if ((headingToIntersection >= 0.0 && headingToIntersection < 90.0) || (headingToIntersection > 270.0 && headingToIntersection < 360.0)) {
        this.stopMovement.PlusX = true;
      } else if (headingToIntersection > 90.0 && headingToIntersection < 270.0) {
        this.stopMovement.MinusX = true;
      }
    }

    const WALL_SPACE = 2;
    // Compute stops
    for (let i = 0; i < rotatedPoints.length; ++i) {
      if (minusY && !this.stopMovement.PlusX && !this.stopMovement.MinusX) {
        if (Math.abs(rotatedPoints[i].x - nearestIntersectionValueX) < WALL_SPACE && rotatedPoints[i].y < nearestIntersectionValueY) {
          if (this.tankSelection.positionX < nearestIntersectionValueX) {
            this.stopMovement.PlusX = true;
          } else {
            this.stopMovement.MinusX = true;
          }
        }
      }
      if (plusY && !this.stopMovement.PlusX && !this.stopMovement.MinusX) {
        if (Math.abs(rotatedPoints[i].x - nearestIntersectionValueX) < WALL_SPACE && rotatedPoints[i].y > nearestIntersectionValueY) {
          if (this.tankSelection.positionX < nearestIntersectionValueX) {
            this.stopMovement.PlusX = true;
          } else {
            this.stopMovement.MinusX = true;
          }
        }
      }
      if (minusX && !this.stopMovement.PlusY && !this.stopMovement.MinusY) {
        if (Math.abs(rotatedPoints[i].y - nearestIntersectionValueY) < WALL_SPACE && rotatedPoints[i].x < nearestIntersectionValueX) {
          if (this.tankSelection.positionY < nearestIntersectionValueY) {
            this.stopMovement.PlusY = true;
          } else {
            this.stopMovement.MinusY = true;
          }
        }
      }
      if (plusX && !this.stopMovement.PlusY && !this.stopMovement.MinusY) {
        if (Math.abs(rotatedPoints[i].y - nearestIntersectionValueY) < WALL_SPACE && rotatedPoints[i].x > nearestIntersectionValueX) {
          if (this.tankSelection.positionY < nearestIntersectionValueY) {
            this.stopMovement.PlusY = true;
          } else {
            this.stopMovement.MinusY = true;
          }
        }
      }
    }
    return rotatedEdges;
  }

  intersects(point: Point, lineLength: number, edges: Array<Line>): boolean {
    // Build intersection line
    const intersectionLine: Line = new Line(new Point(point.x, point.y), new Point(point.x + lineLength, point.y));

    // If the intersection point is inside or on the edges, correct tank position
    let intersections = 0;
    for (let i = 0; i < edges.length; ++i) {
      if (intersectionLine.p1.y == edges[i].p1.y && intersectionLine.p1.x <= edges[i].p1.x && edges[i].p1.x <= intersectionLine.p2.x) {
        intersections += 1;
      } else if (intersectionLine.p1.y == edges[i].p2.y && intersectionLine.p1.x <= edges[i].p2.x && edges[i].p2.x <= intersectionLine.p2.x) {
        intersections += 1;
      } else if ((intersectionLine.p1.y > edges[i].p1.y && intersectionLine.p1.y < edges[i].p2.y) || (intersectionLine.p1.y < edges[i].p1.y && intersectionLine.p1.y > edges[i].p2.y)) {
        const m = this.correctHeading(Math.atan2((edges[i].p1.y - edges[i].p2.y) * -1.0, edges[i].p1.x - edges[i].p2.x) * 180.0 / Math.PI);
        const m1 = this.correctHeading(Math.atan2((intersectionLine.p1.y - edges[i].p2.y) * -1.0, intersectionLine.p1.x - edges[i].p2.x) * 180.0 / Math.PI);
        const m2 = this.correctHeading(Math.atan2((intersectionLine.p2.y - edges[i].p2.y) * -1.0, intersectionLine.p2.x - edges[i].p2.x) * 180.0 / Math.PI);
        if ((m === m1 && m !== m2) || (m === m2 && m !== m1)) {
          intersections += 1;
        } else if ((m > m1 && m < m2) || (m < m1 && m > m2)) {
          intersections += 1;
        }
      }
    }

    return intersections % 2 === 1;
  }

  correctHeading(heading: number): number {
    if (heading < 0.0) {
      heading += 360.0;
    } else if (heading >= 360.0) {
      heading -= 360.0;
    }
    return heading;
  }

}

export interface Room {
  plusY: boolean;
  minusY: boolean;
  plusX: boolean;
  minusX: boolean;
  numEdges: number;
}

export interface Maze {
  width: number;
  height: number;
  step: number;
  numRoomsWide: number;
  numRoomsHigh: number;
  rooms: Array<Array<Room>>;
}

export const EmptyMaze: Maze = {
  width: 0,
  height: 0,
  step: 0,
  numRoomsWide: 0,
  numRoomsHigh: 0,
  rooms: new Array<Array<Room>>()
}

export const enum GameState {
  Waiting,
  Countdown,
  Running
}

export const enum MoveState {
  None,
  Forward,
  Backward
}

export const enum TurnState {
  None,
  Right,
  Left
}

export interface StopMovement {
  PlusX: boolean;
  MinusX: boolean;
  PlusY: boolean;
  MinusY: boolean;
}
