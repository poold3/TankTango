import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, catchError, finalize, of, switchMap, timeout } from 'rxjs';
import { CreateRequest, JoinRequest } from 'src/app/requests';
import { StateService } from 'src/app/services/state.service';
import { ServerTank, TankType, TankTank, AssaultTank, ScoutTank, DemolitionTank, TankColors } from 'src/app/tank';
import { HttpClient } from '@angular/common/http';
import { CreateResponse, JoinResponse } from 'src/app/responses';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements AfterViewInit, OnDestroy {
  showInstructions: boolean = false;
  subscriptions: Subscription[] = new Array<Subscription>();
  @ViewChild("gamerNameInput") gamerNameInput!: ElementRef;
  gamerNameInputElement!: HTMLInputElement;
  gamerName!: string;
  tankSelection: TankType = TankType.None;
  createGame$ = new Subject<Observable<CreateResponse>>();
  joinGame$ = new Subject<Observable<JoinResponse>>();


  constructor(private readonly stateService: StateService, private readonly http: HttpClient, private readonly gameService: GameService) {
    this.stateService.addSlice("showInstructions", false);
    
    this.subscriptions.push(
      this.stateService.select<boolean>("showInstructions").subscribe((showInstructions: boolean): void => {
        this.showInstructions = showInstructions;
      }),
      this.stateService.select<string>("gamerName").subscribe((gamerName: string): void => {
        this.gamerName = gamerName;
      }),
      this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
        this.tankSelection = tankSelection.type;
      }),
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
          this.enterWaitingRoom();
        } else {
          window.alert(response.message);
        }
      }),
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
          this.enterWaitingRoom();
        } else {
          window.alert(response.message);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.gamerNameInputElement = this.gamerNameInput.nativeElement;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  updateGamerName() {
    this.stateService.dispatch("gamerName", (gamerName: string): string => {
      return this.gamerNameInputElement.value;
    });
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        gamerName: this.gamerNameInputElement.value
      };
    });
  }

  setTankSelection(tank: number): void {
    if (tank == TankType.Tank) {
      this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
        return {
          ...initialState,
          type: TankType.Tank
        };
      });
    } else if (tank == TankType.Assault) {
      this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
        return {
          ...initialState,
          type: TankType.Assault
        };
      });
    } else if (tank == TankType.Scout) {
      this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
        return {
          ...initialState,
          type: TankType.Scout
        };
      });
    } else if (tank == TankType.Demolition) {
      this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
        return {
          ...initialState,
          type: TankType.Demolition
        };
      });
    }
  }

  verifyReadyToPlay(): boolean {
    if (this.gamerName.trim().length === 0) {
      return false;
    }
    if (this.tankSelection === TankType.None) {
      return false;
    }

    return true;
  }

  createGame(): void {
    if (!this.verifyReadyToPlay()) {
      window.alert("Please enter a name and select a tank to continue.");
      return;
    }

    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: CreateRequest = {
      gamerName: this.gamerName,
      tankType: this.tankSelection
    }
    const body = JSON.stringify(request);
    this.createGame$.next(this.http.post<CreateResponse>("https://localhost:3000/create/", body, { headers, responseType: "json" }));
  }

  joinGame(): void {
    if (!this.verifyReadyToPlay()) {
      window.alert("Please enter a name and select a tank to continue.");
      return;
    }

    const gameCode = window.prompt("Please provide a valid game code.");

    if (gameCode === null) {
      return;
    } else if (gameCode.trim().length !== 6) {
      window.alert("Invalid game code.")
      return;
    }

    this.stateService.dispatch<string>("gameCode", (initialState: string): string => {
      return gameCode;
    });

    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: JoinRequest = {
      gamerName: this.gamerName,
      tankType: this.tankSelection,
      gameCode: gameCode
    }
    const body = JSON.stringify(request);
    this.joinGame$.next(this.http.post<JoinResponse>("https://localhost:3000/join/", body, { headers, responseType: "json" })); 
  }

  enterWaitingRoom(): void {
    this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
      return false;
    });
    this.stateService.dispatch<boolean>("showWaitingRoom", (initialState: boolean): boolean => {
      return true;
    });
    this.gameService.connect();
  }
 }
