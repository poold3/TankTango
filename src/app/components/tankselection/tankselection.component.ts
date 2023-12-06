import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameService, GameState } from 'src/app/services/game.service';
import { StateService } from 'src/app/services/state.service';
import { ServerTank } from 'src/app/tank';

@Component({
  selector: 'app-tankselection',
  templateUrl: './tankselection.component.html',
  styleUrls: ['./tankselection.component.css']
})
export class TankselectionComponent implements OnInit, OnDestroy {
  tankSelection!: ServerTank;
  state!: GameState;
  subscriptions: Subscription[] = new Array<Subscription>();
  @Output() closeTankGuide = new EventEmitter<void>();

  constructor(private readonly stateService: StateService, private readonly gameService: GameService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
        this.tankSelection = tankSelection;
      }),
      this.stateService.select<GameState>("state").subscribe((state: GameState): void => {
        this.state = state;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  setTankSelection(type: number): void {
    this.stateService.dispatch("tankSelection", (initialState: ServerTank): ServerTank => {
      return {
        ...initialState,
        type: type
      }
    });
    if (this.state === GameState.Waiting) {
      this.gameService.switchTanks();
      this.closeTankGuide.emit();
    }
  }

}
