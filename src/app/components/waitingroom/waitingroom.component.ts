import { Component } from '@angular/core';
import { StateService } from 'src/app/services/state.service';
import { ServerTank } from 'src/app/tank';

@Component({
  selector: 'app-waitingroom',
  templateUrl: './waitingroom.component.html',
  styleUrls: ['./waitingroom.component.css']
})
export class WaitingroomComponent  {
  serverTanks: Array<ServerTank> = new Array();
  gameCode: string = "";
  tankSelection!: ServerTank;
  gameAdmin: boolean = false;

  constructor(private readonly stateService: StateService) {
    this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
      this.serverTanks = serverTanks;
      for (const tank of this.serverTanks){
        if (tank.gameAdmin && tank.gamerName == this.tankSelection.gamerName) {
          this.gameAdmin = true;
          break;
        }
      }
    });
    this.stateService.select<string>("gameCode").subscribe((gameCode: string): void => {
      this.gameCode = gameCode;
    });
    this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
      this.tankSelection = tankSelection;
    });
  }

}
