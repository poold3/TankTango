import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Subscription} from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { ServerTank, TankType } from 'src/app/tank';
import { HttpClient } from '@angular/common/http';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, AfterViewInit, OnDestroy {
  showInstructions: boolean = false;
  subscriptions: Subscription[] = new Array<Subscription>();
  @ViewChild("gamerNameInput") gamerNameInput!: ElementRef;
  gamerNameInputElement!: HTMLInputElement;
  tankSelection!: ServerTank;


  constructor(private readonly stateService: StateService, private readonly http: HttpClient, private readonly gameService: GameService) {
    this.stateService.addSlice("showInstructions", false);
  }

  ngOnInit(): void {
    this.subscriptions.length = 0;
    this.subscriptions.push(
      this.stateService.select<boolean>("showInstructions").subscribe((showInstructions: boolean): void => {
        this.showInstructions = showInstructions;
      }),
      this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
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
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        gamerName: this.gamerNameInputElement.value
      };
    });
  }

  verifyReadyToPlay(): boolean {
    if (this.tankSelection.gamerName.trim().length === 0) {
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
    this.gameService.createGame();
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
    this.gameService.joinGame();
  }
 }
