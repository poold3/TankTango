import { Component, OnDestroy } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { GameService } from 'src/app/services/game.service';
import { StateService } from 'src/app/services/state.service';
import { ServerTank, TankType } from 'src/app/tank';

@Component({
  selector: 'app-waitingroom',
  templateUrl: './waitingroom.component.html',
  styleUrls: ['./waitingroom.component.css']
})
export class WaitingroomComponent implements OnDestroy {
  subscriptions: Subscription[] = new Array<Subscription>();
  serverTanks: Array<ServerTank> = new Array();
  gameCode: string = "";
  tankSelection!: ServerTank;
  gameAdmin: boolean = false;
  showTankGuide: boolean = false;

  constructor(private readonly stateService: StateService, private clipboardService: ClipboardService, private readonly gameService: GameService) {
    this.subscriptions.push(
      this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
        this.tankSelection = tankSelection;
      }),
      this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
        this.serverTanks = serverTanks;
        for (const tank of this.serverTanks){
          if (tank.gameAdmin && tank.gamerName == this.tankSelection.gamerName) {
            this.gameAdmin = true;
            break;
          }
        }
      }),
      this.stateService.select<string>("gameCode").subscribe((gameCode: string): void => {
        this.gameCode = gameCode;
      })
    );
    
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  copyGameCode(): void {
    this.clipboardService.copyFromContent(this.gameCode);
  }

  setTankSelection(tankType: TankType) {
    this.gameService.switchTanks(tankType);
  }

  leaveGame() {
    this.gameAdmin = false;
    this.gameCode = "";
    this.showTankGuide = false;
    this.serverTanks.length = 0;
    this.gameService.leaveGame();
  }
}
