import { Injectable } from '@angular/core';
import { StateService } from './state.service';
import { EmptyTank, ServerTank, TankColors, TankType } from '../tank';

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

  constructor(private readonly stateService: StateService) {
    this.stateService.addSlice("gamerName", this.gamerName);
    this.stateService.addSlice("tankSelection", this.tankSelection);
    this.stateService.addSlice("gameCode", this.gameCode);
    this.stateService.addSlice("port", this.port);
    this.stateService.addSlice("serverTanks", this.serverTanks);

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
        const serverTanks: Array<ServerTank> = JSON.parse(event.data);
        this.stateService.dispatch("serverTanks", (initialState: Array<ServerTank>): Array<ServerTank> => {
          return serverTanks;
        });
      }

      this.socket.send(JSON.stringify(this.getFirstMessage(this.tankSelection)));
      this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
        return false;
      });
    };

    this.socket.onerror = (error) => {
      console.error(error);
      this.socket.close();
      window.alert("An error occurred. Please restart your game.");
      this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
        return false;
      });
      this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
        return false;
      });
      this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
        return true;
      });
    };
  }

  switchTanks(type: TankType) {
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    this.tankSelection.type = type;
    this.socket.send(JSON.stringify(this.getFirstMessage(this.tankSelection)));
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        type: type
      };
    });
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return false;
    });
  }

  leaveGame() {
    this.socket.close();
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return JSON.parse(JSON.stringify(EmptyTank));
    });
    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
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