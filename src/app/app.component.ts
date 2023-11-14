import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CanvasService } from './services/canvas.service';
import { StateService } from './services/state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canvas") canvas!: ElementRef;
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  showMenu: boolean = false;
  isLoading: boolean = true;
  subscriptions: Subscription[] = new Array<Subscription>();

  constructor(private readonly stateService: StateService, private readonly canvasService: CanvasService) {
    this.stateService.addSlice("showMenu", this.showMenu);
    this.stateService.addSlice("isLoading", this.isLoading);
    this.subscriptions.push(
      this.stateService.select<boolean>("showMenu").subscribe((showMenu: boolean): void => {
        this.showMenu = showMenu;
      }),
      this.stateService.select<boolean>("isLoading").subscribe((isLoading: boolean): void => {
        this.isLoading = isLoading;
      })
    );
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
  }

  resizeCanvas(): void {
    const width: number = window.innerWidth;
    const height: number = window.innerHeight;
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.canvasService.drawBackgroundImage();
 }}
