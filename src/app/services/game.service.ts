import { Injectable } from '@angular/core';
import { StateService } from './state.service';
import { EmptyTank, ServerTank, TankColors, TankType } from '../tank';
import { CreateResponse, JoinResponse, StartRoundResponse } from '../responses';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, timeout } from 'rxjs';
import { CreateRequest, JoinRequest, StartRoundRequest } from '../requests';
import { HttpClient } from '@angular/common/http';

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
  createGame$: Subject<Observable<CreateResponse>> = new Subject<Observable<CreateResponse>>;
  joinGame$: Subject<Observable<JoinResponse>> = new Subject<Observable<JoinResponse>>;
  startRound$: Subject<Observable<StartRoundResponse>> = new Subject<Observable<StartRoundResponse>>;

  constructor(private readonly stateService: StateService, private readonly http: HttpClient) {
    this.stateService.addSlice("gamerName", this.gamerName);
    this.stateService.addSlice("tankSelection", this.tankSelection);
    this.stateService.addSlice("gameCode", this.gameCode);
    this.stateService.addSlice("port", this.port);
    this.stateService.addSlice("serverTanks", this.serverTanks);
    this.stateService.addSlice("maze", this.maze);

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
      if (this.tankSelection.color === TankColors.None) {
        for (const tank of this.serverTanks) {
          if (tank.gamerName === this.tankSelection.gamerName) {
            this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
              return {
                ...initialState,
                color: tank.color
              };
            });
            break;
          }
        }
      }
    });
    this.stateService.select<Maze>("maze").subscribe((maze: Maze): void => {
      this.maze = maze;
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
        this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
          return false;
        });
        this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
          return true;
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
        this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
          return false;
        });
        this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
          return true;
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

  getFirstMessage(serverTank: ServerTank): WssMessage {
    const firstMessage: WssMessage = {
      messageType: MessageTypes.First,
      tank: serverTank
    }
    return firstMessage;
  }

  getGameMessage(serverTank: ServerTank): WssMessage {
    const gameMessage: WssMessage = {
      messageType: MessageTypes.Game,
      tank: serverTank
    }
    return gameMessage;
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
    if (this.gamerName.trim().length === 0 || this.tankSelection.type === TankType.None ||
     this.tankSelection.gamerName !== this.gamerName || this.gameCode.length === 0 || this.port === -1) {
      window.alert("Unable to connect to game. Please retry later.");
      return;
    }

    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });

    this.socket = new WebSocket("wss://localhost:" + this.port.toString());
    this.socket.onopen = () => {
      console.log("Connected to waiting room!");

      this.socket.onmessage = (event) => {
        const message: WssInMessage = JSON.parse(event.data);
        if (message.tanks) {
          const serverTanks: Array<ServerTank> = message.tanks;
          this.stateService.dispatch("serverTanks", (initialState: Array<ServerTank>): Array<ServerTank> => {
            return serverTanks;
          });
        } else if (message.maze) {
          const maze: Maze = message.maze;
          this.stateService.dispatch("maze", (initialState: Maze): Maze => {
            return maze;
          });
          this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
            return false;
          });
          this.stateService.dispatch<boolean>("showGameRoom", (initialState: boolean): boolean => {
            return true;
          });
        }
      }

      this.socket.send(JSON.stringify(this.getFirstMessage(this.tankSelection)));
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
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        type: type
      };
    });
    this.socket.send(JSON.stringify(this.getFirstMessage(this.tankSelection)));
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
    this.socket.close();
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
}

export enum MessageTypes {
  First,
  Game
}

export interface WssMessage {
  messageType: MessageTypes,
  tank: ServerTank
}

export interface WssInMessage {
  tanks: Array<ServerTank> | undefined,
  maze: Maze | undefined
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