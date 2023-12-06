import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CanvasService } from './services/canvas.service';
import { StateService } from './services/state.service';
import { Subscription } from 'rxjs';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild("canvas") canvas!: ElementRef;
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  showMenu: boolean = false;
  showWaitingRoom: boolean = false;
  showGameRoom: boolean = false;
  isLoading: boolean = true;
  subscriptions: Subscription[] = new Array<Subscription>();

  constructor(private readonly stateService: StateService, private readonly canvasService: CanvasService, private readonly audioService: AudioService) {
    this.stateService.addSlice("showMenu", this.showMenu);
    this.stateService.addSlice("showWaitingRoom", this.showWaitingRoom);
    this.stateService.addSlice("showGameRoom", this.showGameRoom);
    this.stateService.addSlice("isLoading", this.isLoading);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.stateService.select<boolean>("showMenu").subscribe((showMenu: boolean): void => {
        this.showMenu = showMenu;
      }),
      this.stateService.select<boolean>("showWaitingRoom").subscribe((showWaitingRoom: boolean): void => {
        this.showWaitingRoom = showWaitingRoom;
      }),
      this.stateService.select<boolean>("showGameRoom").subscribe((showGameRoom: boolean): void => {
        this.showGameRoom = showGameRoom;
      }),
      this.stateService.select<boolean>("isLoading").subscribe((isLoading: boolean): void => {
        this.isLoading = isLoading;
      })
    );
    this.audioService.addAudio("click", "assets/audio/click.mp3", false, 0.2);
    this.audioService.addAudio("boom", "assets/audio/boom-trimmed.mp3"), 0.01;
    this.audioService.addAudio("synth", "assets/audio/synth-chord.mp3", true, 0.05);
    this.audioService.addAudio("hit", "assets/audio/hit.mp3", false, 0.2);
    this.audioService.addAudio("ultimate", "assets/audio/ultimate.mp3", false, 0.2);
    this.audioService.addAudio("engine", "assets/audio/engine.mp3", false, 0.5);
    this.audioService.addAudio("start", "assets/audio/start.mp3", false, 0.1);
  }

  ngAfterViewInit(): void {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasService.loadCanvasElement(this.canvasElement);
    this.canvasService.setBackground("assets/menu_background.jpg");
    const ctxTemp = this.canvasElement.getContext("2d");
    if (ctxTemp) {
      this.ctx = ctxTemp;
    }

    window.addEventListener("resize", this.resizeCanvas.bind(this));
    this.resizeCanvas();
    window.setTimeout(() => {
      this.stateService.dispatch("showMenu", (showMenu: boolean): boolean => {
        return true;
      });
      this.stateService.dispatch("isLoading", (isLoading: boolean): boolean => {
        return false;
      });
    });
    
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
    this.subscriptions.length = 0;
  }

  resizeCanvas(): void {
    const width: number = window.innerWidth;
    const height: number = window.innerHeight;
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.canvasService.drawBackgroundImage();
 }}
