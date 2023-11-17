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
  constructor(private readonly stateService: StateService) {
    this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
      this.serverTanks = serverTanks;
      console.log(this.serverTanks);
    });
  }

}
