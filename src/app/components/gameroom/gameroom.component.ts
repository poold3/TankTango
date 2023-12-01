import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameService } from 'src/app/services/game.service';
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
  health!: number;

  constructor(private readonly stateService: StateService, private readonly gameService: GameService) { }

  ngOnInit(): void {
    this.subscriptions.length = 0;
    this.subscriptions.push(
      this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
        this.serverTanks = serverTanks;
      }),
      this.stateService.select<number>("health").subscribe((health: number): void => {
        this.health = health;
      })
    );
    document.addEventListener("mousemove", this.gameService.mouseMoveHandler);
    document.addEventListener("mousedown", this.gameService.mouseClickHandler);
    document.addEventListener("keydown", this.gameService.keyDownHandler);
    document.addEventListener("keyup", this.gameService.keyUpHandler);
    document.body.style.cursor = "url('assets/crosshair.png') 16 16, pointer";
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
    document.removeEventListener("mousemove", this.gameService.mouseMoveHandler);
    document.removeEventListener("mousedown", this.gameService.mouseClickHandler);
    document.removeEventListener("keydown", this.gameService.keyDownHandler);
    document.removeEventListener("keyup", this.gameService.keyUpHandler);
    document.body.style.cursor = "default";
  }

  generateRange(num: number): Array<number> {
    return new Array(num);
  }
}
