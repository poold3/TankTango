import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CanvasService } from 'src/app/services/canvas.service';
import { StateService } from 'src/app/services/state.service';
import { ServerTank } from 'src/app/tank';

@Component({
  selector: 'app-gameroom',
  templateUrl: './gameroom.component.html',
  styleUrls: ['./gameroom.component.css']
})
export class GameroomComponent implements OnInit, OnDestroy {
  subscriptions: Array<Subscription> = new Array<Subscription>();
  serverTanks!: Array<ServerTank>;

  constructor(private readonly stateService: StateService, private readonly canvasService: CanvasService) { }

  ngOnInit(): void {
    this.subscriptions.length = 0;
    this.subscriptions.push(
      this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
        this.serverTanks = serverTanks;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }
}
