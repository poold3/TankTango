import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription, finalize, timeout } from 'rxjs';
import { CreateRequest, JoinRequest } from 'src/app/requests';
import { StateService } from 'src/app/services/state.service';
import { Tank, TankType, TankTank, AssaultTank, ScoutTank, DemolitionTank, TankColors } from 'src/app/tank';
import { HttpClient } from '@angular/common/http';

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
  gamerName: string = "";
  tankSelection: Tank = {
    type: TankType.None,
    health: 0,
    speed: 0,
    fireRate: 0,
    width: 0,
    length: 0,
    positionX: 0,
    positionY: 0,
    heading: 0.0,
    turretHeading: 0.0,
    color: TankColors.None
  }

  constructor(private readonly stateService: StateService, private readonly http: HttpClient) {
    this.stateService.addSlice("showInstructions", false);
    this.stateService.addSlice("gamerName", this.gamerName);
    this.stateService.addSlice("tankSelection", this.tankSelection);
    this.subscriptions.push(
      this.stateService.select<boolean>("showInstructions").subscribe((showInstructions: boolean): void => {
        this.showInstructions = showInstructions;
      }),
      this.stateService.select<string>("gamerName").subscribe((gamerName: string): void => {
        this.gamerName = gamerName;
      }),
      this.stateService.select<Tank>("tankSelection").subscribe((tankSelection: Tank): void => {
        this.tankSelection = tankSelection;
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
  }

  setTankSelection(tank: number): void {
    if (tank == TankType.Tank) {
      this.stateService.dispatch("tankSelection", (initialState: Tank): Tank => {
        return TankTank;
      });
    } else if (tank == TankType.Assault) {
      this.stateService.dispatch("tankSelection", (initialState: Tank): Tank => {
        return AssaultTank;
      });
    } else if (tank == TankType.Scout) {
      this.stateService.dispatch("tankSelection", (initialState: Tank): Tank => {
        return ScoutTank;
      });
    } else if (tank == TankType.Demolition) {
      this.stateService.dispatch("tankSelection", (initialState: Tank): Tank => {
        return DemolitionTank;
      });
    }
  }

  verifyReadyToPlay(): boolean {
    if (this.gamerName.trim().length === 0) {
      return false;
    }
    if (this.tankSelection.type === TankType.None) {
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
      tankType: this.tankSelection.type
    }
    const body = JSON.stringify(request);
    this.http.post("https://localhost:3000/create/", body, { headers, responseType: "json" })
    .pipe(
      timeout(10000),
      finalize(() => {
        this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
          return false;
        });
      })
    )
    .subscribe({
      next: (response) => {
        console.log(response);
        this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
          return true;
        });
      },
      error: (error) => {
        console.log(error);
        window.alert("Error: " + error.message);
      }
    });
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

    this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
      return true;
    });
    const headers = { 'content-type': 'application/json' };
    const request: JoinRequest = {
      gamerName: this.gamerName,
      tankType: this.tankSelection.type,
      gameCode: gameCode
    }
    const body = JSON.stringify(request);
    this.http.post("https://localhost:3000/join/", body, { headers, responseType: "json" })
    .pipe(
      timeout(10000),
      finalize(() => {
        this.stateService.dispatch<boolean>("isLoading", (initialState: boolean): boolean => {
          return false;
        });
      })
    )
    .subscribe({
      next: (response) => {
        console.log(response);
        this.stateService.addSlice("gameCode", gameCode);
        this.stateService.dispatch<boolean>("showMenu", (initialState: boolean): boolean => {
          return true;
        });
      },
      error: (error) => {
        console.log(error);
        window.alert("Error: " + error.message);
      }
    });
    
  }
 }
