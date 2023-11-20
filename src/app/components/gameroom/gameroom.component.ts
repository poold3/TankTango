import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CanvasService } from 'src/app/services/canvas.service';
import { Maze } from 'src/app/services/game.service';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-gameroom',
  templateUrl: './gameroom.component.html',
  styleUrls: ['./gameroom.component.css']
})
export class GameroomComponent implements OnInit, OnDestroy {
  subscriptions: Array<Subscription> = new Array<Subscription>();
  maze!: Maze;

  constructor(private readonly stateService: StateService, private readonly canvasService: CanvasService) { }

  ngOnInit(): void {
    this.subscriptions.length = 0;
    this.subscriptions.push(
      this.stateService.select<Maze>("maze").subscribe((maze: Maze): void => {
        this.maze = maze;
        if (this.maze.width !== 0 && this.maze.height !== 0) {
          this.canvasService.drawMaze(this.maze);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }
}
