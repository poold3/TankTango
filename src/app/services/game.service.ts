import { Injectable } from '@angular/core';
import { StateService } from './state.service';
import { EmptyTank, ServerTank, TankColors, TankType } from '../tank';
import { CreateResponse, JoinResponse, StartRoundResponse, WssInMessage, WssInMessageTypes } from '../responses';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, timeout } from 'rxjs';
import { CreateRequest, JoinRequest, StartRoundRequest, WssOutMessage, WssOutMessageTypes } from '../requests';
import { HttpClient } from '@angular/common/http';
import { CanvasService } from './canvas.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  gamerName: string = "";
  tankSelection: ServerTank = JSON.parse(JSON.stringify(EmptyTank));
  gameCode: string = "";
  port: number = -1;
  serverTanks: Array<ServerTank> = new Array<ServerTank>();
  socket!: WebSocket;
  maze: Maze = JSON.parse(JSON.stringify(EmptyMaze));
  state: GameState = GameState.Waiting;
  createGame$: Subject<Observable<CreateResponse>> = new Subject<Observable<CreateResponse>>;
  joinGame$: Subject<Observable<JoinResponse>> = new Subject<Observable<JoinResponse>>;
  startRound$: Subject<Observable<StartRoundResponse>> = new Subject<Observable<StartRoundResponse>>;

  constructor(private readonly stateService: StateService, private readonly http: HttpClient, private readonly canvasService: CanvasService) {
    this.stateService.addSlice("gamerName", this.gamerName);
    this.stateService.addSlice("tankSelection", this.tankSelection);
    this.stateService.addSlice("gameCode", this.gameCode);
    this.stateService.addSlice("port", this.port);
    this.stateService.addSlice("serverTanks", this.serverTanks);
    this.stateService.addSlice("maze", this.maze);
    this.stateService.addSlice("state", this.state);

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
    this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showGameRoom", (initialState: boolean): boolean => {
      return true;
    });
    
    this.canvasService.loadMazeInfo(this.maze);
    this.canvasService.clearMazeField();
    this.canvasService.drawMaze();
    this.canvasService.drawTanks(this.tankSelection, this.serverTanks);
  }

  startRunning() {

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