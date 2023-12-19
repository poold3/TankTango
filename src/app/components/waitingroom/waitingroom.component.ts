import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/message';
import { GameService } from 'src/app/services/game.service';
import { StateService } from 'src/app/services/state.service';
import { ServerTank, TankType } from 'src/app/tank';

@Component({
  selector: 'app-waitingroom',
  templateUrl: './waitingroom.component.html',
  styleUrls: ['./waitingroom.component.css']
})
export class WaitingroomComponent implements OnDestroy, OnInit, AfterViewInit, AfterViewChecked {
  subscriptions: Subscription[] = new Array<Subscription>();
  serverTanks: Array<ServerTank> = new Array();
  gameCode: string = "";
  tankSelection!: ServerTank;
  showTankGuide: boolean = false;
  @ViewChild("chat") chat!: ElementRef;
  chatElement!: HTMLInputElement;
  @ViewChild("sendInput") sendInput!: ElementRef;
  sendInputElement!: HTMLInputElement;
  messages: Array<Message> = new Array<Message>();

  constructor(private readonly stateService: StateService, private clipboardService: ClipboardService, private readonly gameService: GameService) {}

  ngOnInit(): void {
    this.showTankGuide = false;
    this.subscriptions.length = 0;
    this.subscriptions.push(
      this.stateService.select<ServerTank>("tankSelection").subscribe((tankSelection: ServerTank): void => {
        this.tankSelection = tankSelection;
      }),
      this.stateService.select<Array<ServerTank>>("serverTanks").subscribe((serverTanks: Array<ServerTank>): void => {
        this.serverTanks = serverTanks;
      }),
      this.stateService.select<string>("gameCode").subscribe((gameCode: string): void => {
        this.gameCode = gameCode;
      }),
      this.stateService.select<Array<Message>>("chat").subscribe((messages: Array<Message>): void => {
        this.messages = messages;
      })
    );
  }

  ngAfterViewInit(): void {
    this.chatElement = this.chat.nativeElement;
    this.sendInputElement = this.sendInput.nativeElement;
  }

  ngAfterViewChecked(): void {
    this.chatElement.scrollTop = this.chatElement.scrollHeight;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  copyGameCode(): void {
    this.clipboardService.copyFromContent(this.gameCode);
  }

  leaveGame() {
    this.gameService.leaveGame();
  }

  startRound() {
    this.gameService.startRound();
  }

  sendChatMessage() {
    const message: string = this.sendInputElement.value.trim();
    if (message.length > 0) {
      const newMessage: Message = new Message(message, this.tankSelection.gamerName, this.tankSelection.color);
      this.sendInputElement.value = "";
      this.gameService.sendChatMessage(newMessage);
    }
  }

  chatGainedFocus() {
    document.addEventListener("keydown", this.isEnterKey);
  }

  chatLostFocus() {
    document.removeEventListener("keydown", this.isEnterKey);
  }

  isEnterKey = (event: KeyboardEvent) => {
    if (event.code === "Enter") {
      this.sendChatMessage();
    }
  }
}
