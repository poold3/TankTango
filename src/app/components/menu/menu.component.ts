import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/services/state.service';
import { Tank, TankType, TankTank, AssaultTank, ScoutTank, DemolitionTank, TankColors } from 'src/app/tank';

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

  constructor(private readonly stateService: StateService) {
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
}
